'use client'
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useForm } from "react-hook-form";
import { useRouter } from 'next/navigation';
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { AlertDescription } from "@/app/components/ui/alert";
import { motion } from 'framer-motion';
import { Loader2, Upload, MapPin, Music, CheckCircle, Clock, CreditCard, ArrowRight, ArrowLeft } from 'lucide-react';

const Autocomplete = dynamic(
  () => import('@/app/components/ui/autocomplete'),
  { ssr: false }
);

const OlaMap = dynamic(
  () => import('@/app/components/ui/olaMap'),
  { ssr: false }
);

import { fetchLocationCoordinates } from '@/utils/locationUtils';
import { TimeSlotSelector } from '../components/timeSlotSelector';

const JamRoomRegistration = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState("basic");
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]); // For actual file objects
  const [slots, setSlots] = useState([]);
  const [useAutocomplete, setUseAutocomplete] = useState(true);
  const [upiBorderColor, setUpiBorderColor] = useState('border-yellow-500');
  const [bankValidationData, setBankValidationData] = useState(null);
  const [isUpiValidated, setIsUpiValidated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Add useEffect to hide sidebar and navbar and ensure scrolling works
  useEffect(() => {
    // Add a class to the body to indicate this is the registration page
    document.body.classList.add('registration-page');
    
    // Clean up function to remove the class when component is unmounted
    return () => {
      document.body.classList.remove('registration-page');
    };
  }, []);

  const { register, handleSubmit, formState: { errors }, watch, setValue, resetField } = useForm({
    defaultValues: {
      jamRoomDetails: {
        name: "",
        description: ""
      },
      ownerDetails: {
        fullname: "",
        email: "",
        phone: ""
      },
      location: {
        address: "",
        latitude: "",
        longitude: ""
      },
      feesPerSlot: "",
      upiAddress: ""
    }
  });

  // Handler functions
  const handleLocationSelect = (selectedLocation) => {
    setValue("location.address", selectedLocation.description);
    setValue("location.latitude", selectedLocation.geometry.location.lat);
    setValue("location.longitude", selectedLocation.geometry.location.lng);
  };

  const handlePinLocationSelect = (location) => {
    setValue("location.address", location.address);
    setValue("location.latitude", location.lat);
    setValue("location.longitude", location.lon);
  };

  const validateUpiAddress = async () => {
    const upiAddress = watch("upiAddress");
    const name = watch("ownerDetails.fullname");
    const email = watch("ownerDetails.email");
    const contact = watch("ownerDetails.phone");

    try {
      const response = await fetch('http://localhost:5000/api/bank-verification/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, contact, upiAddress }),
      });

      const data = await response.json();
      if (data.success) {
        setUpiBorderColor('border-green-500');
        setBankValidationData(data.validation);
        setIsUpiValidated(true);
      } else {
        setUpiBorderColor('border-red-500');
        setBankValidationData(null);
        setIsUpiValidated(false);
      }
    } catch (error) {
      setUpiBorderColor('border-red-500');
      setBankValidationData(null);
      setIsUpiValidated(false);
    }
  };

  const revalidateUpiAddress = () => {
    resetField("upiAddress");
    setBankValidationData(null);
    setUpiBorderColor('border-yellow-500');
    setIsUpiValidated(false);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // Store the actual file objects for later upload
    setImageFiles(prevFiles => [...prevFiles, ...files]);
    
    // Create preview URLs for display
    const fileURLs = files.map(file => URL.createObjectURL(file)); 
    setImages([...images, ...fileURLs]);
  };

  const removeImage = (index) => {
    // Remove from both arrays
    setImages(images.filter((_, i) => i !== index));
    setImageFiles(imageFiles.filter((_, i) => i !== index));
  };

  // Function to upload images to S3 via your backend
  const uploadImagesToS3 = async () => {
    if (imageFiles.length === 0) return [];
    
    setUploadingImages(true);
    try {
      const formData = new FormData();
      imageFiles.forEach((file) => {
        formData.append('images', file);
      });
  
      const response = await fetch('http://localhost:5000/api/jamrooms/images', {
        method: 'POST', // Use POST for initial upload
        body: formData,
      });
    
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload images');
      }
    
      const data = await response.json();
      setUploadingImages(false);
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to upload images');
      }
      
      return data.imageUrls;
    } catch (error) {
      setUploadingImages(false);
      console.error('Error uploading images:', error);
      throw error;
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // First upload the images to S3
      const uploadedImageUrls = await uploadImagesToS3();
      
      const formData = {
        ...data,
        images: uploadedImageUrls.length > 0 ? uploadedImageUrls : images,
        bankDetails: {
          validationType: "UPI"
        },
        slots: slots,
        createdAt: new Date(),
        bankValidationData: bankValidationData
      };
      
      const response = await fetch('http://localhost:5000/api/jamrooms/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (result.success) {
        router.push('/');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step indicators with progress
  const steps = [
    { id: "basic", label: "Basic Info", icon: <Music className="w-5 h-5 mr-2" /> },
    { id: "owner", label: "Owner Details", icon: <CheckCircle className="w-5 h-5 mr-2" /> },
    { id: "location", label: "Location", icon: <MapPin className="w-5 h-5 mr-2" /> },
    { id: "additional", label: "Additional Info", icon: <Clock className="w-5 h-5 mr-2" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-zinc-900 overflow-auto py-8 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl mx-auto my-8"
      >
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#7DF9FF] to-[#00BFFF] mb-3">
            Jam Room Registration
          </h1>
          <p className="text-white/70 text-lg">
            Register your jam room to start accepting bookings
          </p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl overflow-visible">
            <CardContent className="p-8">
              <Tabs value={currentStep} onValueChange={setCurrentStep}>
                {/* Progress bar */}
                <div className="relative mb-10 mt-2">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-zinc-800 rounded-full"></div>
                  <div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-[#7DF9FF] to-[#00BFFF] rounded-full transition-all duration-300"
                    style={{ 
                      width: 
                        currentStep === "basic" ? "25%" :
                        currentStep === "owner" ? "50%" :
                        currentStep === "location" ? "75%" : "100%" 
                    }}
                  ></div>
                  
                  <div className="relative flex justify-between">
                    {steps.map((step, index) => (
                      <div key={step.id} className="flex flex-col items-center">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(step.id)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center z-10
                            ${currentStep === step.id 
                              ? 'bg-gradient-to-r from-[#7DF9FF] to-[#00BFFF] text-black'
                              : index < steps.findIndex(s => s.id === currentStep)
                                ? 'bg-gradient-to-r from-[#7DF9FF]/80 to-[#00BFFF]/80 text-black'
                                : 'bg-zinc-800 text-white/60'
                            } transition-all duration-200`}
                        >
                          {index + 1}
                        </button>
                        <span className={`mt-2 text-sm font-medium ${currentStep === step.id ? 'text-white' : 'text-white/60'}`}>
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <TabsContent value="basic" className="mt-6 space-y-8">
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="name" className="text-white text-lg mb-2 block">Jam Room Name</Label>
                      <Input
                        id="name"
                        {...register("jamRoomDetails.name", { required: true })}
                        className="bg-black/40 border-[#7DF9FF]/20 text-white placeholder-gray-400 rounded-md h-12"
                        placeholder="Enter your jam room name"
                      />
                      {errors.jamRoomDetails?.name && (
                        <AlertDescription className="text-red-400 mt-1">Name is required</AlertDescription>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-white text-lg mb-2 block">Description</Label>
                      <Textarea
                        id="description"
                        {...register("jamRoomDetails.description", { required: true })}
                        className="bg-black/40 border-[#7DF9FF]/20 text-white placeholder-gray-400 rounded-md min-h-[150px]"
                        placeholder="Describe your jam room, its equipment, ambience, etc."
                      />
                      {errors.jamRoomDetails?.description && (
                        <AlertDescription className="text-red-400 mt-1">Description is required</AlertDescription>
                      )}
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button 
                        type="button" 
                        onClick={() => setCurrentStep("owner")}
                        className="bg-gradient-to-r from-[#7DF9FF]/20 to-[#00BFFF]/40 hover:from-[#7DF9FF]/40 hover:to-[#00BFFF]/60 text-white border-[#7DF9FF]/30 px-6 py-2 rounded-lg flex items-center gap-2 transition-all"
                      >
                        Next <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="owner" className="mt-6 space-y-8">
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="fullname" className="text-white text-lg mb-2 block">Full Name</Label>
                      <Input
                        id="fullname"
                        {...register("ownerDetails.fullname", { required: true })}
                        className="bg-black/40 border-[#7DF9FF]/20 text-white placeholder-gray-400 rounded-md h-12"
                        placeholder="Your full name"
                      />
                      {errors.ownerDetails?.fullname && (
                        <AlertDescription className="text-red-400 mt-1">Full name is required</AlertDescription>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-white text-lg mb-2 block">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        {...register("ownerDetails.email", { required: true })}
                        className="bg-black/40 border-[#7DF9FF]/20 text-white placeholder-gray-400 rounded-md h-12"
                        placeholder="your.email@example.com"
                      />
                      {errors.ownerDetails?.email && (
                        <AlertDescription className="text-red-400 mt-1">Valid email is required</AlertDescription>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-white text-lg mb-2 block">Phone</Label>
                      <Input
                        id="phone"
                        {...register("ownerDetails.phone", { required: true })}
                        className="bg-black/40 border-[#7DF9FF]/20 text-white placeholder-gray-400 rounded-md h-12"
                        placeholder="+91 9876543210"
                      />
                      {errors.ownerDetails?.phone && (
                        <AlertDescription className="text-red-400 mt-1">Valid phone number is required</AlertDescription>
                      )}
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button 
                        type="button" 
                        onClick={() => setCurrentStep("basic")}
                        className="bg-black/50 hover:bg-black/70 text-white border-white/10 px-6 py-2 rounded-lg flex items-center gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" /> Previous
                      </Button>
                      <Button 
                        type="button" 
                        onClick={() => setCurrentStep("location")}
                        className="bg-gradient-to-r from-[#7DF9FF]/20 to-[#00BFFF]/40 hover:from-[#7DF9FF]/40 hover:to-[#00BFFF]/60 text-white border-[#7DF9FF]/30 px-6 py-2 rounded-lg flex items-center gap-2"
                      >
                        Next <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="location" className="mt-6 space-y-8">
  <div className="space-y-6">
    <div>
      <div className="flex justify-between items-center mb-2">
        <Label htmlFor="address" className="text-white text-lg">Address</Label>
        <Button 
          type="button" 
          onClick={() => setUseAutocomplete(!useAutocomplete)}
          className="bg-gradient-to-r from-[#7DF9FF]/20 to-[#00BFFF]/40 hover:from-[#7DF9FF]/40 hover:to-[#00BFFF]/60 text-white border-[#7DF9FF]/30 text-sm px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <MapPin className="w-4 h-4" />
          {useAutocomplete ? 'Use Pin Location' : 'Use Autocomplete'}
        </Button>
      </div>
      
      <div className="bg-black/30 p-4 rounded-lg backdrop-blur-sm border border-white/10 shadow-lg">
        {useAutocomplete ? (
          <div className="autocomplete-wrapper" style={{ color: 'white' }}>
            <Autocomplete
              apiKey="tx0FO1vtsTuqyz45MEUIJiYDTFMJOPG9bWR3Yd4k"
              onSelect={handleLocationSelect}
              initialValue={watch("location.address")}
              className="text-white"
              containerClassName="text-white"
              inputClassName="text-white bg-black/40 border-[#7DF9FF]/20"
            />
            <style jsx global>{`
              .autocomplete-wrapper input {
                color: white !important;
                background-color: rgba(0, 0, 0, 0.4) !important;
                border-color: rgba(125, 249, 255, 0.2) !important;
                height: 3rem;
                padding-left: 0.75rem;
                padding-right: 0.75rem;
                border-radius: 0.375rem;
              }
              .autocomplete-wrapper li {
                color: white !important;
                background-color: rgba(0, 0, 0, 0.7) !important;
                padding: 0.75rem;
              }
              .autocomplete-wrapper li:hover {
                background-color: rgba(0, 191, 255, 0.3) !important;
              }
              .autocomplete-wrapper div[role="combobox"] {
                color: white !important;
              }
            `}</style>
          </div>
        ) : (
          <OlaMap
            apiKey="tx0FO1vtsTuqyz45MEUIJiYDTFMJOPG9bWR3Yd4k"
            onLocationSelect={handlePinLocationSelect}
            onClose={() => setUseAutocomplete(true)}
          />
        )}
      </div>
      
      {errors.location?.address && (
        <AlertDescription className="text-red-400 mt-1">Address is required</AlertDescription>
      )}
    </div>

    <div className="grid grid-cols-2 gap-6">
      <div>
        <Label htmlFor="latitude" className="text-white text-lg mb-2 block">Latitude</Label>
        <Input
          id="latitude"
          type="number"
          step="any"
          {...register("location.latitude", { required: true })}
          className="bg-black/40 border-[#7DF9FF]/20 text-white placeholder-gray-400 rounded-md h-12"
        />
        {errors.location?.latitude && (
          <AlertDescription className="text-red-400 mt-1">Latitude is required</AlertDescription>
        )}
      </div>

      <div>
        <Label htmlFor="longitude" className="text-white text-lg mb-2 block">Longitude</Label>
        <Input
          id="longitude"
          type="number"
          step="any"
          {...register("location.longitude", { required: true })}
          className="bg-black/40 border-[#7DF9FF]/20 text-white placeholder-gray-400 rounded-md h-12"
        />
        {errors.location?.longitude && (
          <AlertDescription className="text-red-400 mt-1">Longitude is required</AlertDescription>
        )}
      </div>
    </div>

    <div className="flex justify-between pt-4">
      <Button 
        type="button" 
        onClick={() => setCurrentStep("owner")}
        className="bg-black/50 hover:bg-black/70 text-white border-white/10 px-6 py-2 rounded-lg flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" /> Previous
      </Button>
      <Button 
        type="button" 
        onClick={() => setCurrentStep("additional")}
        className="bg-gradient-to-r from-[#7DF9FF]/20 to-[#00BFFF]/40 hover:from-[#7DF9FF]/40 hover:to-[#00BFFF]/60 text-white border-[#7DF9FF]/30 px-6 py-2 rounded-lg flex items-center gap-2"
      >
        Next <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  </div>
</TabsContent>

<TabsContent value="additional" className="mt-6 space-y-8">
  <div className="space-y-6">
    <div>
      <Label htmlFor="images" className="text-white text-lg mb-2 block flex items-center">
        <Upload className="w-5 h-5 mr-2" /> Images
      </Label>
      <div className="mt-1 flex items-center justify-center w-full">
        <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-lg cursor-pointer bg-black/30 hover:bg-black/40 border-[#7DF9FF]/30">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg className="w-10 h-10 mb-3 text-[#7DF9FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
            <p className="mb-2 text-sm text-[#7DF9FF]">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-[#7DF9FF]/80">PNG, JPG or JPEG (MAX. 5MB each)</p>
          </div>
          <Input
            id="images"
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>
      </div>
      
      {/* Image preview section */}
      {images.length > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-4">
          {images.map((img, index) => (
            <div key={index} className="relative group overflow-hidden rounded-lg shadow-lg">
              <img
                src={img}
                alt={`Preview ${index}`}
                className="h-24 w-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      
      {images.length === 0 && errors.images && (
        <AlertDescription className="text-red-400 mt-1">At least one image is required</AlertDescription>
      )}
    </div>

    <div className="bg-black/30 p-6 rounded-lg backdrop-blur-sm border border-white/10 shadow-lg">
      <Label className="text-white text-lg mb-4 block flex items-center">
        <Clock className="w-5 h-5 mr-2" /> Time Slots
      </Label>
      <div className="timeslot-wrapper" style={{ color: 'white' }}>
        <TimeSlotSelector selectedSlots={slots} setSlots={setSlots} />
        <style jsx global>{`
          .timeslot-wrapper button {
            color: white !important;
            border-color: rgba(125, 249, 255, 0.3) !important;
          }
          .timeslot-wrapper button.selected {
            background-color: rgba(125, 249, 255, 0.3) !important;
            color: white !important;
          }
          .timeslot-wrapper h3, 
          .timeslot-wrapper p, 
          .timeslot-wrapper span {
            color: white !important;
          }
          .timeslot-wrapper label {
            color: rgba(255, 255, 255, 0.7) !important;
          }
        `}</style>
      </div>
    </div>

    <div>
      <Label htmlFor="feesPerSlot" className="text-white text-lg mb-2 block flex items-center">
        <CreditCard className="w-5 h-5 mr-2" /> Fees per Slot (₹)
      </Label>
      <Input
        id="feesPerSlot"
        type="number"
        {...register("feesPerSlot", { required: true })}
        className="bg-black/40 border-[#7DF9FF]/20 text-white placeholder-gray-400 rounded-md h-12"
        placeholder="e.g. 500"
      />
      {errors.feesPerSlot && (
        <AlertDescription className="text-red-400 mt-1">Fees per slot is required</AlertDescription>
      )}
    </div>

    <div>
      <Label htmlFor="upiAddress" className="text-white text-lg mb-2 block">UPI Address</Label>
      <div className="flex items-center space-x-4">
        <Input
          id="upiAddress"
          {...register("upiAddress", {
            required: true,
          })}
          className={`bg-black/40 text-white placeholder-gray-400 rounded-md h-12 border-4 ${upiBorderColor}`}
          placeholder="username@upi"
        />
        <Button
          type="button"
          onClick={isUpiValidated ? revalidateUpiAddress : validateUpiAddress}
          className={`px-4 py-2 rounded-lg whitespace-nowrap ${
            isUpiValidated 
              ? 'bg-green-600/30 hover:bg-green-600/50 text-white border border-green-500'
              : 'bg-gradient-to-r from-[#7DF9FF]/20 to-[#00BFFF]/40 hover:from-[#7DF9FF]/40 hover:to-[#00BFFF]/60 text-white border-[#7DF9FF]/30'
          }`}
        >
          {isUpiValidated ? (
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> Validated
            </div>
          ) : 'Validate UPI'}
        </Button>
      </div>
      {errors.upiAddress && (
        <AlertDescription className="text-red-400 mt-1">UPI address is required</AlertDescription>
      )}
      {isUpiValidated && bankValidationData && (
        <div className="mt-2 p-3 bg-green-600/20 border border-green-500/30 text-green-200 rounded-md">
          UPI verified successfully!
        </div>
      )}
    </div>

    <div className="flex justify-between pt-6">
      <Button 
        type="button" 
        onClick={() => setCurrentStep("location")}
        className="bg-black/50 hover:bg-black/70 text-white border-white/10 px-6 py-2 rounded-lg flex items-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" /> Previous
      </Button>
      <Button 
        type="submit" 
        disabled={isSubmitting || uploadingImages}
        className="bg-gradient-to-r from-[#7DF9FF] to-[#00BFFF] hover:from-[#7DF9FF]/90 hover:to-[#00BFFF]/90 text-black font-medium px-8 py-2 rounded-lg relative disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {(isSubmitting || uploadingImages) ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            {isSubmitting ? 'Submitting...' : 'Uploading Images...'}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span>Submit Registration</span>
          </div>
        )}
      </Button>
    </div>
  </div>
</TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </form>
      </motion.div>
    </div>
  );
};

export default JamRoomRegistration;
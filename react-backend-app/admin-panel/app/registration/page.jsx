'use client'
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useForm } from "react-hook-form";
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { motion } from 'framer-motion';

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
  const [slots, setSlots] = useState([]);
  const [useAutocomplete, setUseAutocomplete] = useState(true);
  const [upiBorderColor, setUpiBorderColor] = useState('border-yellow-500');
  const [bankValidationData, setBankValidationData] = useState(null);
  const [isUpiValidated, setIsUpiValidated] = useState(false);

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
    const fileURLs = files.map(file => URL.createObjectURL(file)); 
    setImages([...images, ...fileURLs]);
  };

  const onSubmit = async (data) => {
    const formData = {
      ...data,
      images: images,
      bankDetails: {
        validationType: "UPI"
      },
      slots: slots,
      createdAt: new Date(),
      bankValidationData: bankValidationData
    };
    
    try {
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
    }
  };

  return (
    <div className="min-h-screen bg-black overflow-auto py-8 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl mx-auto my-8"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#7DF9FF] gradient-text mb-2">
            Jam Room Registration
          </h1>
          <p className="text-white/70">
            Register your jam room to start accepting bookings
          </p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl overflow-hidden">
            <CardContent className="p-6">
              <Tabs value={currentStep} onValueChange={setCurrentStep}>
                <TabsList className="grid w-full grid-cols-4 mb-8 bg-black/30 rounded-lg">
                  <TabsTrigger value="basic" className="text-white data-[state=active]:bg-[#7DF9FF]/30 data-[state=active]:text-white">
                    Basic Info
                  </TabsTrigger>
                  <TabsTrigger value="owner" className="text-white data-[state=active]:bg-[#7DF9FF]/30 data-[state=active]:text-white">
                    Owner Details
                  </TabsTrigger>
                  <TabsTrigger value="location" className="text-white data-[state=active]:bg-[#7DF9FF]/30 data-[state=active]:text-white">
                    Location
                  </TabsTrigger>
                  <TabsTrigger value="additional" className="text-white data-[state=active]:bg-[#7DF9FF]/30 data-[state=active]:text-white">
                    Additional Info
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="basic">
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="name" className="text-white text-lg mb-2 block">Jam Room Name</Label>
                      <Input
                        id="name"
                        {...register("jamRoomDetails.name", { required: true })}
                        className="bg-black/40 border-[#7DF9FF]/20 text-white placeholder-gray-400 rounded-md"
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
                        className="bg-black/40 border-[#7DF9FF]/20 text-white placeholder-gray-400 rounded-md"
                      />
                      {errors.jamRoomDetails?.description && (
                        <AlertDescription className="text-red-400 mt-1">Description is required</AlertDescription>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        type="button" 
                        onClick={() => setCurrentStep("owner")}
                        className="bg-[#7DF9FF]/20 hover:bg-[#7DF9FF]/30 text-white border-[#7DF9FF]/30"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* Owner Details Tab */}
                <TabsContent value="owner">
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="fullname" className="text-white text-lg mb-2 block">Full Name</Label>
                      <Input
                        id="fullname"
                        {...register("ownerDetails.fullname", { required: true })}
                        className="bg-black/40 border-[#7DF9FF]/20 text-white placeholder-gray-400 rounded-md"
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
                        className="bg-black/40 border-[#7DF9FF]/20 text-white placeholder-gray-400 rounded-md"
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
                        className="bg-black/40 border-[#7DF9FF]/20 text-white placeholder-gray-400 rounded-md"
                      />
                      {errors.ownerDetails?.phone && (
                        <AlertDescription className="text-red-400 mt-1">Valid phone number is required</AlertDescription>
                      )}
                    </div>

                    <div className="flex justify-between">
                      <Button 
                        type="button" 
                        onClick={() => setCurrentStep("basic")}
                        className="bg-black/50 hover:bg-black/70 text-white border-white/10"
                      >
                        Previous
                      </Button>
                      <Button 
                        type="button" 
                        onClick={() => setCurrentStep("location")}
                        className="bg-[#7DF9FF]/20 hover:bg-[#7DF9FF]/30 text-white border-[#7DF9FF]/30"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* Location Tab */}
                <TabsContent value="location">
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label htmlFor="address" className="text-white text-lg">Address</Label>
                        <Button 
                          type="button" 
                          onClick={() => setUseAutocomplete(!useAutocomplete)}
                          className="bg-[#7DF9FF]/20 hover:bg-[#7DF9FF]/30 text-white border-[#7DF9FF]/30 text-sm"
                        >
                          {useAutocomplete ? 'Use Pin Location' : 'Use Autocomplete'}
                        </Button>
                      </div>
                      {useAutocomplete ? (
                        <Autocomplete
                          apiKey="tx0FO1vtsTuqyz45MEUIJiYDTFMJOPG9bWR3Yd4k"
                          onSelect={handleLocationSelect}
                          initialValue={watch("location.address")}
                        />
                      ) : (
                        <OlaMap
                          apiKey="tx0FO1vtsTuqyz45MEUIJiYDTFMJOPG9bWR3Yd4k"
                          onLocationSelect={handlePinLocationSelect}
                          onClose={() => setUseAutocomplete(true)}
                        />
                      )}
                      {errors.location?.address && (
                        <AlertDescription className="text-red-400 mt-1">Address is required</AlertDescription>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="latitude" className="text-white text-lg mb-2 block">Latitude</Label>
                        <Input
                          id="latitude"
                          type="number"
                          step="any"
                          {...register("location.latitude", { required: true })}
                          className="bg-black/40 border-[#7DF9FF]/20 text-white placeholder-gray-400 rounded-md"
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
                          className="bg-black/40 border-[#7DF9FF]/20 text-white placeholder-gray-400 rounded-md"
                        />
                        {errors.location?.longitude && (
                          <AlertDescription className="text-red-400 mt-1">Longitude is required</AlertDescription>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button 
                        type="button" 
                        onClick={() => setCurrentStep("owner")}
                        className="bg-black/50 hover:bg-black/70 text-white border-white/10"
                      >
                        Previous
                      </Button>
                      <Button 
                        type="button" 
                        onClick={() => setCurrentStep("additional")}
                        className="bg-[#7DF9FF]/20 hover:bg-[#7DF9FF]/30 text-white border-[#7DF9FF]/30"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* Additional Info Tab */}
                <TabsContent value="additional">
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="images" className="text-white text-lg mb-2 block">Images</Label>
                      <div className="flex items-center justify-center w-full">
                        <label className="w-full flex flex-col items-center px-4 py-6 bg-black/40 rounded-lg cursor-pointer border border-dashed border-[#7DF9FF]/30 hover:bg-[#7DF9FF]/10 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#7DF9FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span className="mt-2 text-sm text-[#7DF9FF]">Add Images</span>
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
                      
                      {images.length > 0 && (
                        <div className="grid grid-cols-3 gap-4 mt-4">
                          {images.map((image, index) => (
                            <div key={index} className="relative h-24 bg-black/20 rounded-md overflow-hidden">
                              <img src={image} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {errors.images && (
                        <AlertDescription className="text-red-400 mt-1">At least one image is required</AlertDescription>
                      )}
                    </div>

                    <div>
                      <Label className="text-white text-lg mb-2 block">Time Slots</Label>
                      <TimeSlotSelector selectedSlots={slots} setSlots={setSlots} />
                    </div>

                    <div>
                      <Label htmlFor="feesPerSlot" className="text-white text-lg mb-2 block">Fees per Slot</Label>
                      <Input
                        id="feesPerSlot"
                        type="number"
                        {...register("feesPerSlot", { required: true })}
                        className="bg-black/40 border-[#7DF9FF]/20 text-white placeholder-gray-400 rounded-md"
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
                          {...register("upiAddress", { required: true })}
                          className={`bg-black/40 border-[#7DF9FF]/20 text-white placeholder-gray-400 rounded-md border-4 ${upiBorderColor}`}
                        />
                        <Button
                          type="button"
                          onClick={isUpiValidated ? revalidateUpiAddress : validateUpiAddress}
                          className={isUpiValidated ? 'bg-green-500/20 text-white' : 'bg-[#7DF9FF]/20 hover:bg-[#7DF9FF]/30 text-white'}
                        >
                          {isUpiValidated ? 'Revalidate' : 'Validate UPI'}
                        </Button>
                      </div>
                      {errors.upiAddress && (
                        <AlertDescription className="text-red-400 mt-1">UPI address is required</AlertDescription>
                      )}
                    </div>

                    <div className="flex justify-between">
                      <Button 
                        type="button" 
                        onClick={() => setCurrentStep("location")}
                        className="bg-black/50 hover:bg-black/70 text-white border-white/10"
                      >
                        Previous
                      </Button>
                      <Button 
                        type="submit"
                        className="bg-[#7DF9FF]/40 hover:bg-[#7DF9FF]/60 text-white"
                      >
                        Submit Registration
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
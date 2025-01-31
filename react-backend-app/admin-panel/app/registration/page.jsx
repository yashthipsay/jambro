'use client'
import React, { useState } from 'react';
import dynamic from 'next/dynamic'; // Import dynamic
import { useForm } from "react-hook-form";
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import Autocomplete from '@/app/components/ui/autocomplete';
import OlaMap from '@/app/components/ui/olaMap';
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

  const handleLocationSelect = (selectedLocation) => {
    // Update form values with selected location
    setValue("location.address", selectedLocation.description);
    setValue("location.latitude", selectedLocation.geometry.location.lat);
    setValue("location.longitude", selectedLocation.geometry.location.lng);
    console.log(selectedLocation);    
    // You might want to fetch the coordinates for the selected location
    // and update the latitude and longitude fields
  };

  const handlePinLocationSelect = (location) => {
    setValue("location.address", location.address);
    setValue("location.latitude", location.lat);
    setValue("location.longitude", location.lon);
    console.log(location);
  };

  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const validatePhone = (phone) => {
    return String(phone).match(/^\d{10}$/);
  };

  const validateUPI = (upi) => {
    return String(upi).match(/^[a-zA-Z0-9.-]{2,256}@[a-zA-Z][a-zA-Z]{2,64}$/);
  };

  const addSlot = () => {
    const newSlot = {
      slotId: slots.length + 1,
      startTime: "",
      endTime: "",
      isBooked: false,
      bookedBy: null
    };
    setSlots([...slots, newSlot]);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    // In a real application, you would upload these files to your server/storage
    const fileURLs = files.map(file => URL.createObjectURL(file)); 
    setImages([...images, ...fileURLs]);
  };

  const validateUpiAddress = async () => {
    const upiAddress = watch("upiAddress");
    const name = watch("ownerDetails.fullname");
    const email = watch("ownerDetails.email");
    const contact = watch("ownerDetails.phone");

    try {
      const response = await fetch('http://3.110.42.247:5000/api/bank-verification/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, contact, upiAddress }),
      });

      const data = await response.json();
      console.log(data)
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
      console.error('Error validating UPI address:', error);
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

  const onSubmit = async (data) => {
    // Combine all the data
    const formData = {
      ...data,
      images: images,
      bankDetails: {
        validationType: "UPI"
        // add any other required bank details here
      },
      slots: slots,
      createdAt: new Date(),
      bankValidationData: bankValidationData // Include bank validation data
    };
    
    console.log('Form submitted:', formData);

    try {
      const response = await fetch('http://3.110.42.247:5000/api/jamrooms/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (result.success) {
        // Handle successful registration (e.g., redirect to a success page)
        console.log('Registration successful:', result.data);
        router.push('/');
      } else {
        // Handle registration failure
        console.error('Registration failed:', result.message);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Jam Room Registration</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={currentStep} onValueChange={setCurrentStep}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="owner">Owner Details</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="additional">Additional Info</TabsTrigger>
            </TabsList>

            <TabsContent value="basic">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Jam Room Name</Label>
                  <Input
                    id="name"
                    {...register("jamRoomDetails.name", { required: true })}
                  />
                  {errors.jamRoomDetails?.name && (
                    <AlertDescription>Name is required</AlertDescription>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register("jamRoomDetails.description", { required: true })}
                  />
                  {errors.jamRoomDetails?.description && (
                    <AlertDescription>Description is required</AlertDescription>
                  )}
                </div>

                <Button type="button" onClick={() => setCurrentStep("owner")}>
                  Next
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="owner">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullname">Full Name</Label>
                  <Input
                    id="fullname"
                    {...register("ownerDetails.fullname", { required: true })}
                  />
                  {errors.ownerDetails?.fullname && (
                    <AlertDescription>Full name is required</AlertDescription>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("ownerDetails.email", {
                      required: true,

                    })}
                  />
                  {errors.ownerDetails?.email && (
                    <AlertDescription>Valid email is required</AlertDescription>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    {...register("ownerDetails.phone", {
                      required: true,

                    })}
                  />
                  {errors.ownerDetails?.phone && (
                    <AlertDescription>Valid phone number is required</AlertDescription>
                  )}
                </div>

                <div className="flex space-x-4">
                  <Button type="button" onClick={() => setCurrentStep("basic")}>
                    Previous
                  </Button>
                  <Button type="button" onClick={() => setCurrentStep("location")}>
                    Next
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="location">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label htmlFor="address">Address</Label>
                  <Button type="button" onClick={() => setUseAutocomplete(!useAutocomplete)}>
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
                  <AlertDescription>Address is required</AlertDescription>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    {...register("location.latitude", { required: true })}
                  />
                  {errors.location?.latitude && (
                    <AlertDescription>Latitude is required</AlertDescription>
                  )}
                </div>

                <div>
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    {...register("location.longitude", { required: true })}
                  />
                  {errors.location?.longitude && (
                    <AlertDescription>Longitude is required</AlertDescription>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="additional">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="images">Images</Label>
                  <Input
                    id="images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="mt-1"
                  />
                  {images.length === 0 && (
                    <AlertDescription>At least one image is required</AlertDescription>
                  )}
                </div>

                <div>
                  <Label>Time Slots</Label>
                  <TimeSlotSelector     selectedSlots={slots} 
    setSlots={setSlots} />
                </div>

                <div>
                  <Label htmlFor="feesPerSlot">Fees per Slot</Label>
                  <Input
                    id="feesPerSlot"
                    type="number"
                    {...register("feesPerSlot", { required: true })}
                  />
                  {errors.feesPerSlot && (
                    <AlertDescription>Fees per slot is required</AlertDescription>
                  )}
                </div>

                <div>
                  <Label htmlFor="upiAddress">UPI Address</Label>
                  <div className="flex items-center space-x-4">
                    <Input
                      id="upiAddress"
                      {...register("upiAddress", {
                        required: true,
                      })}
                      className={`border-4 ${upiBorderColor}`}
                    />
                    <Button
                      type="button"
                      onClick={isUpiValidated ? revalidateUpiAddress : validateUpiAddress}
                      className={isUpiValidated ? 'bg-gray-700 text-white' : ''}
                    >
                      {isUpiValidated ? 'Revalidate' : 'Validate UPI'}
                    </Button>
                  </div>

                </div>

                <div className="flex space-x-4">
                  <Button type="button" onClick={() => setCurrentStep("location")}>
                    Previous
                  </Button>
                  <Button type="submit">Submit Registration</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </form>
  );
};

export default JamRoomRegistration;
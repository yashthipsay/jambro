'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import dynamic from 'next/dynamic';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { ErrorBoundary } from 'next/dist/client/components/error-boundary';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Edit2, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Autocomplete from '@/app/components/ui/autocomplete';
import OlaMap from '@/app/components/ui/olaMap';
import { TimeSlotSelector } from '../components/timeSlotSelector';
import { DashboardLayout } from '../components/DashboardLayout';

const ProfileSection = ({
  title,
  children,
  onEdit,
  isEditing,
  onSave,
  onCancel,
}) => (
  <Card className="relative group glass-card bg-gradient-to-b from-white/10 to-purple-500/10">
    <CardHeader>
      <div className="flex justify-between items-center">
        <CardTitle className="text-[#7DF9FF] font-audiowide">{title}</CardTitle>
        {!isEditing && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onEdit}
          >
            <Edit2 className="h-5 w-5 text-[#7DF9FF]/60 hover:text-[#7DF9FF] transition-colors" />
          </motion.button>
        )}
        {isEditing && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onSave}
              className="bg-[#7DF9FF]/20 hover:bg-[#7DF9FF]/30 text-white border-[#7DF9FF]/30"
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancel}
              className="bg-black/40 hover:bg-black/50 text-white border-[#7DF9FF]/30"
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </div>
        )}
      </div>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="p-4 bg-red-50 rounded-lg">
      <div className="flex items-center gap-2 text-red-600 mb-2">
        <AlertCircle className="h-5 w-5" />
        <h3 className="font-medium">Something went wrong</h3>
      </div>
      <p className="text-sm text-red-500 mb-4">{error?.message}</p>
      <Button onClick={resetErrorBoundary}>Try Again</Button>
    </div>
  );
}

export default function Profile() {
  const { user } = useUser();
  const { toast } = useToast();
  const [jamRoomData, setJamRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState(null);
  const [useAutocomplete, setUseAutocomplete] = useState(true);
  const { register, handleSubmit, reset, setValue, watch } = useForm();
  // Add new state for temporary image previews
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  useEffect(() => {
    const fetchJamRoomData = async () => {
      if (!user?.email) return;
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:5000/api/jamrooms/email/${user.email}`
        );
        const data = await response.json();
        if (data.success) {
          setJamRoomData(data.data);
          reset(data.data);
        } else {
          toast({
            title: 'Error',
            description: data.message || 'Failed to load data',
            variant: 'destructive',
          });
        }
      } catch (err) {
        toast({
          title: 'Error',
          description: err.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchJamRoomData();
  }, [user, reset, toast]);

  const handleSectionEdit = (section) => {
    setEditingSection(section);
  };

  // Update image upload handler
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles((prev) => [...prev, ...files]);

    // Create preview URLs
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleSectionSave = async (section) => {
    try {
      const formData = watch();

      if (section === 'additional') {
        // Handle images separately if there are any new uploads
        const existingImages =
          formData.images?.filter((image) => !image.startsWith('blob:')) || [];

        if (imageFiles.length > 0) {
          const uploadFormData = new FormData();
          formData.images?.forEach((image) => {
            if (!image.startsWith('blob:'))
              uploadFormData.append('existingImages', image);
          });
          imageFiles.forEach((file) => uploadFormData.append('images', file));

          const imageUploadResponse = await fetch(
            `http://localhost:5000/api/jamrooms/images`,
            { method: 'POST', body: uploadFormData }
          );
          const imageData = await imageUploadResponse.json();
          if (!imageData.success) throw new Error('Failed to upload images');

          // Merge existing images with the new image URLs
          formData.images = [...existingImages, ...imageData.imageUrls];
        }
        console.log(`Formdata for ${section} update:`, formData);

        // Handle feesPerSlot and slots update
        const response = await fetch(
          `http://localhost:5000/api/jamrooms/id/${jamRoomData._id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              feesPerSlot: parseInt(formData.feesPerSlot),
              slots: formData.slots,
              images: formData.images,
            }),
          }
        );

        const data = await response.json();
        console.log(`Data for ${section} update:`, data);
        if (!data.success) throw new Error(data.message || 'Update failed');

        setJamRoomData(data.data);
        console.log('Updated jam room data:', data.data);
        setEditingSection(null);
        toast({
          title: 'Success',
          description: 'Changes saved.',
          variant: 'default',
        });
        return;
      }

      // Handle other sections as before
      const response = await fetch(
        `http://localhost:5000/api/jamrooms/id/${jamRoomData._id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [section]: formData[section] }),
        }
      );

      const data = await response.json();

      if (!data.success) throw new Error(data.message || 'Update failed');

      setJamRoomData(data.data);
      setEditingSection(null);
      toast({
        title: 'Success',
        description: 'Changes saved.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error updating jam room:', error);
      toast({
        title: 'Error',
        description: error?.message,
        variant: 'destructive',
      });
    }
  };

  const handleSectionCancel = () => {
    reset(jamRoomData);
    setEditingSection(null);
  };

  const handleLocationSelect = (selectedLocation) => {
    // Update form values with selected location
    setValue('location.address', selectedLocation.description);
    setValue('location.latitude', selectedLocation.geometry.location.lat);
    setValue('location.longitude', selectedLocation.geometry.location.lng);
    console.log(selectedLocation);
    // You might want to fetch the coordinates for the selected location
    // and update the latitude and longitude fields
  };

  const handlePinLocationSelect = (location) => {
    setValue('location.address', location.address);
    setValue('location.latitude', location.lat);
    setValue('location.longitude', location.lon);
    console.log(location);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="flex-1 p-6 mt-16 ml-64 h-[calc(100vh-6rem)] overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-audiowide mb-6 text-[#7DF9FF]">
              Profile Settings
            </h1>

            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6 glass-card">
                <TabsTrigger
                  value="basic"
                  className="text-[#7DF9FF]/60 data-[state=active]:text-[#7DF9FF] font-syncopate"
                >
                  Basic Info
                </TabsTrigger>
                <TabsTrigger
                  value="owner"
                  className="text-[#7DF9FF]/60 data-[state=active]:text-[#7DF9FF] font-syncopate"
                >
                  Owner Details
                </TabsTrigger>
                <TabsTrigger
                  value="location"
                  className="text-[#7DF9FF]/60 data-[state=active]:text-[#7DF9FF] font-syncopate"
                >
                  Location
                </TabsTrigger>
                <TabsTrigger
                  value="additional"
                  className="text-[#7DF9FF]/60 data-[state=active]:text-[#7DF9FF] font-syncopate"
                >
                  Additional Info
                </TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                <TabsContent value="basic">
                  <ProfileSection
                    title="Basic Information"
                    isEditing={editingSection === 'jamRoomDetails'}
                    onEdit={() => handleSectionEdit('jamRoomDetails')}
                    onSave={() => handleSectionSave('jamRoomDetails')}
                    onCancel={handleSectionCancel}
                  >
                    <div className="space-y-4">
                      <div>
                        <Label className="text-[#7DF9FF]/80">
                          Jam Room Name
                        </Label>
                        {editingSection === 'jamRoomDetails' ? (
                          <Input
                            {...register('jamRoomDetails.name')}
                            defaultValue={jamRoomData.jamRoomDetails.name}
                          />
                        ) : (
                          <p className="text-lg text-[#7DF9FF]">
                            {jamRoomData.jamRoomDetails.name}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="text-[#7DF9FF]/80">Description</Label>
                        {editingSection === 'jamRoomDetails' ? (
                          <Textarea
                            {...register('jamRoomDetails.description')}
                            defaultValue={
                              jamRoomData.jamRoomDetails.description
                            }
                          />
                        ) : (
                          <p className="text-lg text-[#7DF9FF]">
                            {jamRoomData.jamRoomDetails.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </ProfileSection>
                </TabsContent>

                <TabsContent value="owner">
                  <ProfileSection
                    title="Owner Information"
                    isEditing={editingSection === 'ownerDetails'}
                    onEdit={() => handleSectionEdit('ownerDetails')}
                    onSave={() => handleSectionSave('ownerDetails')}
                    onCancel={handleSectionCancel}
                  >
                    <div className="space-y-4">
                      <div>
                        <Label className="text-[#7DF9FF]/80">Owner Name</Label>
                        {editingSection === 'ownerDetails' ? (
                          <Input
                            {...register('ownerDetails.fullname')}
                            defaultValue={jamRoomData.ownerDetails.fullname}
                          />
                        ) : (
                          <p className="text-lg text-[#7DF9FF]">
                            {jamRoomData.ownerDetails.fullname}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="text-[#7DF9FF]/80">
                          Email Address
                        </Label>
                        {editingSection === 'ownerDetails' ? (
                          <Input
                            {...register('ownerDetails.email')}
                            defaultValue={jamRoomData.ownerDetails.email}
                          />
                        ) : (
                          <p className="text-lg text-[#7DF9FF]">
                            {jamRoomData.ownerDetails.email}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="text-[#7DF9FF]/80">
                          Phone Number
                        </Label>
                        {editingSection === 'ownerDetails' ? (
                          <Input
                            {...register('ownerDetails.phone')}
                            defaultValue={jamRoomData.ownerDetails.phone}
                          />
                        ) : (
                          <p className="text-lg text-[#7DF9FF]">
                            {jamRoomData.ownerDetails.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </ProfileSection>
                </TabsContent>

                <TabsContent value="location">
                  <ProfileSection
                    title="Location Information"
                    isEditing={editingSection === 'location'}
                    onEdit={() => handleSectionEdit('location')}
                    onSave={() => handleSectionSave('location')}
                    onCancel={handleSectionCancel}
                  >
                    {editingSection === 'location' ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <Label className="text-[#7DF9FF]/80">Address</Label>
                          <Button
                            type="button"
                            onClick={() => setUseAutocomplete(!useAutocomplete)}
                          >
                            {useAutocomplete
                              ? 'Use Pin Location'
                              : 'Use Autocomplete'}
                          </Button>
                        </div>
                        {useAutocomplete ? (
                          <Autocomplete
                            apiKey="tx0FO1vtsTuqyz45MEUIJiYDTFMJOPG9bWR3Yd4k"
                            onSelect={handleLocationSelect}
                            initialValue={watch('location.address')}
                          />
                        ) : (
                          <OlaMap
                            apiKey="tx0FO1vtsTuqyz45MEUIJiYDTFMJOPG9bWR3Yd4k"
                            onLocationSelect={handlePinLocationSelect}
                            onClose={() => setUseAutocomplete(true)}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-lg text-[#7DF9FF]">
                          {jamRoomData.location.address}
                        </p>
                        <p className="text-sm text-gray-500">
                          Lat: {jamRoomData.location.latitude}, Long:{' '}
                          {jamRoomData.location.longitude}
                        </p>
                      </div>
                    )}
                  </ProfileSection>
                </TabsContent>

                <TabsContent value="additional">
                  <ProfileSection
                    title="Additional Information"
                    isEditing={editingSection === 'additional'}
                    onEdit={() => handleSectionEdit('additional')}
                    onSave={() => handleSectionSave('additional')}
                    onCancel={handleSectionCancel}
                  >
                    <div className="space-y-4">
                      <div>
                        <Label className="text-[#7DF9FF]/80">Images</Label>
                        {editingSection === 'additional' ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4 mb-4">
                              {/* Show existing images */}
                              {jamRoomData.images.map((image, index) => (
                                <div
                                  key={`existing-${index}`}
                                  className="relative group"
                                >
                                  <img
                                    src={image}
                                    alt={`Jam Room ${index + 1}`}
                                    className="w-full h-32 object-cover rounded-lg"
                                  />
                                  <button
                                    onClick={() => {
                                      const newImages =
                                        jamRoomData.images.filter(
                                          (_, i) => i !== index
                                        );
                                      // Update both the jamRoomData state and the form value
                                      setJamRoomData((prev) => ({
                                        ...prev,
                                        images: newImages,
                                      }));
                                      setValue('images', newImages);
                                    }}
                                    className="absolute top-2 right-2 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="h-4 w-4 text-white" />
                                  </button>
                                </div>
                              ))}
                              {/* Show new image previews */}
                              {imagePreviews.map((preview, index) => (
                                <div
                                  key={`preview-${index}`}
                                  className="relative group"
                                >
                                  <img
                                    src={preview}
                                    alt={`New Upload ${index + 1}`}
                                    className="w-full h-32 object-cover rounded-lg"
                                  />
                                  <button
                                    onClick={() => {
                                      URL.revokeObjectURL(preview);
                                      setImagePreviews((prev) =>
                                        prev.filter((_, i) => i !== index)
                                      );
                                      setImageFiles((prev) =>
                                        prev.filter((_, i) => i !== index)
                                      );
                                    }}
                                    className="absolute top-2 right-2 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="h-4 w-4 text-white" />
                                  </button>
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center justify-center w-full">
                              <label className="w-full flex flex-col items-center px-4 py-6 glass-card rounded-lg cursor-pointer hover:bg-primary/5">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-8 w-8 text-white"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                  />
                                </svg>
                                <span className="mt-2 text-sm text-white">
                                  Add Images
                                </span>
                                <input
                                  type="file"
                                  className="hidden"
                                  multiple
                                  accept="image/*"
                                  onChange={handleImageUpload}
                                />
                              </label>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-4">
                            {jamRoomData.images.map((image, index) => (
                              <div key={index} className="relative">
                                <img
                                  src={image}
                                  alt={`Jam Room ${index + 1}`}
                                  className="w-full h-32 object-cover rounded-lg"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <Label className="text-[#7DF9FF]/80">
                          Fees per Slot
                        </Label>
                        {editingSection === 'additional' ? (
                          <Input
                            type="number"
                            {...register('feesPerSlot')}
                            defaultValue={jamRoomData.feesPerSlot}
                          />
                        ) : (
                          <p className="text-lg text-[#7DF9FF]">
                            ₹{jamRoomData.feesPerSlot}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="text-[#7DF9FF]/80">Time Slots</Label>
                        {editingSection === 'additional' ? (
                          <TimeSlotSelector
                            selectedSlots={watch('slots') || jamRoomData.slots}
                            setSlots={(newSlots) => {
                              try {
                                // Validate newSlots array
                                if (!Array.isArray(newSlots)) {
                                  throw new Error(
                                    'Selected slots must be an array'
                                  );
                                }

                                // Ensure slots are properly formatted and have required properties
                                const formattedSlots = newSlots.map(
                                  (slot, index) => {
                                    if (!slot.startTime || !slot.endTime) {
                                      throw new Error(
                                        `Invalid time format for slot ${index + 1}`
                                      );
                                    }

                                    // Validate time format (HH:mm)
                                    const timeRegex =
                                      /^([0-1][0-9]|2[0-3]):00$/;
                                    if (
                                      !timeRegex.test(slot.startTime) ||
                                      !timeRegex.test(slot.endTime)
                                    ) {
                                      throw new Error(
                                        `Invalid time format for slot ${index + 1}. Expected HH:00 format`
                                      );
                                    }

                                    return {
                                      slotId: slot.slotId,
                                      startTime: slot.startTime,
                                      endTime: slot.endTime,
                                      isBooked: false,
                                      bookedBy: null,
                                    };
                                  }
                                );

                                // Check for duplicate slot IDs
                                const slotIds = new Set();
                                formattedSlots.forEach((slot) => {
                                  if (slotIds.has(slot.slotId)) {
                                    throw new Error(
                                      `Duplicate slot ID found: ${slot.slotId}`
                                    );
                                  }
                                  slotIds.add(slot.slotId);
                                });

                                // Sort slots by start time
                                formattedSlots.sort((a, b) => {
                                  return (
                                    parseInt(a.startTime) -
                                    parseInt(b.startTime)
                                  );
                                });

                                setValue('slots', formattedSlots);
                                toast({
                                  title: 'Success',
                                  description: `${formattedSlots.length} slots updated successfully`,
                                  variant: 'default',
                                });
                              } catch (error) {
                                console.error('Error formatting slots:', error);
                                toast({
                                  title: 'Error updating slots',
                                  description: error.message,
                                  variant: 'destructive',
                                });
                              }
                            }}
                          />
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            {jamRoomData.slots.map((slot) => (
                              <div
                                key={slot.slotId}
                                className="p-2 bg-gray-50 rounded"
                              >
                                {slot.startTime} - {slot.endTime}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </ProfileSection>
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

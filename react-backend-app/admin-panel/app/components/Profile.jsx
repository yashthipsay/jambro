'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@auth0/nextjs-auth0/client'
import { useForm } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { Label } from "./ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Alert, AlertDescription } from "./ui/alert"
import { Edit2, Save, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Autocomplete from './ui/autocomplete'
import OlaMap from './ui/olaMap'
import { TimeSlotSelector } from '../components/timeSlotSelector'
import { DashboardLayout } from '../components/DashboardLayout'

const ProfileSection = ({ title, children, onEdit, isEditing, onSave, onCancel }) => (
    <Card className="relative group bg-black bg-opacity-80 backdrop-blur-md border border-emerald shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{title}</CardTitle>
          {!isEditing && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={onEdit}
            >
              <Edit2 className="h-5 w-5 text-emerald hover:text-cream transition-colors" />
            </motion.button>
          )}
          {isEditing && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={onSave} className="border-emerald text-emerald hover:bg-emerald hover:text-black">
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={onCancel} className="border-blush text-blush hover:bg-blush hover:text-black">
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )

  export default function Profile() {
    const { user } = useUser()
    const [jamRoomData, setJamRoomData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [editingSection, setEditingSection] = useState(null)
    const [useAutocomplete, setUseAutocomplete] = useState(true)
    const { register, handleSubmit, reset, setValue, watch } = useForm()

    useEffect(() => {
        const fetchJamRoomData = async () => {
          if (user?.email) {
            try {
              const response = await fetch(`http://localhost:5000/api/jamrooms/email/${user.email}`)
              const data = await response.json()
              if (data.success) {
                setJamRoomData(data.data)
                reset(data.data)
              }
            } catch (error) {
              console.error('Error fetching jam room data:', error)
            } finally {
              setLoading(false)
            }
          }
        }
    
        fetchJamRoomData()
      }, [user, reset])

      const handleSectionEdit = (section) => {
        setEditingSection(section)
      }

      const handleSectionSave = async (section) => {
        try {
          const formData = watch()
          const response = await fetch(`http://localhost:5000/api/jamrooms/${jamRoomData._id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ [section]: formData[section] }),
          })
    
          const data = await response.json()
          if (data.success) {
            setJamRoomData(data.data)
            setEditingSection(null)
          }
        } catch (error) {
          console.error('Error updating jam room:', error)
        }
      }

      const handleSectionCancel = () => {
        reset(jamRoomData)
        setEditingSection(null)
      }

      const handleLocationSelect = (selectedLocation) => {
        setValue("location.address", selectedLocation.description)
        setValue("location.latitude", selectedLocation.geometry.location.lat)
        setValue("location.longitude", selectedLocation.geometry.location.lng)
      }
    
      if (loading) {
        return (
          <DashboardLayout>
            <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald"></div>
            </div>
          </DashboardLayout>
        );
      }

      return (
        <DashboardLayout>
          <div className="p-6 space-y-6 max-w-4xl mx-auto">
          <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
            <h1 className="text-4xl font-audiowide mb-6 gradient-text">Profile Settings</h1>
    
            <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6 glass-card">
              <TabsTrigger 
                value="basic"
                className="text-white data-[state=active]:bg-violet data-[state=active]:text-white font-syncopate"
              >
                Basic Info
              </TabsTrigger>
              <TabsTrigger 
                value="owner"
                className="text-white data-[state=active]:bg-violet data-[state=active]:text-white font-syncopate"
              >
                Owner Details
              </TabsTrigger>
              <TabsTrigger 
                value="location"
                className="text-white data-[state=active]:bg-violet data-[state=active]:text-white font-syncopate"
              >
                Location
              </TabsTrigger>
              <TabsTrigger 
                value="additional"
                className="text-white data-[state=active]:bg-violet data-[state=active]:text-white font-syncopate"
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
                      <Label>Jam Room Name</Label>
                      {editingSection === 'jamRoomDetails' ? (
                        <Input
                          {...register('jamRoomDetails.name')}
                          defaultValue={jamRoomData.jamRoomDetails.name}
                        />
                      ) : (
                        <p className="text-lg">{jamRoomData.jamRoomDetails.name}</p>
                      )}
                    </div>
                    <div>
                      <Label>Description</Label>
                      {editingSection === 'jamRoomDetails' ? (
                        <Textarea
                          {...register('jamRoomDetails.description')}
                          defaultValue={jamRoomData.jamRoomDetails.description}
                        />
                      ) : (
                        <p className="text-gray-600">{jamRoomData.jamRoomDetails.description}</p>
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
                        <Label>Owner Name</Label>
                        {editingSection === 'ownerDetails' ? (
                          <Input
                            {...register('ownerDetails.name')}
                            defaultValue={jamRoomData.ownerDetails.name}
                          />
                        ) : (
                          <p className="text-lg">{jamRoomData.ownerDetails.fullname}</p>
                        )}
                    </div>
                    <div>
                        <Label>Email Address</Label>
                        {editingSection === 'ownerDetails' ? (
                          <Input
                            {...register('ownerDetails.email')}
                            defaultValue={jamRoomData.ownerDetails.email}
                          />
                        ) : (
                          <p className="text-lg">{jamRoomData.ownerDetails.email}</p>
                        )}
                    </div>
                    <div>
                        <Label>Phone Number</Label>
                        {editingSection === 'ownerDetails' ? (
                          <Input
                            {...register('ownerDetails.phone')}
                            defaultValue={jamRoomData.ownerDetails.phone}
                          />
                        ) : (
                          <p className="text-lg">{jamRoomData.ownerDetails.phone}</p>
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
                        <Label>Address</Label>
                        <Button 
                          type="button" 
                          onClick={() => setUseAutocomplete(!useAutocomplete)}
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
                          onLocationSelect={handleLocationSelect}
                          onClose={() => setUseAutocomplete(true)}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-lg">{jamRoomData.location.address}</p>
                      <p className="text-sm text-gray-500">
                        Lat: {jamRoomData.location.latitude}, 
                        Long: {jamRoomData.location.longitude}
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
                      <Label>Fees per Slot</Label>
                      {editingSection === 'additional' ? (
                        <Input
                          type="number"
                          {...register('feesPerSlot')}
                          defaultValue={jamRoomData.feesPerSlot}
                        />
                      ) : (
                        <p className="text-lg">₹{jamRoomData.feesPerSlot}</p>
                      )}
                    </div>
                    <div>
                      <Label>Time Slots</Label>
                      {editingSection === 'additional' ? (
                        <TimeSlotSelector
                          selectedSlots={jamRoomData.slots}
                          setSlots={(slots) => setValue('slots', slots)}
                        />
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {jamRoomData.slots.map((slot) => (
                            <div key={slot.slotId} className="p-2 bg-gray-50 rounded">
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
        </DashboardLayout>
      )
  }
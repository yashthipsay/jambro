import { useState } from "react"
import { Button, Card, CardContent, Typography, Divider, Collapse, IconButton } from "@mui/material"
import { useNavigate } from "react-router-dom"
import { MapPin, Music, ArrowLeft, Calendar, Instagram, ChevronDown, ChevronUp, Info, Clock } from "lucide-react"

function JamRoomDetails() {
  const navigate = useNavigate()
  const selectedRoom = JSON.parse(localStorage.getItem("selectedJamRoom"))
  const [expanded, setExpanded] = useState(false)

  if (!selectedRoom) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-md text-center">
          <Music className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-4">No Jam Room selected</h1>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={() => navigate("/")}
            startIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Go Back to Finder
          </Button>
        </div>
      </div>
    )
  }

  const userPosition = {
    lat: selectedRoom.userLatitude,
    lng: selectedRoom.userLongitude,
  }

  const roomPosition = {
    lat: selectedRoom.location.latitude,
    lng: selectedRoom.location.longitude,
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="mb-4 flex items-center">
          <Button
            variant="text"
            color="primary"
            onClick={() => navigate("/")}
            startIcon={<ArrowLeft className="w-4 h-4" />}
            className="px-0"
          >
            Back
          </Button>
        </div>

        <Card className="mb-4 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-indigo-600 p-4 text-white">
            <Typography variant="h5" className="font-bold">
              {selectedRoom.name}
            </Typography>
          </div>
          <CardContent className="p-4">
            <div className="flex items-center mb-4">
              <MapPin className="w-5 h-5 text-indigo-500 mr-2" />
              <Typography variant="body2" color="textSecondary">
                {selectedRoom.distance.toFixed(2)} km from your location
              </Typography>
            </div>

            {/* Image Carousel */}
            {selectedRoom.images && selectedRoom.images.length > 0 && (
              <div className="relative w-full h-52 mb-4 rounded-lg overflow-hidden">
                <img 
                  src={selectedRoom.images[0]} 
                  alt={selectedRoom.name}
                  className="w-full h-full object-cover"
                />
                {selectedRoom.images.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black/50 text-white rounded-full px-2 py-1 text-xs">
                    +{selectedRoom.images.length - 1} more
                  </div>
                )}
              </div>
            )}

            <Divider className="my-4" />

            {/* Description */}
            <Typography variant="body2" className="mb-4 text-gray-700">
              {selectedRoom.description || "A cozy jam room perfect for your music sessions."}
            </Typography>

            <Typography variant="subtitle2" className="text-gray-600 mb-2">
              Facilities
            </Typography>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-gray-50 p-2 rounded-lg text-center">
                <Typography variant="body2">Air Conditioned</Typography>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg text-center">
                <Typography variant="body2">Sound Proof</Typography>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg text-center">
                <Typography variant="body2">Instruments</Typography>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg text-center">
                <Typography variant="body2">Parking</Typography>
              </div>
            </div>

            <Typography variant="subtitle2" className="text-gray-600 mb-2">
              Price
            </Typography>
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <div className="flex justify-between items-center">
                <Typography variant="body2">Per Slot</Typography>
                <Typography variant="body1" className="font-semibold">
                  ₹{selectedRoom.feesPerSlot || "500"}
                </Typography>
              </div>
            </div>

            {/* Additional details dropdown */}
            <div className="bg-gray-50 rounded-lg overflow-hidden mb-4">
              <div 
                className="flex justify-between items-center p-3 cursor-pointer"
                onClick={() => setExpanded(!expanded)}
              >
                <div className="flex items-center">
                  <Info className="w-4 h-4 text-indigo-500 mr-2" />
                  <Typography variant="subtitle2">Additional Details</Typography>
                </div>
                <IconButton size="small">
                  {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </IconButton>
              </div>
              
              <Collapse in={expanded}>
                <div className="px-3 pb-3 space-y-3">
                  {/* Opening Hours */}
                  <div>
                    <Typography variant="body2" className="text-gray-500 font-medium flex items-center">
                      <Clock className="w-4 h-4 mr-1" /> Opening Hours
                    </Typography>
                    <Typography variant="body2" className="mt-1">
                      {selectedRoom.openingHours || "9:00 AM - 10:00 PM"}
                    </Typography>
                  </div>
                  
                  {/* Social Media */}
                  {selectedRoom.socialMedia?.instagram && (
                    <div>
                      <Typography variant="body2" className="text-gray-500 font-medium flex items-center">
                        <Instagram className="w-4 h-4 mr-1" /> Instagram
                      </Typography>
                      <a 
                        href={`https://instagram.com/${selectedRoom.socialMedia.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 flex items-center text-indigo-600"
                      >
                        @{selectedRoom.socialMedia.instagram}
                      </a>
                    </div>
                  )}
                  
                  {/* Owner Information */}
                  <div>
                    <Typography variant="body2" className="text-gray-500 font-medium">Owner</Typography>
                    <Typography variant="body2" className="mt-1">
                      {selectedRoom.ownerDetails.fullname || "Music Studio Inc."}
                    </Typography>
                  </div>
                  
                  {/* Amenities as tags */}
                  {selectedRoom.amenities && selectedRoom.amenities.length > 0 && (
                    <div>
                      <Typography variant="body2" className="text-gray-500 font-medium">Amenities</Typography>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedRoom.amenities.map((amenity, index) => (
                          <div key={index} className="bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-full">
                            {amenity}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Collapse>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 rounded-xl shadow-sm">
          <CardContent className="p-4">
            <Typography variant="subtitle2" className="text-gray-600 mb-3">
              Location
            </Typography>
            <div className="flex flex-col items-center text-center">
              <MapPin className="w-10 h-10 text-indigo-500 mb-2" />
              <Typography variant="body2" className="mb-3">
                {selectedRoom.distance.toFixed(2)} km from your location
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                component="a"
                href={`https://www.google.com/maps/dir/?api=1&origin=${userPosition.lat},${userPosition.lng}&destination=${roomPosition.lat},${roomPosition.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                startIcon={<MapPin className="w-4 h-4" />}
              >
                Get Directions
              </Button>
            </div>
          </CardContent>
        </Card>

        <Button
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          className="rounded-lg py-3 sticky bottom-4 shadow-lg"
          onClick={() => navigate(`/booking/${selectedRoom.id}`)}
          startIcon={<Calendar className="w-5 h-5" />}
        >
          Book Now
        </Button>
      </div>
    </div>
  )
}

export default JamRoomDetails
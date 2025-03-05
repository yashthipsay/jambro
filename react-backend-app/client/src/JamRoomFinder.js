"use client"

import { useState } from "react"
import { Button, Card, CardContent, Typography, CircularProgress, Divider } from "@mui/material"
import { useNavigate } from "react-router-dom"
import { useAuth0 } from "@auth0/auth0-react"
import { MapPin, Music, Star, Clock } from "lucide-react"
import { findClosestJamRooms } from "./utils/jamRoomUtils" // Import the function

function JamRoomFinder() {
  const [loading, setLoading] = useState(false)
  const { isAuthenticated, loginWithRedirect } = useAuth0()
  const [jamRooms, setJamRooms] = useState([])
  const [userLatitude, setUserLatitude] = useState(null)
  const [userLongitude, setUserLongitude] = useState(null)
  const navigate = useNavigate()

  const handleFindJamRooms = async () => {
    setLoading(true)
    try {
      const { userLatitude: lat, userLongitude: lon, jamRooms: rooms } = await findClosestJamRooms()
      setUserLatitude(lat)
      setUserLongitude(lon)
      setJamRooms(rooms)
    } catch (error) {
      console.error("Error finding jam rooms:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCardClick = (room) => {
    if (!isAuthenticated) {
      loginWithRedirect()
      return
    }
    const selectedRoom = {
      ...room,
      userLatitude,
      userLongitude,
    }
    console.log("Selected room:", selectedRoom)
    localStorage.setItem("selectedJamRoom", JSON.stringify(selectedRoom))
    navigate(`/jam-room/${room.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8 mt-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-4">
            <Music className="w-8 h-8 text-indigo-600" />
          </div>
          <Typography variant="h5" className="font-bold mb-2">
            Find Your Perfect Jam Room
          </Typography>
          <Typography variant="body2" className="text-gray-600">
            Discover nearby jam rooms and book your session in minutes
          </Typography>
        </div>

        <Card className="mb-6 rounded-xl shadow-sm">
          <CardContent className="p-5 text-center">
            <Button
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              onClick={handleFindJamRooms}
              disabled={loading}
              className="py-3 rounded-lg"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <MapPin className="w-5 h-5" />}
            >
              {loading ? "Searching..." : "Find Nearby Jam Rooms"}
            </Button>
          </CardContent>
        </Card>

        {jamRooms.length > 0 && (
          <div className="space-y-4">
            <Typography variant="h6" className="font-semibold">
              Nearby Jam Rooms
            </Typography>

            {!isAuthenticated ? (
              <Card className="rounded-xl shadow-sm overflow-hidden">
                <CardContent className="p-5 text-center">
                  <Typography variant="body2" className="mb-4 text-gray-600">
                    Sign in to view and book jam rooms
                  </Typography>
                  <Button onClick={() => loginWithRedirect()} variant="contained" color="primary" fullWidth>
                    Sign In
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {jamRooms.map((room) => (
                  <Card
                    key={room.id}
                    className="rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleCardClick(room)}
                  >
                    <CardContent className="p-0">
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <Typography variant="h6" className="font-semibold">
                            {room.name}
                          </Typography>
                          <div className="flex items-center bg-indigo-100 px-2 py-1 rounded text-indigo-700">
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            <Typography variant="caption" className="font-medium">
                              4.8
                            </Typography>
                          </div>
                        </div>

                        <div className="flex items-center text-gray-600 mb-3">
                          <MapPin className="w-4 h-4 mr-1" />
                          <Typography variant="body2">{room.distance.toFixed(2)} km away</Typography>
                        </div>

                        <Divider className="my-3" />

                        <div className="flex justify-between items-center">
                          <div className="flex items-center text-gray-600">
                            <Clock className="w-4 h-4 mr-1" />
                            <Typography variant="body2">{room.slots?.length || 6} slots available</Typography>
                          </div>
                          <Typography variant="subtitle2" className="font-semibold text-indigo-700">
                            ₹{room.feesPerSlot || "500"}/slot
                          </Typography>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default JamRoomFinder


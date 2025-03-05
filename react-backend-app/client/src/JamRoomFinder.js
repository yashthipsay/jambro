"use client"

import { useState } from "react"
import { Button, Card, CardContent, CardMedia, Typography, CircularProgress, Divider } from "@mui/material"
import { useNavigate } from "react-router-dom"
import { useAuth0 } from "@auth0/auth0-react"
import { LocationOn, MusicNote, Star, AccessTime } from "@mui/icons-material"
import { findClosestJamRooms } from "./utils/jamRoomUtils"

function JamRoomFinder() {
  const [loading, setLoading] = useState(false)
  const { isAuthenticated, loginWithRedirect } = useAuth0()
  const [jamRooms, setJamRooms] = useState([])
  const [userLatitude, setUserLatitude] = useState(null)
  const [userLongitude, setUserLongitude] = useState(null)
  const navigate = useNavigate()
  
  // Light theme color palette with purple accents
  const primaryColor = '#6434fc'    // Deep purple for primary actions
  const secondaryColor = '#a085eb'  // Light purple for accents (as specified)
  const accentColor = '#8059f7'     // Medium purple for highlights (as specified)
  const backgroundColor = '#f8f6ff' // Very light lavender background
  const cardBackground = '#ffffff'  // White card background
  const textColor = '#352c63'       // Dark purple text for readability
  const lightTextColor = '#dcd5ff'  // Light lavender for text on dark backgrounds
  
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
    <div className="min-h-screen p-4" style={{ 
      backgroundColor,
      backgroundImage: `radial-gradient(circle at 50% 0%, #e9e4ff 0%, ${backgroundColor} 70%)` 
    }}>
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8 mt-4">
          <MusicNote sx={{ fontSize: 48, color: primaryColor, mb: 2, filter: 'drop-shadow(0 0 8px rgba(100, 52, 252, 0.2))' }} />
          <Typography variant="h5" sx={{ 
            fontWeight: 'bold', 
            mb: 1, 
            color: textColor,
            textShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}>
            Find Your Perfect Jam Room
          </Typography>
          <Typography variant="body2" sx={{ color: textColor, opacity: 0.8 }}>
            Discover nearby jam rooms and book your session in minutes
          </Typography>
        </div>

        {/* Find Button */}
        <Card className="mb-6 rounded-xl shadow-sm" sx={{ 
          backgroundColor: cardBackground,
          boxShadow: '0 4px 16px rgba(100, 52, 252, 0.15)',
          border: '1px solid rgba(160, 133, 235, 0.2)'
        }}>
          <CardContent className="p-5 text-center">
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleFindJamRooms}
              disabled={loading}
              sx={{
                backgroundColor: primaryColor,
                color: '#ffffff',
                py: 1.5,
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(100, 52, 252, 0.3)',
                '&:hover': { 
                  backgroundColor: accentColor,
                  boxShadow: '0 6px 16px rgba(100, 52, 252, 0.4)',
                },
              }}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LocationOn fontSize="small" />}
            >
              {loading ? "Searching..." : "Find Nearby Jam Rooms"}
            </Button>
          </CardContent>
        </Card>

        {/* Jam Room Listing */}
        {jamRooms.length > 0 && (
          <div className="space-y-4">
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              mb: 2, 
              color: textColor,
              textShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}>
              Nearby Jam Rooms
            </Typography>

            {!isAuthenticated ? (
              <Card className="rounded-xl shadow-sm" sx={{ 
                backgroundColor: cardBackground,
                boxShadow: '0 4px 16px rgba(100, 52, 252, 0.15)',
                border: '1px solid rgba(160, 133, 235, 0.2)'
              }}>
                <CardContent className="p-5 text-center">
                  <Typography variant="body2" sx={{ mb: 2, color: textColor }}>
                    Sign in to view and book jam rooms
                  </Typography>
                  <Button
                    onClick={() => loginWithRedirect()}
                    variant="contained"
                    fullWidth
                    sx={{
                      backgroundColor: primaryColor,
                      color: '#ffffff',
                      boxShadow: '0 4px 12px rgba(100, 52, 252, 0.3)',
                      '&:hover': { 
                        backgroundColor: accentColor,
                        boxShadow: '0 6px 16px rgba(100, 52, 252, 0.4)',
                      },
                    }}
                  >
                    Sign In
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {jamRooms.map((room) => (
                  <Card
                    key={room.id}
                    className="rounded-xl overflow-hidden cursor-pointer transition-all duration-300"
                    onClick={() => handleCardClick(room)}
                    sx={{ 
                      backgroundColor: cardBackground,
                      boxShadow: '0 4px 16px rgba(100, 52, 252, 0.15)',
                      border: '1px solid rgba(160, 133, 235, 0.2)',
                      '&:hover': { 
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 24px rgba(100, 52, 252, 0.25)',
                      },
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <Typography variant="h6" sx={{ fontWeight: 600, color: textColor }}>
                          {room.name}
                        </Typography>
                        <div className="flex items-center" style={{ 
                          background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                          padding: '4px 8px', 
                          borderRadius: 4,
                          boxShadow: '0 2px 8px rgba(100, 52, 252, 0.2)'
                        }}>
                          <Star sx={{ fontSize: 16, color: '#ffffff', mr: 0.5 }} />
                          <Typography variant="caption" sx={{ fontWeight: 'medium', color: '#ffffff' }}>
                            4.8
                          </Typography>
                        </div>
                      </div>

                      <div className="flex items-center mb-3" style={{ color: textColor }}>
                        <LocationOn sx={{ fontSize: 16, color: secondaryColor, mr: 0.5 }} />
                        <Typography variant="body2">{room.distance.toFixed(2)} km away</Typography>
                      </div>

                      <Divider sx={{ my: 1.5, backgroundColor: 'rgba(160, 133, 235, 0.2)' }} />

                      <div className="flex justify-between items-center">
                        <div className="flex items-center" style={{ color: textColor }}>
                          <AccessTime sx={{ fontSize: 16, color: secondaryColor, mr: 0.5 }} />
                          <Typography variant="body2">{room.slots?.length || 6} slots available</Typography>
                        </div>
                        <Typography variant="subtitle2" sx={{ 
                          fontWeight: 600, 
                          color: '#ffffff',
                          background: `linear-gradient(135deg, ${accentColor}, ${primaryColor})`,
                          padding: '4px 8px',
                          borderRadius: '4px',
                          boxShadow: '0 2px 8px rgba(100, 52, 252, 0.2)'
                        }}>
                          ₹{room.feesPerSlot || "500"}/slot
                        </Typography>
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
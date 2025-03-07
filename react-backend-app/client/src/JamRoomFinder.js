"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardContent,
  CardMedia,
  Typography,
  CircularProgress,
  Divider,
} from "@mui/material";
import {
  ChevronLeft,
  ChevronRight,
  LibraryMusic,
  LocationOn,
  MusicNote,
  Star,
  AccessTime,
  Event,
  CardMembership,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { findClosestJamRooms } from "./utils/jamRoomUtils";
import { Mic, Guitar } from "lucide-react";

function JamRoomCard({ room, onClick, colors }) {
  const [currentImage, setCurrentImage] = useState(0);
  const { primaryColor, accentColor, secondaryColor, textColor } = colors;

  // Add auto-slide functionality
  useEffect(() => {
    if (!room.images || room.images.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % room.images.length);
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(timer);
  }, [room.images]);

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImage((prev) => (prev + 1) % room.images.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImage(
      (prev) => (prev - 1 + room.images.length) % room.images.length
    );
  };

  return (
    <Card
      className="rounded-xl overflow-hidden cursor-pointer transition-all duration-300"
      onClick={onClick}
      sx={{
        backgroundColor: "transparent",
        boxShadow: "0 4px 16px rgba(100, 52, 252, 0.15)",
        border: "1px solid rgba(160, 133, 235, 0.2)",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 8px 24px rgba(100, 52, 252, 0.25)",
        },
      }}
    >
      <div className="relative">
        {/* Image Carousel */}
        <div className="relative h-48 w-full">
          {room.images && room.images.length > 0 ? (
            <>
              <div className="absolute inset-0 bg-black/30" />
              <img
                src={room.images[currentImage]}
                alt={`${room.name} - ${currentImage + 1}`}
                className="h-full w-full object-cover"
              />
              {room.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft fontSize="small" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight fontSize="small" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {room.images.map((_, index) => (
                      <div
                        key={index}
                        className={`h-1.5 w-1.5 rounded-full transition-all ${
                          index === currentImage
                            ? "bg-white w-3"
                            : "bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center">
              <MusicNote
                sx={{ fontSize: 48, color: "rgba(100, 52, 252, 0.3)" }}
              />
            </div>
          )}
        </div>

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4">
          <div className="flex justify-between items-start">
            <Typography variant="h6" sx={{ fontWeight: 600, color: "white" }}>
              {room.name}
            </Typography>
            <div
              className="flex items-center"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                padding: "4px 8px",
                borderRadius: 4,
                boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
              }}
            >
              <Star sx={{ fontSize: 16, color: "#ffffff", mr: 0.5 }} />
              <Typography
                variant="caption"
                sx={{ fontWeight: "medium", color: "#ffffff" }}
              >
                4.8
              </Typography>
            </div>
          </div>

          <div className="flex items-center mt-2">
            <LocationOn
              sx={{ fontSize: 16, color: "white", mr: 0.5, opacity: 0.8 }}
            />
            <Typography variant="body2" sx={{ color: "white", opacity: 0.8 }}>
              {room.distance.toFixed(2)} km away
            </Typography>
          </div>

          <div className="flex justify-between items-center mt-2">
            <div className="flex items-center">
              <AccessTime
                sx={{ fontSize: 16, color: "white", mr: 0.5, opacity: 0.8 }}
              />
              <Typography variant="body2" sx={{ color: "white", opacity: 0.8 }}>
                {room.slots?.length || 6} slots
              </Typography>
            </div>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: "#ffffff",
                background: `linear-gradient(135deg, ${accentColor}, ${primaryColor})`,
                padding: "4px 8px",
                borderRadius: "4px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
              }}
            >
              ₹{room.feesPerSlot || "500"}/slot
            </Typography>
          </div>
        </div>
      </div>
    </Card>
  );
}

function JamRoomFinder() {
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  const [jamRooms, setJamRooms] = useState([]);
  const [userLatitude, setUserLatitude] = useState(null);
  const [userLongitude, setUserLongitude] = useState(null);
  const navigate = useNavigate();

  // Main service categories (superset)
  const mainServices = [
    {
      id: "pass",
      name: "GigSaw Pass",
      icon: <CardMembership sx={{ fontSize: 20 }} />,
      active: false,
    },
    {
      id: "jamrooms_studios",
      name: "JamRooms/Studios",
      icon: <MusicNote sx={{ fontSize: 20 }} />,
      active: true,
    },
    {
      id: "rentals",
      name: "Rentals",
      icon: <LibraryMusic sx={{ fontSize: 20 }} />,
      active: false,
    },
    {
      id: "coaching",
      name: "Coaching",
      icon: <Guitar sx={{ fontSize: 20 }} />,
      active: false,
    },
    {
      id: "events",
      name: "Events",
      icon: <Event sx={{ fontSize: 20 }} />,
      active: false,
    },
  ];

  const [activeService, setActiveService] = useState("jamrooms");

  // Categories for the horizontal scroll
  const categories = ["All", "Jamrooms", "Recording Studios", "Pass Eligible"];
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Light theme color palette with purple accents
  const primaryColor = "#6434fc"; // Deep purple for primary actions
  const secondaryColor = "#a085eb"; // Light purple for accents (as specified)
  const accentColor = "#8059f7"; // Medium purple for highlights (as specified)
  const backgroundColor = "#f8f6ff"; // Very light lavender background
  const cardBackground = "#ffffff"; // White card background
  const textColor = "#352c63"; // Dark purple text for readability
  const lightTextColor = "#dcd5ff"; // Light lavender for text on dark backgrounds

  const handleFindJamRooms = async () => {
    setLoading(true);
    try {
      const {
        userLatitude: lat,
        userLongitude: lon,
        jamRooms: rooms,
      } = await findClosestJamRooms();
      setUserLatitude(lat);
      setUserLongitude(lon);
      setJamRooms(rooms);
    } catch (error) {
      console.error("Error finding jam rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handler for category clicks
  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    // You can add filtering logic here based on the selected category
  };

  const handleCardClick = (room) => {
    if (!isAuthenticated) {
      loginWithRedirect();
      return;
    }

    const selectedRoom = {
      id: room.id,
      name: room.name,
      description: room.description,
      location: room.location,
      slots: room.slots,
      distance: room.distance,
      feesPerSlot: room.feesPerSlot,
      userLatitude,
      userLongitude,
      ownerDetails: room.ownerDetails, // Add this
      images: room.images,
    };
    console.log("Selected room:", selectedRoom);
    localStorage.setItem("selectedJamRoom", JSON.stringify(selectedRoom));
    navigate(`/jam-room/${room.id}`);
  };

  // Handler for main service selection
  const handleServiceClick = (serviceId) => {
    setActiveService(serviceId);
    // Here you would implement logic to change the workflow based on service
    // For now we'll just reset the category filter
    setSelectedCategory("All");
  };

  return (
    <div
      className="min-h-screen p-4"
      style={{
        backgroundColor,
        backgroundImage: `radial-gradient(circle at 50% 0%, #e9e4ff 0%, ${backgroundColor} 70%)`,
      }}
    >
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8 mt-4">
          <img
            src="/Gigsaw_Color.png"
            alt="GigSaw Logo"
            className="h-20 mx-auto mb-3 filter drop-shadow-lg transition-all duration-300 hover:scale-105"
            style={{
              width: "440px", // Set a specific width
              objectFit: "contain",
            }}
          />
          <Typography
            variant="h5"
            sx={{
              fontWeight: "bold",
              mb: 1,
              color: textColor,
              textShadow: "0 1px 2px rgba(0,0,0,0.1)",
            }}
          >
            Find Your Perfect Jam Room
          </Typography>
          <Typography variant="body2" sx={{ color: textColor, opacity: 0.8 }}>
            Discover nearby jam rooms and book your session in minutes
          </Typography>
        </div>

        {/* NEW: Main Service Categories (superset) */}
        <div className="mb-6">
          <Card
            className="rounded-xl overflow-hidden"
            sx={{
              backgroundColor: cardBackground,
              boxShadow: "0 4px 16px rgba(100, 52, 252, 0.15)",
              border: "1px solid rgba(160, 133, 235, 0.2)",
            }}
          >
            <div className="relative">
              {/* Horizontal scrollable service categories */}
              <div className="flex overflow-x-auto scrollbar-hide py-3 px-4">
                {mainServices.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => handleServiceClick(service.id)}
                    className={`
                      flex items-center space-x-2 whitespace-nowrap px-4 py-2 mx-1 rounded-full
                      transition-all duration-200 first:ml-0 last:mr-0
                      ${
                        activeService === service.id
                          ? `bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium`
                          : `bg-white text-gray-700 border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50`
                      }
                    `}
                  >
                    <span className="flex items-center justify-center">
                      {service.icon}
                    </span>
                    <span>{service.name}</span>
                  </button>
                ))}
              </div>

              {/* Gradient fade indicators for scrolling */}
              <div className="absolute pointer-events-none left-0 top-0 h-full w-8 bg-gradient-to-r from-white to-transparent z-10" />
              <div className="absolute pointer-events-none right-0 top-0 h-full w-8 bg-gradient-to-l from-white to-transparent z-10" />
            </div>
          </Card>
        </div>

        {/* Find Button */}
        <Card
          className="mb-6 rounded-xl shadow-sm"
          sx={{
            backgroundColor: cardBackground,
            boxShadow: "0 4px 16px rgba(100, 52, 252, 0.15)",
            border: "1px solid rgba(160, 133, 235, 0.2)",
          }}
        >
          <CardContent className="p-5 text-center">
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleFindJamRooms}
              disabled={loading}
              sx={{
                backgroundColor: primaryColor,
                color: "#ffffff",
                py: 1.5,
                borderRadius: 2,
                boxShadow: "0 4px 12px rgba(100, 52, 252, 0.3)",
                "&:hover": {
                  backgroundColor: accentColor,
                  boxShadow: "0 6px 16px rgba(100, 52, 252, 0.4)",
                },
              }}
              startIcon={
                loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <LocationOn fontSize="small" />
                )
              }
            >
              {loading ? "Searching..." : "Find Nearby Jam Rooms"}
            </Button>
          </CardContent>
        </Card>

        {/* Jam Room Listing */}
        {jamRooms.length > 0 && (
          <div className="space-y-4">
            {/* Horizontal scrollable categories */}
            <div className="flex space-x-2 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`
                px-4 py-2 rounded-full border border-gray-200 text-sm flex-shrink-0
                ${
                  selectedCategory === category
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }
                transition-colors duration-200
              `}
                  onClick={() => handleCategoryClick(category)}
                >
                  {category}
                </button>
              ))}
            </div>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                mb: 2,
                color: textColor,
                textShadow: "0 1px 2px rgba(0,0,0,0.1)",
              }}
            >
              Nearby Jam Rooms
            </Typography>

            {!isAuthenticated ? (
              <Card
                className="rounded-xl shadow-sm"
                sx={{
                  backgroundColor: cardBackground,
                  boxShadow: "0 4px 16px rgba(100, 52, 252, 0.15)",
                  border: "1px solid rgba(160, 133, 235, 0.2)",
                }}
              >
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
                      color: "#ffffff",
                      boxShadow: "0 4px 12px rgba(100, 52, 252, 0.3)",
                      "&:hover": {
                        backgroundColor: accentColor,
                        boxShadow: "0 6px 16px rgba(100, 52, 252, 0.4)",
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
                  <JamRoomCard
                    key={room.id}
                    room={room}
                    onClick={() => handleCardClick(room)}
                    colors={{
                      primaryColor,
                      secondaryColor,
                      accentColor,
                      textColor,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default JamRoomFinder;

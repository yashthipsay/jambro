"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
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
import { Guitar } from "lucide-react";

// Event data - in a real app this would come from an API
const events = [
  {
    id: 1,
    title: "Jazz Night at Hard Rock Cafe",
    date: "March 15, 2024",
    image: "https://i.ytimg.com/vi/hwcWIzlQiyw/maxresdefault.jpg",
    category: "Jazz",
  },
  {
    id: 2,
    title: "Crescendo VIT Pune 2025",
    date: "March 20, 2024",
    image:
      "https://viberate-upload.ams3.cdn.digitaloceanspaces.com/prod/entity/festival/crescendo-festival-HOUAE",
    category: "Rock",
  },
  {
    id: 3,
    title: "Classical Symphony",
    date: "March 25, 2024",
    image:
      "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&auto=format&fit=crop",
    category: "Classical",
  },
];

function EventCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % events.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = (e) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % events.length);
  };

  const prevSlide = (e) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev - 1 + events.length) % events.length);
  };

  return (
    <Card
      className="rounded-xl overflow-hidden shadow-lg"
      sx={{
        backgroundColor: "transparent",
        boxShadow: "0 4px 16px rgba(100, 52, 252, 0.15)",
        border: "1px solid rgba(160, 133, 235, 0.2)",
      }}
    >
      <div className="relative h-56 sm:h-64">
        {" "}
        {/* Increased height for better visibility */}
        <img
          src={events[currentSlide].image}
          alt={events[currentSlide].title}
          className="w-full h-full object-cover"
        />
        {/* Enhanced gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0.85) 100%)",
            pointerEvents: "none",
          }}
        />
        {/* Navigation buttons */}
        <button
          onClick={prevSlide}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        >
          <ChevronLeft />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        >
          <ChevronRight />
        </button>
        {/* Event info */}
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="flex items-center space-x-2 mb-1">
            <Event sx={{ fontSize: 16 }} />
            <Typography variant="caption">
              {events[currentSlide].date}
            </Typography>
          </div>
          <Typography variant="h6" className="font-bold">
            {events[currentSlide].title}
          </Typography>
          <div className="mt-1">
            <span className="px-2 py-1 rounded-full bg-purple-500/80 text-xs font-medium">
              {events[currentSlide].category}
            </span>
          </div>
        </div>
        {/* Dots indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          {events.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 w-1.5 rounded-full transition-all ${
                index === currentSlide ? "bg-white w-3" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}

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
  const [filteredJamRooms, setFilteredJamRooms] = useState([]);
  const navigate = useNavigate();

  // Main service categories (superset)
  const mainServices = [
    {
      id: "rentals",
      name: "Rentals",
      icon: <LibraryMusic sx={{ fontSize: 20 }} />,
      active: false,
    },

    {
      id: "jamrooms_studios",
      name: "JamRooms/Studios",
      icon: <MusicNote sx={{ fontSize: 20 }} />,
      active: true,
    },
    {
      id: "pass",
      name: "GigSaw Pass",
      icon: <CardMembership sx={{ fontSize: 20 }} />,
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

    // Filter rooms based on category
    switch (category) {
      case "All":
        setFilteredJamRooms(jamRooms);
        break;
      case "Jamrooms":
        setFilteredJamRooms(jamRooms.filter((room) => room.type === "Jamroom"));
        break;
      case "Recording Studios":
        setFilteredJamRooms(jamRooms.filter((room) => room.type === "Studio"));
        break;
      default:
        setFilteredJamRooms(jamRooms);
    }
  };

  useEffect(() => {
    setFilteredJamRooms(jamRooms);
  }, [jamRooms]);

  const handleCardClick = (room) => {
    if (!isAuthenticated) {
      loginWithRedirect();
      return;
    }

    const selectedRoom = {
      id: room.id,
      name: room.name,
      description: room.description,
      type: room.type, // Add type for Studio check
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
    // Navigate based on service type
    if (serviceId === "pass") {
      // Navigate to subscriptions page for GigSaw Pass
      navigate("/subscriptions");
    } else if (serviceId === "jamrooms_studios") {
      // Stay on the current page or navigate to home for JamRooms/Studios
      // This is the default view, so we can either do nothing or explicitly navigate to "/"
      // Setting it as active service is already handled above
      setSelectedCategory("All"); // Reset the category filter
    } else {
      // For other services (rentals, coaching, events),
      // just update state for now and reset the category filter
      // In the future you might want to navigate to specific pages for these services
      // e.g., navigate(`/${serviceId}`);
    }
  };

  return (
    <div
      className="min-h-screen pb-16 md:pb-0"
      style={{
        backgroundColor,
        backgroundImage: `radial-gradient(circle at 50% 0%, #e9e4ff 0%, ${backgroundColor} 70%)`,
      }}
    >
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header with Logo and Text */}
        <div className="text-center mb-8">
          <div className="mb-6">
            <img
              src="/Gigsaw_Color.png"
              alt="GigSaw Logo"
              className="h-16 w-auto mx-auto"
              style={{ objectFit: "contain" }}
            />
          </div>
          <Typography
            variant="h4"
            sx={{
              fontWeight: "bold",
              mb: 1,
              color: textColor,
              textShadow: "0 1px 2px rgba(0,0,0,0.1)",
            }}
          >
            Find Your Perfect Music Space
          </Typography>
          <Typography variant="body1" sx={{ color: textColor, opacity: 0.8 }}>
            Discover nearby jam rooms and book your session in minutes
          </Typography>
        </div>

        {/* Rest of the existing content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
          {/* Event Carousel - Takes up 2 columns */}
          <div className="lg:col-span-2">
            <EventCarousel />
          </div>

          {/* Main content - Takes up 3 columns */}
          <div className="lg:col-span-3">
            {/* Find Button */}
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleFindJamRooms}
              disabled={loading}
              sx={{
                backgroundColor: primaryColor,
                color: "#ffffff",
                py: 2, // Increased vertical padding
                mb: 4, // Increased bottom margin from 3 to 4
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
              {loading ? "Searching..." : "Find Nearby Music Spaces"}
            </Button>

            {/* Jam Room Listing */}
            {jamRooms.length > 0 && (
              <div className="space-y-4">
                {/* Horizontal scrollable categories */}
                <div className="flex space-x-3 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-6">
                  {" "}
                  {/* Increased space-x from 2 to 3, and px from 4 to 6 */}
                  {categories.map((category) => (
                    <button
                      key={category}
                      className={`
                    px-6 py-2 rounded-full border border-gray-200 text-sm flex-shrink-0 mx-1 
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
                      <Typography
                        variant="body2"
                        sx={{ mb: 2, color: textColor }}
                      >
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
                    {filteredJamRooms.map((room) => (
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
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-purple-100 shadow-lg">
        <div className="flex items-center justify-between px-2 py-2 relative">
          {mainServices.map((service, index) => {
            const isCenter = index === Math.floor(mainServices.length / 2);
            return (
              <button
                key={service.id}
                onClick={() => handleServiceClick(service.id)}
                className={`
                  flex flex-col items-center justify-center w-full
                  transition-all duration-200 text-xs relative
                  ${isCenter ? "-mt-6" : ""}
                  ${
                    activeService === service.id
                      ? `text-indigo-600 font-medium bg-purple-200 rounded-lg py-1`
                      : `text-gray-600`
                  }
                `}
              >
                <div
                  className={`
                    flex items-center justify-center
                    ${
                      isCenter
                        ? "bg-gradient-to-r from-indigo-500 to-purple-600 p-3 rounded-full shadow-lg transform -translate-y-2"
                        : "mb-1"
                    }
                  `}
                >
                  <span
                    className={`${
                      isCenter ? "text-white text-2xl" : "text-xl"
                    }`}
                  >
                    {service.icon}
                  </span>
                </div>
                <span className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[70px] text-center">
                  {service.name}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop Navigation - Side Panel */}
      <div className="hidden md:block fixed right-0 top-1/2 transform -translate-y-1/2 bg-white/95 backdrop-blur-sm rounded-l-xl shadow-lg border border-purple-100 z-50">
        <div className="flex flex-col py-4 px-2">
          {mainServices.map((service) => (
            <button
              key={service.id}
              onClick={() => handleServiceClick(service.id)}
              className={`
                flex items-center space-x-2 px-4 py-3 rounded-lg text-sm
                transition-all duration-200 mb-1 last:mb-0
                ${
                  activeService === service.id
                    ? `bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium`
                    : `text-gray-700 hover:bg-purple-50`
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
      </div>
    </div>
  );
}

export default JamRoomFinder;

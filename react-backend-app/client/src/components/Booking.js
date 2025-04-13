"use client";

import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3";
import { DatePicker } from "@mui/x-date-pickers";
import {
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  IconButton,
  Checkbox,
  Divider,
  FormGroup,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Modal,
} from "@mui/material";
import {
  Calendar,
  Clock,
  ChevronLeft,
  Phone,
  Plus,
  Trash2,
  Music,
  Check,
  Guitar,
  Sun,
  Sunrise,
  Sunset,
} from "lucide-react";
import moment from "moment-timezone";
import io from "socket.io-client";
import { useAuth0 } from "@auth0/auth0-react";
import {
  convertTo12HourFormat,
  groupSlotsByCategory,
} from "../utils/timeUtils";

const socket = io("https://api.vision.gigsaw.co.in");

function Booking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth0();
  const selectedRoom = JSON.parse(localStorage.getItem("selectedJamRoom"));
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [savedNumbers, setSavedNumbers] = useState([]);
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [addons, setAddons] = useState([]);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [reservedSlots, setReservedSlots] = useState(new Set());
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedSubPart, setSelectedSubPart] = useState(null);

  // Add state variables for slide-up modals
  const [studioServicesModalOpen, setStudioServicesModalOpen] = useState(false);
  const [addonsModalOpen, setAddonsModalOpen] = useState(false);
  const [savedNumbersModalOpen, setSavedNumbersModalOpen] = useState(false);

  useEffect(() => {
    // Only fetch if we have a selectedRoom and haven't fetched addons yet
    if (selectedRoom && addons.length === 0) {
      const fetchAddons = async () => {
        try {
          const response = await fetch(
            `https://api.vision.gigsaw.co.in/api/jamrooms/${selectedRoom.id}/addons`
          );
          const data = await response.json();
          if (data.success) {
            setAddons(data.data);
          }
        } catch (err) {
          console.error("Error fetching addons:", err);
        }
      };

      fetchAddons();
    }

    // Socket events
    if (selectedRoom) {
      socket.emit("getBookings", selectedRoom.id);
      socket.on("bookings", (data) => {
        setBookings(data);
      });

      return () => {
        socket.off("bookings");
      };
    }
  }, [selectedRoom, addons.length]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        if (!selectedRoom?.id) {
          console.log("No room ID available");
          return;
        }

        console.log("Fetching services for room:", selectedRoom.id);

        const response = await fetch(
          `https://api.vision.gigsaw.co.in/api/jamrooms/${selectedRoom.id}/services`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
          console.log("Services fetched:", data.data);
          setServices(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching services:", error);
        setServices([]);
      }
    };

    fetchServices();
  }, [selectedRoom?.id]);

  useEffect(() => {
    if (user) {
      fetch("https://api.vision.gigsaw.co.in/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: user.email }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            setSavedNumbers(data.data.savedNumbers);
          }
        });
    }
  }, [user]);

  useEffect(() => {
    socket.on("sessionStatusUpdate", (data) => {
      setBookings((prevBookings) =>
        prevBookings.map((booking) => {
          if (booking._id === data.bookingId) {
            return { ...booking, status: data.status };
          }
          return booking;
        })
      );
    });

    return () => {
      socket.off("sessionStatusUpdate");
    };
  }, []);

  // Check reservations for that particular slot
  const checkReservations = useCallback(async () => {
    if (!selectedRoom || !selectedDate) return;

    try {
      const response = await fetch(
        `https://api.vision.gigsaw.co.in/api/reservations/check/${
          selectedRoom.id
        }/${moment(selectedDate).format("YYYY-MM-DD")}`
      );

      if (!response.ok) {
        throw new Error("Reservation check failed");
      }

      const data = await response.json();
      setReservedSlots(new Set(data.reservations.slots.map((r) => r.slotId)));
    } catch (error) {
      console.error("Error checking reservations:", error);
    }
  }, [selectedRoom, selectedDate]);

  // Add after existing useEffect hooks
  useEffect(() => {
    if (selectedDate && selectedRoom) {
      checkReservations();

      socket.on("reservationUpdate", (data) => {
        if (
          data.jamRoomId === selectedRoom.id &&
          data.date === moment(selectedDate).format("YYYY-MM-DD")
        ) {
          setReservedSlots((prevReservedSlots) => {
            const newReservedSlots = new Set(
              data.reservations.slots.map((r) => r.slotId)
            );

            // Uncheck any slots that have become reserved
            setSelectedSlots((prevSelectedSlots) =>
              prevSelectedSlots.filter(
                (slotId) => !newReservedSlots.has(String(slotId))
              )
            );

            return newReservedSlots;
          });
        }
      });

      // Clean up socket listener
      return () => {
        socket.off("reservationUpdate");
      };
    }
  }, [selectedDate, selectedRoom, checkReservations]);

  const handleAddonToggle = (addonId) => {
    setSelectedAddons((prev) => {
      if (prev.includes(addonId)) {
        return prev.filter((id) => id !== addonId);
      } else {
        return [...prev, addonId];
      }
    });
  };

  const calculateAddonsCost = () => {
    // Calculate based on number of selected slots (hours)
    const hoursBooked = selectedSlots.length;

    return selectedAddons.reduce((total, addonId) => {
      const addon = addons.find((a) => a._id === addonId);
      return total + (addon ? addon.pricePerHour * hoursBooked : 0);
    }, 0);
  };

  // Add service selection handlers
  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setSelectedSubPart(null); // Reset sub-part when changing service
  };

  const handleSubPartSelect = (subPart) => {
    setSelectedSubPart(subPart);
  };

  const calculateTotalCost = () => {
    const slotsCost = selectedSlots.length * (selectedRoom.feesPerSlot || 500);
    const addonsCost = calculateAddonsCost();
    const serviceCost = selectedSubPart ? selectedSubPart.price : 0;
    return slotsCost + addonsCost + serviceCost;
  };

  if (!selectedRoom || selectedRoom.id !== id) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-md text-center">
          <Music className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-4">
            No Jam Room selected
          </h1>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={() => navigate("/")}
            startIcon={<ChevronLeft className="w-4 h-4" />}
          >
            Go Back to Finder
          </Button>
        </div>
      </div>
    );
  }

  const isSlotBooked = (slotId) => {
    if (!selectedDate) return false;

    const selectedDateStr = moment(selectedDate).format("YYYY-MM-DD");

    // First check for permanent bookings
    const isPermanentlyBooked = bookings.some((booking) => {
      if (booking.status === "TERMINATED") return false;
      const bookingDateStr = moment(booking.date).format("YYYY-MM-DD");
      return (
        bookingDateStr === selectedDateStr &&
        booking.slots.some((slot) => slot.slotId === slotId)
      );
    });

    if (isPermanentlyBooked) return "PERMANENT";

    // Then check for temporary reservations
    if (reservedSlots.has(String(slotId))) {
      // If this slot was selected but is now reserved by someone else, uncheck it
      if (selectedSlots.includes(slotId)) {
        setSelectedSlots((prev) => prev.filter((id) => id !== slotId));
      }
      return "TEMPORARY";
    }

    return false;
  };

  const hasSlotTimePassedToday = (slot) => {
    const currentDate = moment().tz("Asia/Kolkata").format("YYYY-MM-DD");
    const selectedDateStr = selectedDate
      ? moment(selectedDate).tz("Asia/Kolkata").format("YYYY-MM-DD")
      : null;
    if (currentDate !== selectedDateStr) return false;

    const currentTime = moment().tz("Asia/Kolkata");
    const slotTime = moment()
      .tz("Asia/Kolkata")
      .set({
        hour: Number.parseInt(slot.startTime.split(":")[0]),
        minute: Number.parseInt(slot.startTime.split(":")[1]),
      });
    return currentTime.isAfter(slotTime);
  };

  const areSlotsContinuous = (slots, newSlotId, roomSlots) => {
    const allSlots = [...slots, newSlotId].sort();

    // Convert slot IDs to actual slot objects
    const slotObjects = allSlots.map((id) =>
      roomSlots.find((s) => s.slotId === id)
    );

    // Sort by start time
    slotObjects.sort((a, b) => {
      const timeA = parseInt(a.startTime.split(":")[0]);
      const timeB = parseInt(b.startTime.split(":")[0]);
      return timeA - timeB;
    });

    // Check if slots are consecutive
    for (let i = 0; i < slotObjects.length - 1; i++) {
      const currentEnd = parseInt(slotObjects[i].endTime.split(":")[0]);
      const nextStart = parseInt(slotObjects[i + 1].startTime.split(":")[0]);
      if (currentEnd !== nextStart) {
        return false;
      }
    }
    return true;
  };

  const handleSlotChange = (slotId) => {
    setSelectedSlots((prev) => {
      if (prev.includes(slotId)) {
        // Allow removing any slot
        return prev.filter((id) => id !== slotId);
      } else {
        // Check if adding this slot would maintain continuity
        const newSlots = [...prev, slotId];
        if (
          newSlots.length === 1 ||
          areSlotsContinuous(prev, slotId, selectedRoom.slots)
        ) {
          return newSlots;
        } else {
          // Show error message to user
          alert("Please select consecutive time slots only");
          return prev;
        }
      }
    });
  };

  const handleSaveNumber = async () => {
    if (!phoneNumber) {
      alert("Please enter a valid phone number");
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch(
        "https://api.vision.gigsaw.co.in/api/users/save-number",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: user.email, phoneNumber }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setSavedNumbers(data.data.savedNumbers);
        setPhoneNumber("");
      } else {
        alert("Error saving phone number");
      }
    } catch (error) {
      console.error("Error saving phone number:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNumber = async (number) => {
    try {
      const response = await fetch(
        "https://api.vision.gigsaw.co.in/api/users/delete-number",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: user.email, phoneNumber: number }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setSavedNumbers(data.data.savedNumbers);
        if (selectedPhoneNumber === number) {
          setSelectedPhoneNumber("");
        }
      } else {
        alert("Error deleting phone number");
      }
    } catch (error) {
      console.error("Error deleting phone number:", error);
    }
  };

  const handlePhoneNumberChange = (e) => {
    setPhoneNumber(e.target.value);
    setSelectedPhoneNumber(e.target.value);
  };

  const handleSavedNumberChange = (e) => {
    setSelectedPhoneNumber(e.target.value);
    setPhoneNumber(e.target.value);
  };

  const handleProceedToReview = async () => {
    if (selectedSlots.length === 0 || !selectedDate || !phoneNumber) {
      alert(
        "Please select a date, at least one time slot, and enter a valid phone number"
      );
      return;
    }

    setIsLoading(true);

    try {
      // Prepare minimal data for API request
      const slotsDetails = selectedSlots.map((slotId) => {
        const slot = selectedRoom.slots.find((s) => s.slotId === slotId);
        return {
          slotId: slot.slotId,
          startTime: slot.startTime,
          endTime: slot.endTime,
        };
      });

      // Simplify addon data - only send what's necessary
      const selectedAddonsDetails = selectedAddons.map((addonId) => {
        const addon = addons.find((a) => a._id === addonId);
        return {
          addonId: addon._id,
          instrumentType: Array.isArray(addon.instrumentType)
            ? addon.instrumentType
            : [addon.instrumentType],
          pricePerHour: addon.pricePerHour,
          quantity: addon.quantity,
          hours: selectedSlots.length,
        };
      });

      // Simplify service data
      const serviceDetails =
        selectedService && selectedSubPart
          ? {
              id: selectedService._id,
              name: selectedService.serviceName,
              subPart: {
                id: selectedSubPart._id,
                name: selectedSubPart.name,
                price: selectedSubPart.price,
              },
            }
          : null;

      // Calculate costs on the front-end to avoid delays
      const totalAmount = calculateTotalCost();
      const addonsCost = calculateAddonsCost();

      // Pre-format the date once
      const formattedDate = moment(selectedDate)
        .tz("Asia/Kolkata")
        .format("YYYY-MM-DD");

      // Create the reservation in a separate step - this might be the slow part
      console.time("reservation-api-call");
      const reservationResponse = await fetch(
        "https://api.vision.gigsaw.co.in/api/reservations/create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jamRoomId: selectedRoom.id,
            date: formattedDate,
            slots: slotsDetails,
            selectedAddons: selectedAddonsDetails,
            userId: user.sub,
            service: serviceDetails,
          }),
        }
      );

      const reservation = await reservationResponse.json();
      console.timeEnd("reservation-api-call");

      if (!reservation.success) {
        alert(reservation.message || "Failed to reserve slots and addons");
        return;
      }

      // Navigate immediately after API call completes
      const navigationState = {
        jamRoomName: selectedRoom.name,
        selectedSlots: slotsDetails,
        totalAmount,
        phoneNumber: selectedPhoneNumber,
        selectedRoomId: selectedRoom.id,
        selectedDate: formattedDate,
        selectedAddons: selectedAddonsDetails,
        addonsCost,
        reservationExpiresAt: reservation.expiresAt,
        selectedService: selectedService
          ? {
              name: selectedService.serviceName,
              subPart: selectedSubPart
                ? {
                    name: selectedSubPart.name,
                    price: selectedSubPart.price,
                  }
                : null,
            }
          : null,
      };

      navigate("/final-review", { state: navigationState });
    } catch (error) {
      console.error("Error creating reservation:", error);
      alert("Failed to create reservation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gray-50 pb-28"
      style={{
        backgroundColor: "#f8f6ff",
        backgroundImage: `radial-gradient(circle at 50% 0%, #e9e4ff 0%, #f8f6ff 70%)`,
      }}
    >
      <div className="max-w-md mx-auto p-4">
        <div className="mb-4 flex items-center">
          <IconButton
            onClick={() => navigate(`/jam-room/${selectedRoom.id}`)}
            edge="start"
            color="primary"
          >
            <ChevronLeft />
          </IconButton>
          <Typography variant="h6" className="ml-2 font-semibold">
            Book Your Session
          </Typography>
        </div>

        <Card className="mb-4 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-indigo-600 p-4 text-white">
            <div className="flex items-center">
              <Music className="w-5 h-5 mr-2" />
              <Typography variant="h6">{selectedRoom.name}</Typography>
            </div>
          </div>

          <CardContent className="p-4">
            <Typography variant="subtitle2" className="text-gray-600 mb-3">
              Select Date
            </Typography>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Booking Date"
                value={selectedDate}
                onChange={setSelectedDate}
                minDate={new Date()}
                renderInput={(params) => <TextField {...params} fullWidth />}
                className="mb-4 w-full"
              />
            </LocalizationProvider>

            <Divider className="my-4" />

            <Typography variant="subtitle2" className="text-gray-600 mb-3">
              Available Time Slots
            </Typography>

            {!selectedDate ? (
              <div className="text-center py-4 bg-gray-50 rounded-lg">
                <Calendar className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <Typography variant="body2" className="text-gray-500">
                  Please select a date to view available slots
                </Typography>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Morning Slots */}
                <div>
                  <div className="flex items-center mb-2">
                    <Sunrise className="w-4 h-4 text-yellow-500 mr-2" />
                    <Typography
                      variant="subtitle2"
                      className="text-gray-700 font-medium"
                    >
                      Morning
                    </Typography>
                  </div>
                  <div className="flex overflow-x-auto pb-2 hide-scrollbar">
                    {selectedRoom.slots
                      .filter((slot) => {
                        const hour = parseInt(slot.startTime.split(":")[0]);
                        return hour < 12;
                      })
                      .map((slot) => {
                        const bookingStatus = isSlotBooked(slot.slotId);
                        const isPassed = hasSlotTimePassedToday(slot);
                        const isDisabled = bookingStatus || isPassed;
                        const isSelected = selectedSlots.includes(slot.slotId);

                        return (
                          <div
                            key={slot.slotId}
                            onClick={() =>
                              !isDisabled && handleSlotChange(slot.slotId)
                            }
                            className={`
                              flex-shrink-0 mx-1 w-24 border rounded-lg relative cursor-pointer transition-all
                              ${
                                isDisabled
                                  ? "cursor-not-allowed opacity-70"
                                  : "hover:border-indigo-300"
                              }
                              ${
                                isSelected
                                  ? "border-indigo-500 bg-indigo-50"
                                  : "border-gray-200"
                              }
                              ${
                                isPassed
                                  ? "bg-gray-100"
                                  : bookingStatus === "TEMPORARY"
                                  ? "bg-yellow-50"
                                  : bookingStatus === "PERMANENT"
                                  ? "bg-gray-100"
                                  : "bg-white"
                              }
                            `}
                          >
                            <div className="p-3 text-center">
                              <div className="flex justify-center">
                                <Clock className="w-4 h-4 text-gray-500" />
                              </div>
                              <Typography variant="body2" className="mt-1">
                                {convertTo12HourFormat(slot.startTime)}
                              </Typography>
                              <Typography
                                variant="caption"
                                className="text-gray-500 block"
                              >
                                ₹{selectedRoom.feesPerSlot}
                              </Typography>

                              {isSelected && (
                                <div className="absolute top-1 right-1 w-3 h-3 bg-indigo-500 rounded-full"></div>
                              )}

                              {bookingStatus === "PERMANENT" && (
                                <div className="mt-1 text-xs text-red-500">
                                  Booked
                                </div>
                              )}

                              {bookingStatus === "TEMPORARY" && (
                                <div className="mt-1 text-xs text-yellow-600">
                                  Reserved
                                </div>
                              )}

                              {isPassed && !bookingStatus && (
                                <div className="mt-1 text-xs text-orange-500">
                                  Passed
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    {selectedRoom.slots.filter(
                      (slot) => parseInt(slot.startTime.split(":")[0]) < 12
                    ).length === 0 && (
                      <div className="w-full text-center py-3 text-gray-500 italic">
                        No morning slots available
                      </div>
                    )}
                  </div>
                </div>

                {/* Afternoon Slots */}
                <div>
                  <div className="flex items-center mb-2">
                    <Sun className="w-4 h-4 text-orange-500 mr-2" />
                    <Typography
                      variant="subtitle2"
                      className="text-gray-700 font-medium"
                    >
                      Afternoon
                    </Typography>
                  </div>
                  <div className="flex overflow-x-auto pb-2 hide-scrollbar">
                    {selectedRoom.slots
                      .filter((slot) => {
                        const hour = parseInt(slot.startTime.split(":")[0]);
                        return hour >= 12 && hour < 17;
                      })
                      .map((slot) => {
                        const bookingStatus = isSlotBooked(slot.slotId);
                        const isPassed = hasSlotTimePassedToday(slot);
                        const isDisabled = bookingStatus || isPassed;
                        const isSelected = selectedSlots.includes(slot.slotId);

                        return (
                          <div
                            key={slot.slotId}
                            onClick={() =>
                              !isDisabled && handleSlotChange(slot.slotId)
                            }
                            className={`
                              flex-shrink-0 mx-1 w-24 border rounded-lg relative cursor-pointer transition-all
                              ${
                                isDisabled
                                  ? "cursor-not-allowed opacity-70"
                                  : "hover:border-indigo-300"
                              }
                              ${
                                isSelected
                                  ? "border-indigo-500 bg-indigo-50"
                                  : "border-gray-200"
                              }
                              ${
                                isPassed
                                  ? "bg-gray-100"
                                  : bookingStatus === "TEMPORARY"
                                  ? "bg-yellow-50"
                                  : bookingStatus === "PERMANENT"
                                  ? "bg-gray-100"
                                  : "bg-white"
                              }
                            `}
                          >
                            <div className="p-3 text-center">
                              <div className="flex justify-center">
                                <Clock className="w-4 h-4 text-gray-500" />
                              </div>
                              <Typography variant="body2" className="mt-1">
                                {convertTo12HourFormat(slot.startTime)}
                              </Typography>
                              <Typography
                                variant="caption"
                                className="text-gray-500 block"
                              >
                                ₹{selectedRoom.feesPerSlot}
                              </Typography>

                              {isSelected && (
                                <div className="absolute top-1 right-1 w-3 h-3 bg-indigo-500 rounded-full"></div>
                              )}

                              {bookingStatus === "PERMANENT" && (
                                <div className="mt-1 text-xs text-red-500">
                                  Booked
                                </div>
                              )}

                              {bookingStatus === "TEMPORARY" && (
                                <div className="mt-1 text-xs text-yellow-600">
                                  Reserved
                                </div>
                              )}

                              {isPassed && !bookingStatus && (
                                <div className="mt-1 text-xs text-orange-500">
                                  Passed
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    {selectedRoom.slots.filter((slot) => {
                      const hour = parseInt(slot.startTime.split(":")[0]);
                      return hour >= 12 && hour < 17;
                    }).length === 0 && (
                      <div className="w-full text-center py-3 text-gray-500 italic">
                        No afternoon slots available
                      </div>
                    )}
                  </div>
                </div>

                {/* Evening Slots */}
                <div>
                  <div className="flex items-center mb-2">
                    <Sunset className="w-4 h-4 text-red-500 mr-2" />
                    <Typography
                      variant="subtitle2"
                      className="text-gray-700 font-medium"
                    >
                      Evening
                    </Typography>
                  </div>
                  <div className="flex overflow-x-auto pb-2 hide-scrollbar">
                    {selectedRoom.slots
                      .filter((slot) => {
                        const hour = parseInt(slot.startTime.split(":")[0]);
                        return hour >= 17;
                      })
                      .map((slot) => {
                        const bookingStatus = isSlotBooked(slot.slotId);
                        const isPassed = hasSlotTimePassedToday(slot);
                        const isDisabled = bookingStatus || isPassed;
                        const isSelected = selectedSlots.includes(slot.slotId);

                        return (
                          <div
                            key={slot.slotId}
                            onClick={() =>
                              !isDisabled && handleSlotChange(slot.slotId)
                            }
                            className={`
                              flex-shrink-0 mx-1 w-24 border rounded-lg relative cursor-pointer transition-all
                              ${
                                isDisabled
                                  ? "cursor-not-allowed opacity-70"
                                  : "hover:border-indigo-300"
                              }
                              ${
                                isSelected
                                  ? "border-indigo-500 bg-indigo-50"
                                  : "border-gray-200"
                              }
                              ${
                                isPassed
                                  ? "bg-gray-100"
                                  : bookingStatus === "TEMPORARY"
                                  ? "bg-yellow-50"
                                  : bookingStatus === "PERMANENT"
                                  ? "bg-gray-100"
                                  : "bg-white"
                              }
                            `}
                          >
                            <div className="p-3 text-center">
                              <div className="flex justify-center">
                                <Clock className="w-4 h-4 text-gray-500" />
                              </div>
                              <Typography variant="body2" className="mt-1">
                                {convertTo12HourFormat(slot.startTime)}
                              </Typography>
                              <Typography
                                variant="caption"
                                className="text-gray-500 block"
                              >
                                ₹{selectedRoom.feesPerSlot}
                              </Typography>

                              {isSelected && (
                                <div className="absolute top-1 right-1 w-3 h-3 bg-indigo-500 rounded-full"></div>
                              )}

                              {bookingStatus === "PERMANENT" && (
                                <div className="mt-1 text-xs text-red-500">
                                  Booked
                                </div>
                              )}

                              {bookingStatus === "TEMPORARY" && (
                                <div className="mt-1 text-xs text-yellow-600">
                                  Reserved
                                </div>
                              )}

                              {isPassed && !bookingStatus && (
                                <div className="mt-1 text-xs text-orange-500">
                                  Passed
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    {selectedRoom.slots.filter(
                      (slot) => parseInt(slot.startTime.split(":")[0]) >= 17
                    ).length === 0 && (
                      <div className="w-full text-center py-3 text-gray-500 italic">
                        No evening slots available
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Slots Summary */}
                {selectedSlots.length > 0 && (
                  <div className="mt-4 bg-indigo-50 p-3 rounded-lg">
                    <Typography
                      variant="subtitle2"
                      className="text-indigo-700 mb-1"
                    >
                      Selected Time Slots ({selectedSlots.length})
                    </Typography>
                    <div className="flex flex-wrap gap-2">
                      {selectedSlots
                        .sort((a, b) => {
                          const slotA = selectedRoom.slots.find(
                            (s) => s.slotId === a
                          );
                          const slotB = selectedRoom.slots.find(
                            (s) => s.slotId === b
                          );
                          return (
                            parseInt(slotA.startTime) -
                            parseInt(slotB.startTime)
                          );
                        })
                        .map((slotId) => {
                          const slot = selectedRoom.slots.find(
                            (s) => s.slotId === slotId
                          );
                          return (
                            <div
                              key={slotId}
                              className="bg-white border border-indigo-200 rounded-lg px-2 py-1 flex items-center"
                            >
                              <Typography variant="caption">
                                {convertTo12HourFormat(slot.startTime)} -{" "}
                                {convertTo12HourFormat(slot.endTime)}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => handleSlotChange(slotId)}
                                className="ml-1 p-0.5 text-gray-400 hover:text-red-500"
                              >
                                <Trash2 className="w-3 h-3" />
                              </IconButton>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Studio Services Section */}
        {selectedRoom.type === "Studio" && (
          <Card className="mb-6 rounded-xl shadow-sm">
            <CardContent className="p-4">
              <Typography variant="subtitle2" className="text-gray-600 mb-3">
                Studio Services
              </Typography>

              {services.length > 0 ? (
                <Button
                  variant="outlined"
                  color="secondary"
                  fullWidth
                  onClick={() => setStudioServicesModalOpen(true)}
                  className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                  startIcon={<Music className="w-4 h-4" />}
                >
                  {selectedService && selectedSubPart
                    ? `Selected: ${selectedService.serviceName} - ${selectedSubPart.name}`
                    : "Select Studio Services"}
                </Button>
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No services available for this studio
                </Typography>
              )}
            </CardContent>
          </Card>
        )}

        {/* New Addons Section */}
        <Card className="mb-4 rounded-xl shadow-sm">
          <CardContent className="p-4">
            <Typography variant="subtitle2" className="text-gray-600 mb-3">
              Available Add-ons
            </Typography>

            {addons.length === 0 ? (
              <div className="text-center py-4 bg-gray-50 rounded-lg">
                <Guitar className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <Typography variant="body2" className="text-gray-500">
                  No add-on instruments available for this jam room
                </Typography>
              </div>
            ) : (
              <Button
                variant="outlined"
                color="secondary"
                fullWidth
                onClick={() => setAddonsModalOpen(true)}
                className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                startIcon={<Guitar className="w-4 h-4" />}
              >
                {selectedAddons.length > 0
                  ? `${selectedAddons.length} Add-on${
                      selectedAddons.length > 1 ? "s" : ""
                    } Selected`
                  : "Select Add-on Instruments"}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="mb-4 rounded-xl shadow-sm">
          <CardContent className="p-4">
            <Typography variant="subtitle2" className="text-gray-600 mb-3">
              Contact Number
            </Typography>

            <div className="mb-4">
              <TextField
                label="Phone Number"
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                fullWidth
                variant="outlined"
                placeholder="Enter your phone number"
                InputProps={{
                  startAdornment: (
                    <Phone className="w-4 h-4 text-gray-400 mr-2" />
                  ),
                }}
              />
              <div className="flex justify-between mt-2">
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => setSavedNumbersModalOpen(true)}
                  size="small"
                  disabled={savedNumbers.length === 0}
                  className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                >
                  {savedNumbers.length > 0
                    ? "Choose Saved Number"
                    : "No Saved Numbers"}
                </Button>

                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleSaveNumber}
                  size="small"
                  disabled={!phoneNumber || isSaving}
                  startIcon={
                    isSaving ? (
                      <CircularProgress size={16} />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )
                  }
                >
                  {isSaving ? "Saving..." : "Save Number"}
                </Button>
              </div>
            </div>

            {selectedPhoneNumber && (
              <div className="bg-indigo-50 p-2 rounded-lg text-center">
                <Typography variant="body2" className="text-indigo-700">
                  Using: {selectedPhoneNumber}
                </Typography>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-4 rounded-xl shadow-sm">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <Typography variant="body2" className="text-gray-600">
                Jam Room Fee
              </Typography>
              <Typography variant="body2">
                ₹{selectedSlots.length * (selectedRoom.feesPerSlot || 500)}
              </Typography>
            </div>

            {selectedAddons.length > 0 && (
              <div className="flex justify-between items-center mb-2">
                <Typography variant="body2" className="text-gray-600">
                  Add-on Instruments
                </Typography>
                <Typography variant="body2">
                  ₹{calculateAddonsCost()}
                </Typography>
              </div>
            )}

            {selectedSubPart && (
              <div className="flex justify-between items-center mb-2">
                <Typography variant="body2" className="text-gray-600">
                  Studio Service ({selectedService.serviceName} -{" "}
                  {selectedSubPart.name})
                </Typography>
                <Typography variant="body2">
                  ₹{selectedSubPart.price}
                </Typography>
              </div>
            )}

            <Divider className="my-2" />

            <div className="flex justify-between items-center">
              <Typography variant="subtitle1" className="font-semibold">
                Total Amount
              </Typography>
              <Typography variant="h6" className="font-bold text-indigo-700">
                ₹{calculateTotalCost()}
              </Typography>
            </div>
            <Typography variant="caption" className="text-gray-500">
              {selectedSlots.length} slot{selectedSlots.length !== 1 ? "s" : ""}{" "}
              × ₹{selectedRoom.feesPerSlot || 500}
              {selectedAddons.length > 0 &&
                ` + ${selectedAddons.length} add-on${
                  selectedAddons.length !== 1 ? "s" : ""
                }`}
            </Typography>
          </CardContent>
        </Card>

        {/* Fixed button at bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t p-4 z-10">
          <div className="max-w-md mx-auto"></div>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            className="rounded-lg py-3"
            disabled={
              selectedSlots.length === 0 ||
              !selectedDate ||
              !phoneNumber ||
              isLoading
            }
            onClick={handleProceedToReview}
            startIcon={
              isLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Check className="w-5 h-5" />
              )
            }
          >
            {isLoading ? "Processing..." : "Proceed to Review"}
          </Button>
        </div>

        {/* Studio Services Slide-up Modal */}
        {selectedRoom.type === "Studio" && (
          <Modal
            open={studioServicesModalOpen}
            onClose={() => setStudioServicesModalOpen(false)}
            className="flex items-end justify-center"
          >
            <div className="bg-white w-full max-w-md rounded-t-xl shadow-lg transform transition-transform duration-300 ease-in-out animate-slide-up overflow-hidden">
              <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
                <Typography variant="h6">Studio Services</Typography>
                <IconButton
                  onClick={() => setStudioServicesModalOpen(false)}
                  size="small"
                >
                  <ChevronLeft className="w-5 h-5" />
                </IconButton>
              </div>
              <div className="p-4 max-h-[70vh] overflow-y-auto">
                {/* Service Selection */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Typography variant="body1" className="font-medium">
                      Select Service
                    </Typography>
                    <div className="grid grid-cols-2 gap-2">
                      {services.map((service) => (
                        <div
                          key={service._id}
                          onClick={() => handleServiceSelect(service)}
                          className={`
                            p-3 rounded-lg cursor-pointer transition-all
                            ${
                              selectedService?._id === service._id
                                ? "bg-indigo-100 border-2 border-indigo-500"
                                : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
                            }
                          `}
                        >
                          <Typography variant="body2" className="font-medium">
                            {service.serviceName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {service.category}
                          </Typography>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sub-parts Selection */}
                  {selectedService && (
                    <div className="space-y-2">
                      <Typography variant="body1" className="font-medium">
                        Select Option
                      </Typography>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedService.subParts.map((subPart, index) => (
                          <div
                            key={index}
                            onClick={() => handleSubPartSelect(subPart)}
                            className={`
                              p-3 rounded-lg cursor-pointer transition-all
                              ${
                                selectedSubPart?._id === subPart._id
                                  ? "bg-indigo-100 border-2 border-indigo-500"
                                  : "bg-gray-50 border-2 border-transparent hover:bg-gray-100"
                              }
                            `}
                          >
                            <Typography variant="body2" className="font-medium">
                              {subPart.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              ₹{subPart.price}
                            </Typography>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={() => {
                      if (selectedService && selectedSubPart) {
                        setStudioServicesModalOpen(false);
                      } else {
                        alert("Please select both a service and an option");
                      }
                    }}
                    disabled={!selectedService || !selectedSubPart}
                    className="mt-4"
                  >
                    Confirm Selection
                  </Button>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* Addons Slide-up Modal */}
        <Modal
          open={addonsModalOpen}
          onClose={() => setAddonsModalOpen(false)}
          className="flex items-end justify-center"
        >
          <div className="bg-white w-full max-w-md rounded-t-xl shadow-lg transform transition-transform duration-300 ease-in-out animate-slide-up overflow-hidden">
            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
              <Typography variant="h6">Add-on Instruments</Typography>
              <IconButton
                onClick={() => setAddonsModalOpen(false)}
                size="small"
              >
                <ChevronLeft className="w-5 h-5" />
              </IconButton>
            </div>
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              <List>
                {addons.map(
                  (addon) =>
                    addon.isAvailable && (
                      <ListItem
                        key={addon._id}
                        className={`
                        border rounded-lg mb-3 transition-all
                        ${
                          selectedAddons.includes(addon._id)
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-gray-200"
                        }
                      `}
                      >
                        <ListItemIcon>
                          <Guitar className="text-indigo-500" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body1" className="font-medium">
                              {addon.instrumentType.join(", ")}
                            </Typography>
                          }
                          secondary={`₹${addon.pricePerHour}/hour · ${addon.quantity} available`}
                        />
                        <ListItemSecondaryAction>
                          <Checkbox
                            edge="end"
                            onChange={() => handleAddonToggle(addon._id)}
                            checked={selectedAddons.includes(addon._id)}
                            color="primary"
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                    )
                )}
              </List>

              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={() => setAddonsModalOpen(false)}
                className="mt-4"
              >
                {selectedAddons.length > 0
                  ? `Confirm ${selectedAddons.length} Add-on${
                      selectedAddons.length > 1 ? "s" : ""
                    }`
                  : "No Add-ons Selected"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Saved Numbers Slide-up Modal */}
        <Modal
          open={savedNumbersModalOpen}
          onClose={() => setSavedNumbersModalOpen(false)}
          className="flex items-end justify-center"
        >
          <div className="bg-white w-full max-w-md rounded-t-xl shadow-lg transform transition-transform duration-300 ease-in-out animate-slide-up overflow-hidden">
            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
              <Typography variant="h6">Saved Numbers</Typography>
              <IconButton
                onClick={() => setSavedNumbersModalOpen(false)}
                size="small"
              >
                <ChevronLeft className="w-5 h-5" />
              </IconButton>
            </div>
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              <RadioGroup
                value={selectedPhoneNumber}
                onChange={(e) => {
                  handleSavedNumberChange(e);
                }}
              >
                {savedNumbers.map((number, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b border-gray-100 py-3"
                  >
                    <FormControlLabel
                      value={number}
                      control={<Radio color="primary" />}
                      label={<Typography variant="body1">{number}</Typography>}
                      className="flex-grow"
                    />
                    <IconButton
                      onClick={() => handleDeleteNumber(number)}
                      size="small"
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </IconButton>
                  </div>
                ))}
              </RadioGroup>

              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={() => setSavedNumbersModalOpen(false)}
                disabled={!selectedPhoneNumber}
                className="mt-4"
              >
                Use Selected Number
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}

export default Booking;

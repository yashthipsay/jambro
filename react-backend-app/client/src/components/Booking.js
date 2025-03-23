"use client";

import { useState, useEffect, useMemo } from "react";
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
} from "lucide-react";
import moment from "moment-timezone";
import io from "socket.io-client";
import { useAuth0 } from "@auth0/auth0-react";

const socket = io("http://localhost:5000");

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

  useEffect(() => {
    if (selectedRoom) {
      socket.emit("getBookings", selectedRoom.id);

      // Fetch addons for this jamroom
      fetch(`http://localhost:5000/api/jamrooms/${selectedRoom.id}/addons`)
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            setAddons(data.data);
          }
        })
        .catch((err) => console.error("Error fetching addons:", err));
    }

    socket.on("bookings", (data) => {
      setBookings(data);
    });

    return () => {
      socket.off("bookings");
    };
  }, [selectedRoom]);

  useMemo(() => {
    const fetchServices = async () => {
      try {
        // Add check for _id
        if (!selectedRoom?.id) {
          console.log("No room ID available");
          return;
        }

        console.log("Fetching services for room:", selectedRoom._id);

        const response = await fetch(
          `http://localhost:5000/api/jamrooms/${selectedRoom.id}/services`
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
      fetch("http://localhost:5000/api/users", {
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

  // Add after existing useEffect hooks
  useEffect(() => {
    if (selectedDate && selectedRoom) {
      checkReservations();

      socket.on("reservationUpdate", (data) => {
        if (
          data.jamRoomId === selectedRoom.id &&
          data.date === moment(selectedDate).format("YYYY-MM-DD")
        ) {
          setReservedSlots(
            new Set(data.reservations.slots.map((r) => r.slotId))
          );
        }
      });

      // Clean up socket listener
      return () => {
        socket.off("reservationUpdate");
      };
    }
  }, [selectedDate, selectedRoom]);

  // Add this function to handle reservation checks
  const checkReservations = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/reservations/check/${
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
  };

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

  // Add this new section in your return statement, before the fixed action buttons
  const renderServicesSection = () => (
    <Card className="mb-6 rounded-xl shadow-sm">
      <CardContent className="p-4">
        <Typography variant="subtitle2" className="text-gray-600 mb-3">
          Studio Services
        </Typography>

        {services.length > 0 ? (
          <div className="space-y-4">
            {/* Service Selection */}
            <div className="space-y-2">
              <Typography variant="body2" className="text-gray-500">
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
                <Typography variant="body2" className="text-gray-500">
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
          </div>
        ) : (
          <Typography variant="body2" color="textSecondary">
            No services available for this studio
          </Typography>
        )}
      </CardContent>
    </Card>
  );

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
    if (reservedSlots.has(String(slotId))) return "TEMPORARY";

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

  const handleSlotChange = (slotId) => {
    setSelectedSlots((prev) =>
      prev.includes(slotId)
        ? prev.filter((id) => id !== slotId)
        : [...prev, slotId]
    );
  };

  const handleSaveNumber = async () => {
    if (!phoneNumber) {
      alert("Please enter a valid phone number");
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch(
        "http://localhost:5000/api/users/save-number",
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
        "http://localhost:5000/api/users/delete-number",
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
      const slotsDetails = selectedSlots.map((slotId) => {
        const slot = selectedRoom.slots.find((s) => s.slotId === slotId);
        return {
          slotId: slot.slotId,
          startTime: slot.startTime,
          endTime: slot.endTime,
        };
      });

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

      // Create temporary reservation
      const reservation = await fetch(
        "http://localhost:5000/api/reservations/create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jamRoomId: selectedRoom.id,
            date: moment(selectedDate).format("YYYY-MM-DD"),
            slots: slotsDetails,
            selectedAddons: selectedAddonsDetails,
            userId: user.sub,
          }),
        }
      ).then((res) => res.json());

      if (!reservation.success) {
        alert(reservation.message || "Failed to reserve slots and addons");
        return;
      }

      navigate("/final-review", {
        state: {
          jamRoomName: selectedRoom.name,
          selectedSlots: slotsDetails,
          totalAmount: calculateTotalCost(),
          phoneNumber: selectedPhoneNumber,
          selectedRoomId: selectedRoom.id,
          selectedDate: moment(selectedDate)
            .tz("Asia/Kolkata")
            .format("YYYY-MM-DD"),
          selectedAddons: selectedAddonsDetails,
          addonsCost: calculateAddonsCost(),
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
        },
      });
    } catch (error) {
      console.error("Error creating reservation:", error);
      alert("Failed to create reservation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
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
              <FormGroup className="grid grid-cols-2 gap-2">
                {selectedRoom.slots.map((slot) => {
                  const bookingStatus = isSlotBooked(slot.slotId);
                  const isPassed = hasSlotTimePassedToday(slot);
                  const isDisabled = bookingStatus || isPassed;

                  return (
                    <div
                      key={slot.slotId}
                      className={`
        border rounded-lg p-3 relative
        ${
          isPassed
            ? "bg-gray-100 border-gray-200"
            : bookingStatus === "TEMPORARY"
            ? "bg-yellow-50 border-yellow-200"
            : bookingStatus === "PERMANENT"
            ? "bg-gray-100 border-gray-200"
            : "border-gray-300"
        }
        ${
          selectedSlots.includes(slot.slotId)
            ? "border-indigo-500 bg-indigo-50"
            : ""
        }
      `}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedSlots.includes(slot.slotId)}
                            onChange={() => handleSlotChange(slot.slotId)}
                            disabled={isDisabled}
                            className="absolute top-2 right-2"
                            color="primary"
                            size="small"
                          />
                        }
                        label={
                          <div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 text-gray-500 mr-1" />
                              <Typography variant="body2">
                                {slot.startTime} - {slot.endTime}
                              </Typography>
                            </div>
                            <Typography
                              variant="caption"
                              className="text-gray-500"
                            >
                              ₹{selectedRoom.feesPerSlot}
                            </Typography>

                            {bookingStatus === "PERMANENT" && (
                              <div className="mt-1 text-xs text-red-500">
                                Already booked
                              </div>
                            )}

                            {bookingStatus === "TEMPORARY" && (
                              <div className="mt-1 text-xs text-yellow-600">
                                Temporarily reserved
                              </div>
                            )}

                            {isPassed && !bookingStatus && (
                              <div className="mt-1 text-xs text-orange-500">
                                Time passed
                              </div>
                            )}
                          </div>
                        }
                        className="m-0"
                      />
                    </div>
                  );
                })}
              </FormGroup>
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
                <div className="space-y-4">
                  {/* Service Selection */}
                  <div className="space-y-2">
                    <Typography variant="body2" className="text-gray-500">
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
                      <Typography variant="body2" className="text-gray-500">
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
                </div>
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
              <List>
                {addons.map(
                  (addon) =>
                    addon.isAvailable && (
                      <ListItem
                        key={addon._id}
                        className={`
                        border rounded-lg mb-2 transition-all
                        ${
                          selectedAddons.includes(addon._id)
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-gray-200"
                        }
                      `}
                      >
                        <ListItemIcon>
                          <Guitar className="text-gray-600" />
                        </ListItemIcon>
                        <ListItemText
                          primary={addon.instrumentType.join(", ")}
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
              <div className="flex justify-end mt-2">
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

            {savedNumbers.length > 0 && (
              <>
                <Typography variant="subtitle2" className="text-gray-600 mb-2">
                  Saved Numbers
                </Typography>
                <RadioGroup
                  value={selectedPhoneNumber}
                  onChange={handleSavedNumberChange}
                >
                  {savedNumbers.map((number, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between border-b border-gray-100 py-2"
                    >
                      <FormControlLabel
                        value={number}
                        control={<Radio color="primary" />}
                        label={number}
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
              </>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6 rounded-xl shadow-sm">
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
      </div>
    </div>
  );
}

export default Booking;

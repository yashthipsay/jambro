import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import {
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  IconButton,
  Modal,
  Box,
} from "@mui/material";
import {
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  Music,
  Download,
  X,
  CreditCard,
} from "lucide-react";
import moment from "moment-timezone";
import html2canvas from "html2canvas";

const PastBookings = () => {
  const navigate = useNavigate();
  const { user } = useAuth0();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const invoiceRef = useRef(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        if (!user?.email) return;

        // Get user ID
        const userResponse = await fetch("https://gigsaw.onrender.com/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: user.email }),
        });

        const userData = await userResponse.json();
        if (!userData.success) throw new Error("User not found");

        const userId = userData.data._id;

        // Fetch bookings with the user ID
        const bookingsResponse = await fetch(
          `https://gigsaw.onrender.com/api/bookings/users/${userId}/`
        );
        const bookingsData = await bookingsResponse.json();

        if (bookingsData.success) {
          setBookings(bookingsData.data);
        } else {
          setError(bookingsData.message || "Failed to load bookings");
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
        setError("Something went wrong while fetching your bookings");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setModalOpen(true);
  };

  const handleDownloadReceipt = async () => {
    try {
      if (invoiceRef.current) {
        // Create a canvas from the invoice element
        const canvas = await html2canvas(invoiceRef.current, {
          scale: 2, // Higher scale for better quality
          backgroundColor: "#ffffff",
          logging: false,
          useCORS: true, // Enable if you have images from external sources
        });

        // Convert the canvas to a data URL
        const imageData = canvas.toDataURL("image/png");

        // Create a download link and trigger it
        const link = document.createElement("a");
        link.href = imageData;
        link.download = `booking-${selectedBooking._id.slice(-6)}.png`;
        link.click();
      }
    } catch (error) {
      console.error("Error downloading screenshot:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "NOT_STARTED":
        return "bg-amber-500 text-white";
      case "ONGOING":
        return "bg-blue-500 text-white";
      case "COMPLETED":
        return "bg-green-500 text-white";
      case "TERMINATED":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "NOT_STARTED":
        return "Upcoming";
      case "ONGOING":
        return "In Progress";
      case "COMPLETED":
        return "Completed";
      case "TERMINATED":
        return "Cancelled";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <CircularProgress color="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">!</div>
          <h1 className="text-xl font-bold text-gray-800 mb-4">
            Oops, something went wrong
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={() => navigate("/")}
            startIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-md text-center">
          <Music className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-4">
            No Bookings Found
          </h1>
          <p className="text-gray-600 mb-6">
            You haven't made any bookings yet.
          </p>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={() => navigate("/")}
            startIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Browse Jam Rooms
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <IconButton
              onClick={() => navigate("/")}
              edge="start"
              color="primary"
            >
              <ArrowLeft className="w-5 h-5" />
            </IconButton>
            <Typography variant="h5" className="ml-2 font-bold">
              Your Bookings
            </Typography>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bookings.map((booking) => (
            console.log(booking),
            // log booking
            <Card
              key={booking._id}
              className="rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <Typography variant="h6" className="font-semibold">
                    {booking.jamRoom?.jamRoomDetails?.name || 'Unnamed Room'}
                    </Typography>
                    <Typography variant="body2" className="text-gray-600">
                      Booking #{booking._id.slice(-6)}
                    </Typography>
                  </div>
                  <Chip
                    label={getStatusText(booking.status)}
                    size="small"
                    className={getStatusColor(booking.status)}
                  />
                </div>

                <div className="mb-3">
                  <div className="flex items-center mb-2">
                    <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                    <Typography variant="body2">
                      {moment(booking.date).format("MMM D, YYYY")}
                    </Typography>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-gray-500 mr-2" />
                    <Typography variant="body2">
                      {booking.slots
                        .map((slot) => `${slot.startTime} - ${slot.endTime}`)
                        .join(", ")}
                    </Typography>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <Typography variant="subtitle1" className="font-semibold">
                    ₹{booking.totalAmount}
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={() => handleViewDetails(booking)}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Booking Details Modal */}
        <Modal
          open={modalOpen && selectedBooking !== null}
          onClose={() => setModalOpen(false)}
          className="flex items-center justify-center p-4"
        >
          <Box className="bg-white rounded-xl shadow-lg w-full max-w-xl outline-none overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <Typography variant="h6" className="font-semibold">
                Booking Details
              </Typography>
              <IconButton onClick={() => setModalOpen(false)} size="small">
                <X className="w-5 h-5" />
              </IconButton>
            </div>

            {selectedBooking && (
              <div className="p-4 max-h-[80vh] overflow-y-auto">
                {/* Invoice-style receipt */}
                <Paper
                  elevation={0}
                  variant="outlined"
                  className="p-6"
                  ref={invoiceRef}
                >
                  {/* Header with logo */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <img
                        src="/gigsaw_ss.png"
                        alt="GigSaw Logo"
                        className="h-8 mr-2"
                      />
                      <Typography variant="h6" className="font-bold">
                        GigSaw
                      </Typography>
                    </div>
                    <Chip
                      label={getStatusText(selectedBooking.status)}
                      size="small"
                      className={getStatusColor(selectedBooking.status)}
                    />
                  </div>

                  <div className="flex justify-between items-start">
                    <div>
                      <Typography
                        variant="h5"
                        className="font-bold text-gray-800"
                      >
                        RECEIPT
                      </Typography>
                      <Typography
                        variant="body2"
                        className="text-gray-600 mt-1"
                      >
                        #{selectedBooking._id}
                      </Typography>
                    </div>
                    <div className="text-right">
                      <Typography variant="body2" className="text-gray-600">
                        Date:
                      </Typography>
                      <Typography variant="body1">
                        {moment(
                          selectedBooking.createdAt || selectedBooking.date
                        ).format("MMM D, YYYY")}
                      </Typography>
                    </div>
                  </div>

                  <Divider className="my-4" />

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Typography variant="subtitle2" className="text-gray-600">
                        Customer
                      </Typography>
                      <Typography variant="body1">{user?.name}</Typography>
                      <Typography variant="body2" className="text-gray-600">
                        {user?.email}
                      </Typography>
                    </div>
                    <div>
                      <Typography variant="subtitle2" className="text-gray-600">
                        Jam Room
                      </Typography>
                      <Typography variant="body1">
                        {selectedBooking.jamRoom.name}
                      </Typography>
                      <div className="flex items-center mt-1">
                        <MapPin className="w-4 h-4 text-gray-500 mr-1" />
                        <Typography variant="body2" className="text-gray-600">
                          {selectedBooking.jamRoom.location?.address ||
                            "Address not available"}
                        </Typography>
                      </div>
                    </div>
                  </div>

                  <Box className="bg-gray-50 rounded-lg p-4 my-4">
                    <div className="flex items-center mb-2">
                      <Calendar className="w-4 h-4 text-gray-600 mr-2" />
                      <Typography variant="body1">
                        {moment(selectedBooking.date).format("MMM D, YYYY")}
                      </Typography>
                    </div>

                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-gray-600 mr-2" />
                      <Typography variant="body1">
                        {selectedBooking.slots
                          ?.map((slot) => `${slot.startTime} - ${slot.endTime}`)
                          .join(", ")}
                      </Typography>
                    </div>
                  </Box>

                  <div className="mt-4">
                    <Typography variant="subtitle1" className="font-semibold">
                      Booking Details
                    </Typography>

                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between">
                        <Typography variant="body2">Jam Room Fee</Typography>
                        <Typography variant="body2">
                          ₹{selectedBooking.totalAmount}
                        </Typography>
                      </div>
                    </div>
                  </div>

                  <Divider className="my-4" />

                  <div className="flex justify-between items-center">
                    <Typography variant="subtitle1" className="font-semibold">
                      Total Amount
                    </Typography>
                    <Typography
                      variant="h6"
                      className="font-bold text-indigo-700"
                    >
                      ₹{selectedBooking.totalAmount}
                    </Typography>
                  </div>

                  <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center">
                    <CreditCard className="w-5 h-5 text-green-500 mr-2" />
                    <div>
                      <Typography variant="body2" className="text-green-700">
                        Paid with Razorpay
                      </Typography>
                      <Typography variant="caption" className="text-green-600">
                        Transaction ID: {selectedBooking.paymentId || "N/A"}
                      </Typography>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-6 pt-4 border-t text-center">
                    <Typography variant="caption" className="text-gray-500">
                      Thank you for booking with GigSaw! For support, contact
                      support@gigsaw.com
                    </Typography>
                  </div>
                </Paper>

                <div className="flex justify-center mt-4">
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Download />}
                    onClick={handleDownloadReceipt}
                  >
                    Download Receipt
                  </Button>
                </div>
              </div>
            )}
          </Box>
        </Modal>
      </div>
    </div>
  );
};

export default PastBookings;

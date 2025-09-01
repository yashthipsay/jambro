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
import { useAPI, apiClient, CACHE_KEYS } from "../utils/apiFetcher";

const PastBookings = () => {
  const navigate = useNavigate();
  const { user } = useAuth0();
  const [bookings, setBookings] = useState([]);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const invoiceRef = useRef(null);
  const [userId, setUserId] = useState(null);

 useEffect(() => {
   let mounted = true;
   const run = async () => {
     try {
       if (!user?.email) {
         if (mounted) setIsUserLoading(false);
         return;
       }
       const res = await apiClient.post(CACHE_KEYS.USER_PROFILE, { email: user.email }, {
         mutateKey: CACHE_KEYS.USER_PROFILE
       });
       if (mounted) {
         if (res?.success && res?.data?._id) {
           setUserId(res.data._id);
         } else {
           setError(res?.message || "User not found");
         }
       }
     } catch (e) {
       if (mounted) setError("Failed to load user");
     } finally {
       if (mounted) setIsUserLoading(false);
     }
   };
   run();
   return () => { mounted = false; };
 }, [user]);

 // SWR: fetch and cache bookings once we have userId
 const {
   data: bookingsResp,
  isLoading: bookingsLoading,
   error: bookingsFetchError,
 } = useAPI(userId ? CACHE_KEYS.USER_BOOKINGS(userId) : null, {
   revalidateOnFocus: false,
   dedupingInterval: 60000,
 });

 // Reflect SWR data into local state for minimal UI changes
 useEffect(() => {
   if (bookingsResp?.success) {
     setBookings(bookingsResp.data || []);
   }
 }, [bookingsResp]);

 const loading = isUserLoading || bookingsLoading;
 const displayError =
   error || (bookingsFetchError ? (bookingsFetchError.info?.message || "Failed to load bookings") : null);

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
        const imageData = canvas.toDataURL("image/png");
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
            // ...existing code...
            <Card
              key={booking._id}
              className="rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <Typography variant="h6" className="font-semibold">
                      {booking.jamRoom?.jamRoomDetails?.name || booking.jamRoom?.name || 'Unnamed Room'}
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

                {/* New: show Net Paid and Refund info */}
                <div className="flex justify-between items-center mt-4">
                  <div>
                    {booking.refundDetails?.amount ? (
                      <>
                        <Typography variant="subtitle1" className="font-semibold">
                          ₹{Math.max(0, booking.totalAmount - booking.refundDetails.amount)}
                        </Typography>
                        <Typography variant="caption" className="text-red-600 block">
                          Refunded: ₹{booking.refundDetails.amount}
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="subtitle1" className="font-semibold">
                        ₹{booking.totalAmount}
                      </Typography>
                    )}
                  </div>
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
                {/* Invoice-style (mirrors BookingConfirmation) */}
                <Paper
                  elevation={0}
                  variant="outlined"
                  className="p-0 overflow-hidden rounded-2xl border border-indigo-100 shadow-sm"
                  ref={invoiceRef}
                >
                  {/* Top bar */}
                  <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                  {/* Header */}
                  <div className="p-5 sm:p-6 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                      <img src="/gigsaw_ss.png" alt="GigSaw" className="h-8 w-8 rounded" />
                      <div>
                        <Typography variant="h6" className="font-bold leading-tight">
                          GigSaw
                        </Typography>
                        <Typography variant="caption" className="text-gray-500">
                          Receipt #{selectedBooking._id.slice(-6)}
                        </Typography>
                      </div>
                    </div>
                    <div className="text-right">
                      <Chip
                        label={getStatusText(selectedBooking.status)}
                        color={selectedBooking.status === "TERMINATED" ? "error" : "success"}
                        size="small"
                        className="font-semibold"
                      />
                      <div className="mt-1 text-xs text-gray-500">
                        {moment(selectedBooking.createdAt || selectedBooking.date).format("MMM D, YYYY")}
                      </div>
                    </div>
                  </div>

                  <Divider />

                  {/* Parties */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 p-5 sm:p-6 bg-white">
                    <div className="rounded-xl border border-gray-100 p-4">
                      <Typography variant="subtitle2" className="text-gray-500 mb-1">
                        Customer
                      </Typography>
                      <Typography variant="body1" className="font-medium">{user?.name}</Typography>
                      <Typography variant="body2" className="text-gray-600">{user?.email}</Typography>
                    </div>
                    <div className="rounded-xl border border-gray-100 p-4">
                      <Typography variant="subtitle2" className="text-gray-500 mb-1">
                        Jam Room
                      </Typography>
                      <Typography variant="body1" className="font-medium">
                        {selectedBooking.jamRoom?.jamRoomDetails?.name || selectedBooking.jamRoom?.name || "Unnamed Room"}
                      </Typography>
                      <div className="flex items-start gap-2 mt-1 text-gray-600">
                        <MapPin className="w-4 h-4 mt-0.5 text-gray-500" />
                        <Typography variant="body2">
                          {selectedBooking.jamRoom?.location?.address || "Address not available"}
                        </Typography>
                      </div>
                    </div>
                  </div>

                  {/* Schedule */}
                  <div className="px-5 sm:px-6 pb-4">
                    <Box className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-indigo-600" />
                          <Typography variant="body2" className="text-gray-800">
                            {moment(selectedBooking.date).format("MMM D, YYYY")}
                          </Typography>
                        </div>
                        <div className="flex items-start gap-2">
                          <Clock className="w-4 h-4 text-indigo-600 mt-0.5" />
                          <Typography variant="body2" className="text-gray-800">
                            {selectedBooking.slots?.map(s => `${s.startTime} - ${s.endTime}`).join(", ")}
                          </Typography>
                        </div>
                      </div>
                    </Box>
                  </div>

                  {/* Summary */}
                  <div className="px-5 sm:px-6 py-4">
                    <Typography variant="subtitle2" className="text-gray-600 mb-2">
                      Summary
                    </Typography>
                    <div className="rounded-xl border border-gray-100 bg-white">
                      <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-gray-700">Jam Room Fee</span>
                        <span className="font-medium">₹{selectedBooking.totalAmount}</span>
                      </div>

                      {/* Optional discount row (if stored on booking) */}
                      {selectedBooking.discountAmount > 0 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                          <span className="text-gray-700">Discounts</span>
                          <span className="font-medium text-green-700">-₹{selectedBooking.discountAmount}</span>
                        </div>
                      )}
                      {/* List applied discounts */}
                      {selectedBooking.appliedDiscounts?.length > 0 && (
                        <div className="px-4 pb-3 border-t border-gray-100">
                          <Typography variant="caption" className="text-gray-500">
                            {selectedBooking.appliedDiscounts
                              .map(d => `${d.label} (${Math.round(d.percent * 100)}%)`)
                              .join(", ")}
                          </Typography>
                        </div>
                      )}
                      {/* Convenience Fee */}
                      {selectedBooking.convenienceFee > 0 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                          <span className="text-gray-700">Convenience Fee</span>
                          <span className="font-medium">₹{selectedBooking.convenienceFee}</span>
                        </div>
                      )}

                      {/* Refund row for cancelled bookings */}
                      {selectedBooking.refundDetails?.amount > 0 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                          <span className="text-gray-700">Refund</span>
                          <span className="font-medium text-red-600">-₹{selectedBooking.refundDetails.amount}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-indigo-50/60 rounded-b-xl">
                        <span className="font-semibold text-gray-900">
                          {selectedBooking.refundDetails?.amount ? "Net Paid" : "Total"}
                        </span>
                        <span className="font-bold text-indigo-700">
                          ₹{Math.max(0, selectedBooking.totalAmount - (selectedBooking.refundDetails?.amount || 0))}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment */}
                  <div className="px-5 sm:px-6 pb-6">
                    <div className="mt-2 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <Typography variant="body2" className="text-green-700">
                          {selectedBooking.status === "TERMINATED" ? "Refunded via Razorpay" : "Paid with Razorpay"}
                        </Typography>
                        <Typography variant="caption" className="text-green-600">
                          Transaction ID: {selectedBooking.paymentId || "N/A"}
                        </Typography>
                        {selectedBooking.refundDetails?.razorpayRefundId && (
                          <Typography variant="caption" className="text-green-600 block">
                            Refund ID: {selectedBooking.refundDetails.razorpayRefundId}
                          </Typography>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t text-center">
                      <Typography variant="caption" className="text-gray-500">
                        Thank you for booking with GigSaw! For support, contact support@gigsaw.com
                      </Typography>
                    </div>
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

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  IconButton,
} from "@mui/material";
import { ChevronLeft, CreditCard } from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";
import { apiClient, CACHE_KEYS, useAPI } from "../utils/apiFetcher";

// Add new reservation-related cache keys
const RESERVATION_CACHE_KEYS = {
  EXTEND: "/reservations/extend",
  RELEASE: "/reservations/release",
  CHECKOUT: "/payments/checkout",
  VERIFY: "/payments/verify",
  CREATE_BOOKING: "/bookings",
};

const FinalReview = () => {
  const [isLeaving, setIsLeaving] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isPaymentInProgress, setIsPaymentInProgress] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  const {
    jamRoomName,
    selectedSlots,
    totalAmount,
    phoneNumber,
    selectedRoomId,
    selectedDate,
    addonsCost,
    selectedAddons,
    selectedService,
    reservationExpiresAt,
  } = location.state;
  const { user } = useAuth0();

  const [couponCode, setCouponCode] = useState("");
  const [appliedDiscounts, setAppliedDiscounts] = useState([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountedTotal, setDiscountedTotal] = useState(totalAmount);
  // Use SWR for user data
  const [userProfile, setUserProfile] = useState(null);
  useEffect(() => {
    if (!user?.email) return;
    let cancelled = false;
    apiClient
      .post(CACHE_KEYS.USER_PROFILE, { email: user.email }, { mutateKey: CACHE_KEYS.USER_PROFILE })
      .then((res) => {
        if (!cancelled && res?.success) setUserProfile(res.data);
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  // Release reservation using apiClient
  const releaseReservation = useCallback(async () => {
    if (!selectedRoomId || !selectedDate || !selectedSlots) return;

    try {
      await fetch("http://localhost:5000/api/reservations/release", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        body: JSON.stringify({
          jamRoomId: selectedRoomId,
          date: selectedDate,
          slots: selectedSlots,
        }),
      });
    } catch (error) {
      console.error("Error releasing reservation:", error);
    }
  }, [selectedRoomId, selectedDate, selectedSlots]);

  const evaluateDiscounts = async (code = couponCode) => {
    try {
      const resp = await apiClient.post(CACHE_KEYS.DISCOUNTS_EVALUATE, {
        userId: userProfile?._id,               // we load this above in this file
        jamRoomId: selectedRoomId,
        date: selectedDate,                     // 'YYYY-MM-DD'
        slots: selectedSlots,                   // [{slotId, startTime, endTime}]
        totalAmount,                            // current pre-fee total
        couponCode: code || undefined,
      });
      if (resp?.success) {
        setAppliedDiscounts(resp.data.appliedDiscounts || []);
        setDiscountAmount(resp.data.discountAmount || 0);
        setDiscountedTotal(resp.data.discountedTotal ?? totalAmount);
      }
    } catch (e) {
      console.error("evaluateDiscounts failed", e);
    }
  };

  useEffect(() => {
    // Auto-evaluate without a code to apply welcome/off-peak/bulk/etc.
    if (userProfile?._id && selectedRoomId && selectedDate && selectedSlots?.length) {
      evaluateDiscounts("");
    }
  }, [userProfile?._id, selectedRoomId, selectedDate, selectedSlots]);

  // Cleanup to release reservation when component unmounts if leaving
  useEffect(() => {
    return () => {
      if (isLeaving) {
        releaseReservation();
      }
    };
  }, [isLeaving, releaseReservation]);

  // Warn user when they try to close or reload the page
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue =
        "Are you sure you want to leave? Your temporary reservation will be released.";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Add new effect to handle mobile navigation
  // useEffect(() => {
  //   // Push state if not already present
  //   if (!window.history.state || window.history.state.page !== "final-review") {
  //     window.history.pushState(
  //       { page: "final-review", source: "booking" },
  //       document.title,
  //       window.location.href
  //     );
  //   }

  //   const handlePopState = (e) => {
  //     e.preventDefault();
  //     // If payment in progress, prevent navigation
  //     if (isPaymentInProgress) {
  //       window.history.pushState(
  //         { page: "final-review", source: "booking" },
  //         document.title,
  //         window.location.href
  //       );
  //       return;
  //     }

  //     // Release reservation and navigate back
  //     setIsLeaving(true);
  //     fetch("http://localhost:5000/api/reservations/release", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         jamRoomId: selectedRoomId,
  //         date: selectedDate,
  //         slots: selectedSlots,
  //       }),
  //     });

  //     // Use natural back navigation
  //     navigate(-1);
  //   };

  //   window.addEventListener("popstate", handlePopState);
  //   return () => window.removeEventListener("popstate", handlePopState);
  // }, [
  //   isPaymentInProgress,
  //   selectedRoomId,
  //   selectedDate,
  //   selectedSlots,
  //   navigate,
  // ]);

  // Handle back button click
  const handleBack = () => {
    setIsLeaving(true);
    navigate(-1);
  };

  useEffect(() => {
    if (!reservationExpiresAt) return;

    const timer = setInterval(() => {
      if (isPaymentInProgress) {
        // Don't expire while payment is in progress
        return;
      }

      const now = Date.now();
      const remaining = reservationExpiresAt - now;

      if (remaining <= 0) {
        setIsExpired(true);
        clearInterval(timer);
        // Redirect after showing message for 2 seconds
        setTimeout(() => {
          setIsLeaving(true);
          navigate(-1, {
            state: {
              expired: true,
              message:
                "Your slot reservation has expired. Please select slots again.",
            },
          });
        }, 2000);
      } else {
        setTimeRemaining(Math.floor(remaining / 1000));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [reservationExpiresAt, navigate, isPaymentInProgress]);

  // Calculate convenience fee after discount
  const convenienceFee = Math.round((discountedTotal) * 0.025);
  const totalWithConvenience = discountedTotal + convenienceFee;

  // Enhanced checkout handler using apiClient
  const checkoutHandler = async () => {
    try {
      setIsPaymentInProgress(true);

      // 1. Extend the reservation first
      const extensionMinutes = 3;
      const extendResp = await fetch("http://localhost:5000/api/reservations/extend", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        body: JSON.stringify({
          jamRoomId: selectedRoomId,
          date: selectedDate,
          slots: selectedSlots,
          additionalMinutes: extensionMinutes,
        }),
      });
      const extensionData = await extendResp.json();

      if (extensionData.success) {
        // Update local expiry time
        const newTimeRemaining = extensionMinutes * 60; // Convert minutes to seconds
        setTimeRemaining(newTimeRemaining);
      }

      // 2. Create checkout session
      const checkoutData = await apiClient.post(
        RESERVATION_CACHE_KEYS.CHECKOUT,
        {
          amount: totalWithConvenience,
        }
      );

      if (!checkoutData.success) {
        throw new Error(checkoutData.message || "Failed to initiate checkout");
      }

      // 3. Configure Razorpay
      const options = {
        key: process.env.REACT_APP_RAZORPAY_API_KEY,
        amount: checkoutData.order.amount * 100,
        currency: "INR",
        name: jamRoomName,
        description: "Jam Room Booking",
        order_id: checkoutData.order.id,
        prefill: {
          name: userProfile?.name || user?.name,
          email: user?.email,
          contact: phoneNumber,
        },
        timeout: 180,
        modal: {
          escape: false,
          animation: true,
          backdropClose: false,
          ondismiss: function () {
            setIsPaymentInProgress(false);
            setIsLeaving(true);
            navigate(`/jam-room/${selectedRoomId}`);
          },
        },
        handler: async (response) => {
          setIsPaymentInProgress(false);

          // 4. Verify payment and create booking
          const verificationData = await apiClient.post(
            RESERVATION_CACHE_KEYS.VERIFY,
            {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              email: user.email,
              jamRoomId: selectedRoomId,
              date: selectedDate,
              slots: selectedSlots,
              totalAmount: totalWithConvenience,
              addonsCost,
              selectedAddons,
              selectedService,
              discountAmount,                    // ← include
              convenienceFee,                    // ← include
              appliedDiscounts, 
            },
            {
              // Invalidate jamroom and booking caches when we create a booking
              invalidateCache: [
                CACHE_KEYS.JAM_ROOM_DETAILS(selectedRoomId),
                CACHE_KEYS.USER_BOOKINGS(userProfile?._id || ""),
                CACHE_KEYS.JAM_ROOM_BOOKINGS(selectedRoomId),
              ],
            }
          );

          if (verificationData.success) {
            // 5. Create the booking
            if (userProfile?._id) {
              const userId = userProfile._id;

              await apiClient.post(
                RESERVATION_CACHE_KEYS.CREATE_BOOKING,
                {
                  userId,
                  jamRoomId: selectedRoomId,
                  date: selectedDate,
                  slots: selectedSlots,
                  totalAmount: totalWithConvenience,  // send the net payable
                  discountAmount,                     // include discount line
                  convenienceFee,                     // include fee line
                  appliedDiscounts,                   // list of applied rules/coupons
                  service: selectedService,
                  paymentId: response.razorpay_payment_id,
                },
                {
                  // Invalidate user bookings cache
                  invalidateCache: [
                    CACHE_KEYS.USER_BOOKINGS(userId),
                    CACHE_KEYS.JAM_ROOM_BOOKINGS(selectedRoomId),
                  ],
                }
              );

              navigate(`/confirmation/${verificationData.invoiceId}`);
            } else {
              alert("User data not available");
            }
          } else {
            alert("Payment verification failed");
          }
        },
      };
      const rzp1 = new window.Razorpay(options);

      // Handle mobile back button while payment window is open
      const handleBackButton = (e) => {
        if (isPaymentInProgress) {
          e.preventDefault();
          rzp1.close();
          setIsPaymentInProgress(false);
          setIsLeaving(true);
          navigate(`/jam-room/${selectedRoomId}`);
        }
      };

      window.addEventListener("popstate", handleBackButton);

      rzp1.open();

      // Cleanup event listener when payment window closes
      return () => {
        window.removeEventListener("popstate", handleBackButton);
      };
    } catch (error) {
      setIsPaymentInProgress(false);
      console.error("Error creating order:", error);
    }
  };

  // Add this JSX right after the Review Your Booking Typography
  const renderExpiryWarning = () => {
    if (isExpired) {
      return (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Reservation Expired!</strong>
          <p className="text-sm">Redirecting you back to slot selection...</p>
        </div>
      );
    }

    if (timeRemaining) {
      const minutes = Math.floor(timeRemaining / 60);
      const seconds = timeRemaining % 60;
      return (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Reservation expires in: </strong>
          <span className="text-sm">
            {minutes}:{seconds.toString().padStart(2, "0")}
          </span>
        </div>
      );
    }
    return null;
  };

  // Disable payment button when expired
  const isPaymentDisabled = isExpired;

  return (
    <div
      className="min-h-screen bg-gray-50 pb-28"
      style={{
        backgroundColor: "#f8f6ff",
        backgroundImage: `radial-gradient(circle at 50% 0%, #e9e4ff 0%, #f8f6ff 70%)`,
      }}
    >
      <div className="max-w-md mx-auto p-4">
        {/* Back Button at top */}
        <div className="mb-4 flex items-center">
          <IconButton onClick={handleBack} edge="start" color="primary">
            <ChevronLeft />
          </IconButton>
          <Typography variant="h6" className="ml-2 font-semibold">
            Review Your Booking
          </Typography>
        </div>

        {renderExpiryWarning()}

        {/* Jam Room Details */}
        <Card className="mb-4 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-indigo-600 p-4 text-white">
            <Typography variant="h6" className="font-semibold">
              {jamRoomName}
            </Typography>
            <Typography variant="body2" className="opacity-90">
              {selectedDate}
            </Typography>
          </div>
          <CardContent className="p-4">
            <Typography variant="subtitle2" className="text-gray-600 mb-3">
              Selected Time Slots
            </Typography>
            <div className="space-y-2">
              {selectedSlots.map((slot, index) => (
                <div
                  key={index}
                  className="bg-gray-50 p-3 rounded-lg flex justify-between items-center"
                >
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
                    <Typography variant="body2">
                      {slot.startTime} - {slot.endTime}
                    </Typography>
                  </div>
                  <Typography
                    variant="body2"
                    className="text-gray-700 font-medium"
                  >
                    Slot {slot.slotId}
                  </Typography>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Add-ons Section */}
        {selectedAddons && selectedAddons.length > 0 && (
          <Card className="mb-4 rounded-xl shadow-sm">
            <CardContent className="p-4">
              <Typography variant="subtitle2" className="text-gray-600 mb-3">
                Selected Add-ons
              </Typography>
              <div className="space-y-2">
                {selectedAddons.map((addon, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                  >
                    <Typography variant="body2">
                      {addon.instrumentType.join(", ")}
                    </Typography>
                    <Typography variant="body2" className="font-medium">
                      ₹{addon.pricePerHour * addon.hours}
                    </Typography>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2">
                  <Typography variant="body2" className="font-medium">
                    Add-ons Total
                  </Typography>
                  <Typography variant="body2" className="font-medium">
                    ₹{addonsCost}
                  </Typography>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Studio Services Section */}
        {selectedService && selectedService.subPart && (
          <Card className="mb-4 rounded-xl shadow-sm">
            <CardContent className="p-4">
              <Typography variant="subtitle2" className="text-gray-600 mb-3">
                Selected Studio Service
              </Typography>
              <div className="space-y-2">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <Typography
                      variant="body2"
                      className="text-gray-700 font-medium"
                    >
                      {selectedService.name}
                    </Typography>
                  </div>
                  <div className="flex justify-between items-center">
                    <Typography variant="body2" className="text-gray-600">
                      {selectedService.subPart.name}
                    </Typography>
                    <Typography variant="body2" className="font-medium">
                      ₹{selectedService.subPart.price}
                    </Typography>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Coupons and Credits */}
        <Card className="mb-4 rounded-xl shadow-sm">
          <CardContent className="p-4">
            <Typography variant="subtitle2" className="text-gray-600 mb-2">
              Apply Coupons
            </Typography>
            <div className="flex gap-2 mb-3">
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Enter coupon code"
                className="flex-1 border rounded-md px-3 py-2 text-sm"
              />
              <Button variant="outlined" onClick={() => evaluateDiscounts()} size="small">
                Apply
              </Button>
            </div>

            {appliedDiscounts?.length > 0 ? (
              <div className="bg-green-50 p-3 rounded-lg text-sm">
                <div className="font-medium text-green-700 mb-1">Discounts Applied</div>
                <ul className="list-disc pl-5 text-green-700">
                  {appliedDiscounts.map((d) => (
                    <li key={d.id}>
                      {d.label} ({Math.round(d.percent * 100)}%)
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="bg-gray-50 p-3 rounded-lg text-center text-gray-500 text-sm">
                No discounts applied
              </div>
            )}

            <Typography variant="subtitle2" className="text-gray-600 mt-3 mb-2">
              Use Credits
            </Typography>
            <div className="bg-gray-50 p-3 rounded-lg text-center text-gray-500 text-sm">
              No credits available
            </div>
          </CardContent>
        </Card>

        {/* Pricing Summary */}
        <Card className="mb-6 rounded-xl shadow-sm">
          <CardContent className="p-4">
            {/* ...existing breakdown... */}
            <div className="flex justify-between items-center mb-2">
              <Typography variant="body2" className="text-gray-600">
                Jam Room Fee ({selectedSlots.length} slots)
              </Typography>
              <Typography variant="body2">
                ₹{totalAmount - addonsCost - (selectedService?.subPart?.price || 0)}
              </Typography>
            </div>
            {addonsCost > 0 && (
              <div className="flex justify-between items-center mb-2">
                <Typography variant="body2" className="text-gray-600">Add-on Instruments</Typography>
                <Typography variant="body2">₹{addonsCost}</Typography>
              </div>
            )}
            {selectedService?.subPart && (
              <div className="flex justify-between items-center mb-2">
                <Typography variant="body2" className="text-gray-600">
                  Studio Service ({selectedService.name})
                </Typography>
                <Typography variant="body2">₹{selectedService.subPart.price}</Typography>
              </div>
            )}

            {/* New: discounts and convenience fee */}
            {discountAmount > 0 && (
              <div className="flex justify-between items-center mb-2">
                <Typography variant="body2" className="text-gray-600">Discounts</Typography>
                <Typography variant="body2" className="text-green-700">-₹{discountAmount}</Typography>
              </div>
            )}
            <div className="flex justify-between items-center mb-2">
              <Typography variant="body2" className="text-gray-600">Convenience Fee (2.5%)</Typography>
              <Typography variant="body2">₹{convenienceFee}</Typography>
            </div>

            <Divider className="my-2" />

            <div className="flex justify-between items-center">
              <Typography variant="subtitle1" className="font-semibold">Total Payable</Typography>
              <Typography variant="h6" className="font-bold text-indigo-700">₹{totalWithConvenience}</Typography>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sticky Payment Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t p-4 z-10">
        <div className="max-w-md mx-auto">
          <Button
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            className="rounded-lg py-3"
            onClick={() => checkoutHandler(totalWithConvenience)}
            startIcon={<CreditCard className="w-5 h-5" />}
            disabled={isPaymentDisabled}
          >
            {isExpired ? "Reservation Expired" : "Proceed to Payment"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FinalReview;

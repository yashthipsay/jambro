import React, { useEffect, useState } from "react";
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

const FinalReview = () => {
  const [isLeaving, setIsLeaving] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    jamRoomName,
    selectedSlots,
    totalAmount,
    phoneNumber,
    selectedRoomId,
    selectedDate,
    addonsCost,
    selectedAddons,
  } = location.state;
  const { user } = useAuth0();
  console.log(user.sub);

  // Cleanup to release reservation when component unmounts if leaving
  useEffect(() => {
    return () => {
      if (isLeaving) {
        fetch("http://localhost:5000/api/reservations/release", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jamRoomId: selectedRoomId,
            date: selectedDate,
            slots: selectedSlots,
          }),
        });
      }
    };
  }, [isLeaving, selectedRoomId, selectedDate, selectedSlots]);

  // Warn user when they try to close or reload the page
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue =
        "Are you sure you want to leave? Your temporary reservation will be released.";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () =>
      window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Handle back navigation
  const handleBack = () => {
    const confirmLeave = window.confirm(
      "Are you sure you want to go back? Your temporary reservation will be released."
    );
    if (confirmLeave) {
      setIsLeaving(true);
      navigate(-1);
    }
  };

  const checkoutHandler = async (amount) => {
    try {
      const response = await fetch("http://localhost:5000/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await response.json();
      console.log(data);

      // Open Razorpay Checkout
      const options = {
        key: process.env.RAZORPAY_API_KEY,
        amount: data.order.amount * 100,
        currency: "INR",
        name: jamRoomName,
        description: "Jam Room Booking",
        order_id: data.order.id,
        callback_url: `http://localhost:3000/payment-success`,
        prefill: {
          name: user.name,
          email: user.email,
          contact: phoneNumber,
        },
        theme: { color: "#F37254" },
        handler: async (response) => {
          console.log(response);
          const verificationResponse = await fetch("http://localhost:5000/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              email: user.email,
              jamRoomId: selectedRoomId,
              date: selectedDate,
              slots: selectedSlots,
              totalAmount,
              addonsCost,
              selectedAddons,
            }),
          });

          const verificationData = await verificationResponse.json();
          console.log("Verification data:", verificationData);
          if (verificationData.success) {
            const userResponse = await fetch("http://localhost:5000/api/users", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: user.email }),
            });
            console.log("verificationData", verificationData);
            const userData = await userResponse.json();
            if (userData.success) {
              const userId = userData.data._id;
              console.log("selected date", selectedDate);
              await fetch("http://localhost:5000/api/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId,
                  jamRoomId: selectedRoomId,
                  date: selectedDate,
                  slots: selectedSlots,
                  totalAmount: totalAmount,
                  paymentId: response.razorpay_payment_id,
                }),
              });
              navigate(`/confirmation/${verificationData.invoiceId}`);
            } else {
              alert("Payment verification failed");
            }
          }
        },
      };
      const rzp1 = new window.Razorpay(options);
      rzp1.open();
    } catch (error) {
      console.error("Error creating order:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
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
                  <Typography variant="body2" className="text-gray-700 font-medium">
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

        {/* Coupons and Credits */}
        <Card className="mb-4 rounded-xl shadow-sm">
          <CardContent className="p-4">
            <Typography variant="subtitle2" className="text-gray-600 mb-2">
              Apply Coupons
            </Typography>
            <div className="bg-gray-50 p-3 rounded-lg mb-3 text-center text-gray-500 text-sm">
              No coupons available
            </div>
            <Typography variant="subtitle2" className="text-gray-600 mb-2">
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
            <div className="flex justify-between items-center mb-2">
              <Typography variant="body2" className="text-gray-600">
                Jam Room Fee ({selectedSlots.length} slots)
              </Typography>
              <Typography variant="body2">
                ₹{totalAmount - addonsCost}
              </Typography>
            </div>
            {addonsCost > 0 && (
              <div className="flex justify-between items-center mb-2">
                <Typography variant="body2" className="text-gray-600">
                  Add-on Instruments
                </Typography>
                <Typography variant="body2">₹{addonsCost}</Typography>
              </div>
            )}
            <Divider className="my-2" />
            <div className="flex justify-between items-center">
              <Typography variant="subtitle1" className="font-semibold">
                Total Amount
              </Typography>
              <Typography variant="h6" className="font-bold text-indigo-700">
                ₹{totalAmount}
              </Typography>
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
            onClick={() => checkoutHandler(totalAmount)}
            startIcon={<CreditCard className="w-5 h-5" />}
          >
            Proceed to Payment
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FinalReview;
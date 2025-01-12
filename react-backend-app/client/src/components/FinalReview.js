import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, Typography, Button, Grid2 } from '@mui/material';
import { useAuth0 } from '@auth0/auth0-react';

const FinalReview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { jamRoomName, selectedSlots, totalAmount, phoneNumber, selectedRoomId, selectedDate } = location.state;
  const { user } = useAuth0();
  console.log(user.sub);
  const checkoutHandler = async (amount) => {
    try {
      const response = await fetch('http://localhost:5000/api/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();
      console.log(data);

      // Open Razorpay Checkout
      const options = {
        key: process.env.RAZORPAY_API_KEY, // Replace with your Razorpay key_id
        amount: data.order.amount * 100, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        currency: 'INR',
        name: jamRoomName,
        description: 'Jam Room Booking',
        order_id: data.order.id, // This is the order_id created in the backend
        callback_url: `http://localhost:3000/payment-success`, // Your success URL
        prefill: {
          name: user.name,
          email: user.email,
            contact: phoneNumber,
        },
        theme: {
          color: '#F37254'
        },
        handler: async (response) => {
          console.log(response);
          const verificationResponse = await fetch('http://localhost:5000/api/payments/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              email: user.email,
              jamRoomId: selectedRoomId,
              date: selectedDate,
              slots: selectedSlots,
              totalAmount,
            }),
          });

          const verificationData = await verificationResponse.json();
          if (verificationData.success) {
            // Fetch user by email to get user ID
            const userResponse = await fetch('http://localhost:5000/api/users', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email: user.email }),
            });

            const userData = await userResponse.json();
            if (userData.success) {
              const userId = userData.data._id;

              // Store the booking
              await fetch('http://localhost:5000/api/bookings', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId,
                  jamRoomId: selectedRoomId,
                  date: selectedDate,
                  slots: selectedSlots,
                }),
              });

            navigate(`/confirmation/${verificationData.invoiceId}`);
          } else {
            alert('Payment verification failed');
          }
        }
      }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();

    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  return (
    <Grid2 container spacing={2} className="p-4">
      <Grid2 item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h4" gutterBottom>
              Review Your Booking
            </Typography>
            <Typography variant="h6">
              Jam Room: {jamRoomName}
            </Typography>
            <Typography variant="h6" className="mt-4">
              Total Amount: ₹{totalAmount}
            </Typography>
          </CardContent>
        </Card>
      </Grid2>

      <Grid2 item xs={12}>
        {selectedSlots.map((slot, index) => (
          <Card key={index} className="mt-2">
            <CardContent>
              <Typography variant="body1">
                Slot {slot.slotId}: {slot.startTime} - {slot.endTime}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Grid2>

      <Grid2 item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" className="mt-4">
              Apply Coupons
            </Typography>
            <Typography variant="h6" className="mt-4">
              Use Credits
            </Typography>
          </CardContent>
        </Card>
      </Grid2>

      <Grid2 item xs={12} className="flex justify-between">
        <Button
          variant="outlined"
          onClick={() => navigate(-1)}
        >
          Back
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => checkoutHandler(totalAmount)}
        >
          Proceed to Payment
        </Button>
      </Grid2>
    </Grid2>
  );
};

export default FinalReview;
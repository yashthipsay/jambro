import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { DatePicker } from '@mui/x-date-pickers';
import { Button, Card, CardContent, FormGroup, FormControlLabel, Checkbox, Grid2, TextField, Typography } from '@mui/material';
import io from 'socket.io-client';
import { useAuth0 } from '@auth0/auth0-react';

const socket = io('http://localhost:5000');

function Booking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth0();
  const selectedRoom = JSON.parse(localStorage.getItem('selectedJamRoom'));
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (selectedRoom) {
      socket.emit('getBookings', selectedRoom.id);
    }

    socket.on('bookings', (data) => {
      setBookings(data);
    });

    return () => {
      socket.off('bookings');
    };
  }, [selectedRoom]);

  if (!selectedRoom || selectedRoom.id !== id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1>No Jam Room selected.</h1>
        <button onClick={() => navigate('/')}>Go Back</button>
      </div>
    );
  }

  const isSlotBooked = (slotId) => {
    if (!selectedDate) return false;
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    return bookings.some(
      (booking) =>
        booking.date.split('T')[0] === selectedDateStr &&
        booking.slots.some((slot) => slot.slotId === slotId)
    );
  };


  const handleSlotChange = (slotId) => {
    setSelectedSlots((prev) =>
      prev.includes(slotId)
        ? prev.filter((id) => id !== slotId)
        : [...prev, slotId]
    );
  };

  const handleProceedToPayment = async () => {
    if (selectedSlots.length === 0 || !selectedDate) {
      alert('Please select a date and at least one time slot');
      return;
    }

    try{
      console.log(user.email);
      const response = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        
        body: JSON.stringify({ email: user.email }),
      });

      const data = await response.json();
      if (!data.success) {
        console.error('Error fetching user:', data.message);
        return;
      }

      const userId = data.data._id;

      const bookingResponse = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          jamRoomId: selectedRoom.id,
          date: selectedDate,
          slots: selectedSlots.map((slotId) => {
            const slot = selectedRoom.slots.find((s) => s.slotId === slotId);
            return {
              slotId: slot.slotId,
              startTime: slot.startTime,
              endTime: slot.endTime,
            };
          }),
        }),
      });

      const bookingData = await bookingResponse.json();
      if (!bookingData.success) {
        console.error('Error creating booking:', bookingData.message);
        return;
      }

      console.log('Booking successful:', bookingData);
      navigate(`/confirmation/${bookingData.booking._id}`);

    }catch(error) {
      console.error('Error proceeding to payment:', error);
    }
  };

  const totalAmount = selectedSlots.length * selectedRoom.feesPerSlot;

  return (
    <Grid2 container spacing={2} className="p-4">
      <Grid2 item xs={12}>
        <Card>
          <CardContent>
            <h1 className="text-2xl font-bold mb-4">{selectedRoom.name}</h1>
            <p className="mb-2">Distance: {selectedRoom.distance.toFixed(2)} km</p>
          </CardContent>
        </Card>
      </Grid2>

      <Grid2 item xs={12}>
        <Card>
          <CardContent>
            <h2 className="text-xl font-bold mb-4">Book Your Slot</h2>
            
            {/* Date Picker */}
            <div className="mb-4">
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Select Date"
                  value={selectedDate}
                  onChange={setSelectedDate}
                  minDate={new Date()} // Disable past dates
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </div>

            {/* Time Slots */}
            <FormGroup>
              {selectedRoom.slots.map((slot) => (
                <FormControlLabel
                  key={slot.slotId}
                  control={
                    <Checkbox
                      checked={selectedSlots.includes(slot.slotId)}
                      onChange={() => handleSlotChange(slot.slotId)}
                      disabled={isSlotBooked(slot.slotId)}
                    />
                  }
                  label={`${slot.startTime} - ${slot.endTime} (₹${selectedRoom.feesPerSlot})`}
                />
              ))}
            </FormGroup>

            {/* Total Amount */}
            <Typography variant="h6" className="mt-4">
              Total Amount: ₹{totalAmount}
            </Typography>

            {/* Action Buttons */}
            <div className="mt-4 flex justify-between">
              <Button
                variant="outlined"
                onClick={() => navigate(`/jam-room/${selectedRoom.id}`)}
              >
                Back to Details
              </Button>
              <Button
                variant="contained"
                color="primary"
                disabled={selectedSlots.length === 0 || !selectedDate}
                onClick={handleProceedToPayment}
              >
                Proceed to Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      </Grid2>
    </Grid2>
  );
}

export default Booking;

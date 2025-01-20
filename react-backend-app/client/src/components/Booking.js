import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { DatePicker } from '@mui/x-date-pickers';
import { Button, Card, CardContent, FormGroup, FormControlLabel, Checkbox, Grid2, TextField, Typography, Radio, RadioGroup, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import moment from 'moment-timezone';
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
  const [phoneNumber, setPhoneNumber] = useState('');
  const [savedNumbers, setSavedNumbers] = useState([]);
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState('');

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

  useEffect(() => {
    if (user) {
      fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
    socket.on('sessionStatusUpdate', (data) => {
      setBookings(prevBookings => 
        prevBookings.map(booking => {
          if (booking._id === data.bookingId) {
            const updatedSlots = booking.slots.map(slot => {
              if (slot.slotId === data.slotId) {
                return { ...slot, status: data.status };
              }
              return slot;
            });
            return { ...booking, slots: updatedSlots };
          }
          return booking;
        })
      );
    });
  
    return () => {
      socket.off('sessionStatusUpdate');
    };
  }, []);

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

  const hasSlotTimePassedToday = (slot) => {
    const currentDate = moment().tz('Asia/Kolkata').format('YYYY-MM-DD');
    const selectedDateStr = selectedDate ? moment(selectedDate).tz('Asia/Kolkata').format('YYYY-MM-DD') : null;
    if (currentDate !== selectedDateStr) return false;

    const currentTime = moment().tz('Asia/Kolkata');
    const slotTime = moment().tz('Asia/Kolkata').set({
      hour: parseInt(slot.startTime.split(':')[0]),
      minute: parseInt(slot.startTime.split(':')[1]),
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
      alert('Please enter a valid phone number');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/users/save-number', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email, phoneNumber }),
      });

      const data = await response.json();
      if (data.success) {
        setSavedNumbers(data.data.savedNumbers);
        setPhoneNumber('');
      } else {
        alert('Error saving phone number');
      }
    } catch (error) {
      console.error('Error saving phone number:', error);
    }
  };

  const handleDeleteNumber = async (number) => {
    try {
      const response = await fetch('http://localhost:5000/api/users/delete-number', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email, phoneNumber: number }),
      });

      const data = await response.json();
      if (data.success) {
        setSavedNumbers(data.data.savedNumbers);
        if (selectedPhoneNumber === number) {
          setSelectedPhoneNumber('');
        }
      } else {
        alert('Error deleting phone number');
      }
    } catch (error) {
      console.error('Error deleting phone number:', error);
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

  const handleProceedToReview = () => {
    if (selectedSlots.length === 0 || !selectedDate || !phoneNumber) {
      alert('Please select a date, at least one time slot, and enter a valid phone number');
      return;
    }

    const slotsDetails = selectedSlots.map((slotId) => {
      const slot = selectedRoom.slots.find((s) => s.slotId === slotId);
      return {
        slotId: slot.slotId,
        startTime: slot.startTime,
        endTime: slot.endTime,
      };
    });

    const totalAmount = selectedSlots.length * selectedRoom.feesPerSlot;

    navigate('/final-review', {
      state: {
        jamRoomName: selectedRoom.name,
        selectedSlots: slotsDetails,
        totalAmount,
        phoneNumber: selectedPhoneNumber,
        selectedRoomId: selectedRoom.id,
        selectedDate: moment(selectedDate).tz('Asia/Kolkata').format('YYYY-MM-DD'),
      },
    });
  };

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
                      disabled={isSlotBooked(slot.slotId) || hasSlotTimePassedToday(slot)}
                    />
                  }
                  label={`${slot.startTime} - ${slot.endTime} (₹${selectedRoom.feesPerSlot})`}
                />
              ))}
            </FormGroup>

            {/* Phone Number Input */}
            <div className="mt-4">
              <TextField
                label="Phone Number"
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                fullWidth
              />
              <Button variant="contained" color="primary" onClick={handleSaveNumber} className="mt-2">
                Save Number
              </Button>
            </div>

            {/* Saved Numbers */}
            <div className="mt-4">
              <Typography variant="h6">Saved Numbers:</Typography>
              <RadioGroup
                value={selectedPhoneNumber}
                onChange={handleSavedNumberChange}
              >
                {savedNumbers.map((number, index) => (
                  <div key={index} className="flex items-center">
                  <FormControlLabel
                    value={number}
                    control={<Radio />}
                    label={number}
                  />
                  <IconButton onClick={() => handleDeleteNumber(number)}>
                    <DeleteIcon />
                  </IconButton>
                </div>
                ))}
              </RadioGroup>
            </div>

            {/* Total Amount */}
            <Typography variant="h6" className="mt-4">
              Total Amount: ₹{selectedSlots.length * selectedRoom.feesPerSlot}
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
                disabled={selectedSlots.length === 0 || !selectedDate || !phoneNumber}
                onClick={handleProceedToReview}
              >
                Proceed to Review
              </Button>
            </div>
          </CardContent>
        </Card>
      </Grid2>
    </Grid2>
  );
}

export default Booking;
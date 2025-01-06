import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { DatePicker } from '@mui/x-date-pickers';
import { Button, Card, CardContent, FormGroup, FormControlLabel, Checkbox, Grid2, TextField } from '@mui/material';

function Booking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const selectedRoom = JSON.parse(localStorage.getItem('selectedJamRoom'));
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState([]);

  if (!selectedRoom || selectedRoom.id !== id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1>No Jam Room selected.</h1>
        <button onClick={() => navigate('/')}>Go Back</button>
      </div>
    );
  }

  const timeSlots = [
    { id: 1, time: "09:00 - 10:00" },
    { id: 2, time: "10:00 - 11:00" },
    { id: 3, time: "11:00 - 12:00" },
    { id: 4, time: "12:00 - 13:00" },
    { id: 5, time: "13:00 - 14:00" },
    { id: 6, time: "14:00 - 15:00" },
    { id: 7, time: "15:00 - 16:00" },
    { id: 8, time: "16:00 - 17:00" },
  ];

  const handleSlotChange = (slotId) => {
    setSelectedSlots((prev) =>
      prev.includes(slotId)
        ? prev.filter((id) => id !== slotId)
        : [...prev, slotId]
    );
  };

  const handleProceedToPayment = () => {
    if (selectedSlots.length === 0 || !selectedDate) {
      alert('Please select a date and at least one time slot');
      return;
    }
    console.log('Selected date:', selectedDate);
    console.log('Selected slots:', selectedSlots);
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
                      disabled={slot.isBooked}
                    />
                  }
                  label={`${slot.startTime} - ${slot.endTime}`}
                />
              ))}
            </FormGroup>

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

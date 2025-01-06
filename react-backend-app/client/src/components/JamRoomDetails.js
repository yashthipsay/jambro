import React from 'react';
import {Button, Card, CardContent, Grid2, Typography} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import  RouteMap  from './RouteMap';

function JamRoomDetails() {
  const navigate = useNavigate();
  const selectedRoom = JSON.parse(localStorage.getItem('selectedJamRoom'));
  console.log('Selected room on jam room details:', selectedRoom);
  if (!selectedRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1>No Jam Room selected.</h1>
        <button onClick={() => navigate('/')}>Go Back</button>
      </div>
    );
  }

  const userPosition = {
    lat: selectedRoom.userLatitude,
    lng: selectedRoom.userLongitude,
  };

  const roomPosition = {
    lat: selectedRoom.latitude,
    lng: selectedRoom.longitude,
  };

  return (
    <Grid2 container spacing={3} sx={{ padding: 6 }}>
      <Grid2 xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h4" gutterBottom>
              {selectedRoom.name}
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Distance: {selectedRoom.distance.toFixed(2)} km
            </Typography>
          </CardContent>
        </Card>
      </Grid2>

      <Grid2 xs={12}>
        <Card>
          <CardContent>
            <RouteMap userPosition={userPosition} roomPosition={roomPosition} />
          </CardContent>
        </Card>
      </Grid2>

      <Grid2 
        xs={12} 
        container 
        justifyContent="space-between" 
        alignItems="center"
      >
        <Button 
          variant="outlined" 
          onClick={() => navigate('/')}
        >
          Back to Finder
        </Button>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate(`/booking/${selectedRoom.id}`)}
        >
          Book Now
        </Button>
      </Grid2>
    </Grid2>
  );
}

export default JamRoomDetails;
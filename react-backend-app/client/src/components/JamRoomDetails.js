import React from 'react';
import { useNavigate } from 'react-router-dom';
import  RouteMap  from './RouteMap';

function JamRoomDetails() {
  const navigate = useNavigate();
  const selectedRoom = JSON.parse(localStorage.getItem('selectedJamRoom'));

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
    <>
      {/* <h1 className="text-3xl font-bold mb-4">{selectedRoom.name}</h1>
      <p>Latitude: {selectedRoom.latitude}</p>
      <p>Longitude: {selectedRoom.longitude}</p>
      <p>Radius: {selectedRoom.radius} meters</p>
      <p>Distance: {selectedRoom.distance.toFixed(2)} km</p>
      <button
        className="mt-4 p-2 bg-blue-500 text-white rounded"
        onClick={() => navigate('/')}
      >
        Back to Finder
      </button> */}

      <RouteMap userPosition={userPosition} roomPosition={roomPosition} />
    </>
  );
}

export default JamRoomDetails;
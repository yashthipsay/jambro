import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import Routing from './Routing';
import "leaflet/dist/leaflet.css";

function RouteMap({ userPosition, roomPosition }) {
  return (
    <MapContainer center={userPosition} zoom={13} style={{ height: '400px', width: '400px' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
      />
      <Routing userPosition={userPosition} roomPosition={roomPosition} />
    </MapContainer>
    // Create a section to the right of the map that has the following fields: 1) Calender to seelct date. 2) Hourly time slots, where you can check or uncheck them. 3) To proceed to payment only when atleast one slot is booked
  );
}

export default RouteMap;
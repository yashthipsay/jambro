import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import Routing from './Routing';
import "leaflet/dist/leaflet.css";

function RouteMap({ userPosition, roomPosition }) {
  return (
    <MapContainer center={userPosition} zoom={13} style={{ height: '800px', width: '800px' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
      />
      <Routing userPosition={userPosition} roomPosition={roomPosition} />
    </MapContainer>
  );
}

export default RouteMap;
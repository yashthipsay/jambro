import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet-routing-machine';
import { useMap } from 'react-leaflet';

function Routing({ userPosition, roomPosition }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(userPosition.lat, userPosition.lng),
        L.latLng(roomPosition.lat, roomPosition.lng),
      ],
      routeWhileDragging: true,
    }).addTo(map);

    return () => {
      if (map && routingControl) {
        map.removeControl(routingControl);
      }
    };
  }, [map, userPosition, roomPosition]);

  return null;
}

export default Routing;
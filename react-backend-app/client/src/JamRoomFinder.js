import React, { useState } from 'react';
import { Button, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import BackgroundIllustration from './components/BackgroundIllustration';
import { findClosestJamRooms } from './utils/jamRoomUtils';

function JamRoomFinder() {
  const [loading, setLoading] = useState(false);
  const [jamRooms, setJamRooms] = useState([]);
  const [userLatitude, setUserLatitude] = useState(null);
  const [userLongitude, setUserLongitude] = useState(null);
  const navigate = useNavigate();

  const handleFindJamRooms = async () => {
    setLoading(true);
    try {
      const { userLatitude: lat, userLongitude: lon, jamRooms: rooms } = await findClosestJamRooms();
      setUserLatitude(lat);
      setUserLongitude(lon);
      setJamRooms(rooms);
    } catch (error) {
      console.error('Error finding jam rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (room) => {
    const selectedRoom = {
      ...room,
      userLatitude,
      userLongitude,
    };
    localStorage.setItem('selectedJamRoom', JSON.stringify(selectedRoom));
    navigate(`/jam-room/${room.id}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative">
      <BackgroundIllustration />
      <Card className="w-full max-w-md z-10">
        <CardContent className="flex flex-col items-center p-6">
          <h1 className="text-2xl font-bold mb-4">Jam Room Finder</h1>
          <Button onClick={handleFindJamRooms} disabled={loading}>
            {loading ? 'Searching...' : 'Find Closest Jam Rooms'}
          </Button>
          {jamRooms.length > 0 && (
            <div className="mt-4">
              <h2 className="text-xl font-semibold mb-2">Closest Jam Rooms:</h2>
              <ul>
                {jamRooms.map((room) => (
                  <li
                    key={room.id}
                    className="mb-2 cursor-pointer"
                    onClick={() => handleCardClick(room)}
                  >
                    <Card>
                      <CardContent>
                        <strong>{room.name}</strong> - {room.distance.toFixed(2)} km away
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default JamRoomFinder;

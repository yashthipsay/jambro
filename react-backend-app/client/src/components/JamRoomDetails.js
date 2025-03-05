import { Button, Card, CardContent, Typography, Divider } from "@mui/material"
import { useNavigate } from "react-router-dom"
import { MapPin, Music, ArrowLeft, Calendar } from "lucide-react"

function JamRoomDetails() {
  const navigate = useNavigate()
  const selectedRoom = JSON.parse(localStorage.getItem("selectedJamRoom"))

  if (!selectedRoom) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-md text-center">
          <Music className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-4">No Jam Room selected</h1>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={() => navigate("/")}
            startIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Go Back to Finder
          </Button>
        </div>
      </div>
    )
  }

  const userPosition = {
    lat: selectedRoom.userLatitude,
    lng: selectedRoom.userLongitude,
  }

  const roomPosition = {
    lat: selectedRoom.location.latitude,
    lng: selectedRoom.location.longitude,
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="mb-4 flex items-center">
          <Button
            variant="text"
            color="primary"
            onClick={() => navigate("/")}
            startIcon={<ArrowLeft className="w-4 h-4" />}
            className="px-0"
          >
            Back
          </Button>
        </div>

        <Card className="mb-4 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-indigo-600 p-4 text-white">
            <Typography variant="h5" className="font-bold">
              {selectedRoom.name}
            </Typography>
          </div>
          <CardContent className="p-4">
            <div className="flex items-center mb-4">
              <MapPin className="w-5 h-5 text-indigo-500 mr-2" />
              <Typography variant="body2" color="textSecondary">
                {selectedRoom.distance.toFixed(2)} km from your location
              </Typography>
            </div>

            <Divider className="my-4" />

            <Typography variant="subtitle2" className="text-gray-600 mb-2">
              Facilities
            </Typography>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-gray-50 p-2 rounded-lg text-center">
                <Typography variant="body2">Air Conditioned</Typography>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg text-center">
                <Typography variant="body2">Sound Proof</Typography>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg text-center">
                <Typography variant="body2">Instruments</Typography>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg text-center">
                <Typography variant="body2">Parking</Typography>
              </div>
            </div>

            <Typography variant="subtitle2" className="text-gray-600 mb-2">
              Price
            </Typography>
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
              <div className="flex justify-between items-center">
                <Typography variant="body2">Per Slot</Typography>
                <Typography variant="body1" className="font-semibold">
                  ₹{selectedRoom.feesPerSlot || "500"}
                </Typography>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 rounded-xl shadow-sm">
          <CardContent className="p-4">
            <Typography variant="subtitle2" className="text-gray-600 mb-3">
              Location
            </Typography>
            <div className="flex flex-col items-center text-center">
              <MapPin className="w-10 h-10 text-indigo-500 mb-2" />
              <Typography variant="body2" className="mb-3">
                {selectedRoom.distance.toFixed(2)} km from your location
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                component="a"
                href={`https://www.google.com/maps/dir/?api=1&origin=${userPosition.lat},${userPosition.lng}&destination=${roomPosition.lat},${roomPosition.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                startIcon={<MapPin className="w-4 h-4" />}
              >
                Get Directions
              </Button>
            </div>
          </CardContent>
        </Card>

        <Button
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          className="rounded-lg py-3"
          onClick={() => navigate(`/booking/${selectedRoom.id}`)}
          startIcon={<Calendar className="w-5 h-5" />}
        >
          Book Now
        </Button>
      </div>
    </div>
  )
}

export default JamRoomDetails


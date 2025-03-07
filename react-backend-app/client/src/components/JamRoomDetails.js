import { useState, useEffect, useMemo } from "react";
import {
  Button,
  Card,
  CardContent,
  Typography,
  Divider,
  Collapse,
  IconButton,
  Modal,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Music,
  ArrowLeft,
  Calendar,
  Instagram,
  ChevronDown,
  ChevronUp,
  Info,
  Clock,
  X,
  Users,
  Disc,
} from "lucide-react";
import ShareButton from "./buttons/ShareButton";

function JamRoomDetails() {
  const navigate = useNavigate();
  const selectedRoom = JSON.parse(localStorage.getItem("selectedJamRoom"));
  const [expanded, setExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [artistAlbums, setArtistAlbums] = useState([]);
  // Add handleModalToggle function
  const handleModalToggle = () => setModalOpen(!modalOpen);

  // Using useMemo to fetch artist albums when selectedRoom changes
  useMemo(() => {
    const fetchArtistAlbums = async (artistId) => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/spotify/artist-albums/${artistId}`
        );
        const data = await response.json();
        if (data.success) {
          setArtistAlbums(data.albums?.slice(0, 3) || []);
        }
      } catch (error) {
        console.error("Error fetching albums:", error);
      }
    };

    if (selectedRoom?.ownerDetails?.spotify?.username) {
      fetchArtistAlbums(selectedRoom.ownerDetails.spotify.username);
    }
  }, [selectedRoom]);

  if (!selectedRoom) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-md text-center">
          <Music className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-4">
            No Jam Room selected
          </h1>
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
    );
  }

  const userPosition = {
    lat: selectedRoom.userLatitude,
    lng: selectedRoom.userLongitude,
  };

  const roomPosition = {
    lat: selectedRoom.location.latitude,
    lng: selectedRoom.location.longitude,
  };

  const hasSpotifyProfile = selectedRoom.ownerDetails?.spotify?.isVerified;
  const hasInstagramProfile = selectedRoom.socialMedia?.instagram;

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
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

            {/* Image Carousel */}
            {selectedRoom.images && selectedRoom.images.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="col-span-2">
                  <img
                    src={selectedRoom.images[0]}
                    alt={`${selectedRoom.name} - Main`}
                    className="w-full h-48 object-cover rounded-lg cursor-pointer"
                    onClick={handleModalToggle}
                  />
                </div>

                {selectedRoom.images.slice(1, 3).map((image, index) => (
                  <div key={index} className="relative h-24">
                    <img
                      src={image}
                      alt={`${selectedRoom.name} - ${index + 2}`}
                      className="w-full h-full object-cover rounded-lg cursor-pointer"
                      onClick={handleModalToggle}
                    />
                  </div>
                ))}

                {selectedRoom.images.length > 3 && (
                  <div
                    className="relative h-24 cursor-pointer"
                    onClick={handleModalToggle}
                  >
                    <img
                      src={selectedRoom.images[3]}
                      alt={`${selectedRoom.name} - 4`}
                      className="w-full h-full object-cover rounded-lg filter brightness-50"
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-white font-medium">
                      +{selectedRoom.images.length - 3} more
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Add Image Gallery Modal */}
            <Modal
              open={modalOpen}
              onClose={handleModalToggle}
              className="flex items-center justify-center"
            >
              <div className="bg-white w-full max-w-3xl mx-4 rounded-xl overflow-hidden relative">
                <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
                  <Typography variant="h6">All Photos</Typography>
                  <IconButton onClick={handleModalToggle} size="small">
                    <X className="w-5 h-5" />
                  </IconButton>
                </div>

                <div className="p-4 max-h-[80vh] overflow-y-auto">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedRoom.images?.map((image, index) => (
                      <div key={index} className="aspect-square">
                        <img
                          src={image}
                          alt={`${selectedRoom.name} - ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Modal>

            <Divider className="my-4" />

            {/* Description */}
            <Typography variant="body2" className="mb-4 text-gray-700">
              {selectedRoom.description ||
                "A cozy jam room perfect for your music sessions."}
            </Typography>

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

            {/* Additional details dropdown */}
            <div className="bg-gray-50 rounded-lg overflow-hidden mb-4">
              <div
                className="flex justify-between items-center p-3 cursor-pointer"
                onClick={() => setExpanded(!expanded)}
              >
                <div className="flex items-center">
                  <Info className="w-4 h-4 text-indigo-500 mr-2" />
                  <Typography variant="subtitle2">
                    Additional Details
                  </Typography>
                </div>
                <IconButton size="small">
                  {expanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </IconButton>
              </div>

              <Collapse in={expanded}>
                <div className="px-3 pb-3 space-y-3">
                  {/* Opening Hours */}
                  <div>
                    <Typography
                      variant="body2"
                      className="text-gray-500 font-medium flex items-center"
                    >
                      <Clock className="w-4 h-4 mr-1" /> Opening Hours
                    </Typography>
                    <Typography variant="body2" className="mt-1">
                      {selectedRoom.openingHours || "9:00 AM - 10:00 PM"}
                    </Typography>
                  </div>

                  {/* Social Media */}
                  {selectedRoom.socialMedia?.instagram && (
                    <div>
                      <Typography
                        variant="body2"
                        className="text-gray-500 font-medium flex items-center"
                      >
                        <Instagram className="w-4 h-4 mr-1" /> Instagram
                      </Typography>
                      <a
                        href={`https://instagram.com/${selectedRoom.socialMedia.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 flex items-center text-indigo-600"
                      >
                        @{selectedRoom.socialMedia.instagram}
                      </a>
                    </div>
                  )}

                  {/* Owner Information */}
                  <div>
                    <Typography
                      variant="body2"
                      className="text-gray-500 font-medium"
                    >
                      Owner
                    </Typography>
                    <Typography variant="body2" className="mt-1">
                      {selectedRoom.ownerDetails.fullname ||
                        "Music Studio Inc."}
                    </Typography>
                  </div>

                  {/* Owner's Spotify Profile */}
                  {hasSpotifyProfile && (
                    <div className="mt-4">
                      <Typography
                        variant="body2"
                        className="text-gray-500 font-medium flex items-center"
                      >
                        <svg
                          className="w-4 h-4 mr-1 text-[#1DB954]"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                        </svg>
                        Spotify Artist
                      </Typography>

                      <div className="mt-2 bg-black/5 rounded-lg p-3">
                        <div className="flex items-center space-x-3">
                          {selectedRoom.ownerDetails.spotify.images?.[0]
                            ?.url ? (
                            <img
                              src={
                                selectedRoom.ownerDetails.spotify.images[0].url
                              }
                              alt="Artist"
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                              <Music className="w-6 h-6 text-indigo-500" />
                            </div>
                          )}
                          <div>
                            <Typography variant="body2" className="font-medium">
                              <a
                                href={
                                  selectedRoom.ownerDetails.spotify.profileUrl
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-800 transition-colors"
                              >
                                {selectedRoom.ownerDetails.spotify.displayName}
                              </a>
                            </Typography>
                            <div className="flex items-center text-gray-500 text-xs">
                              <Users className="w-3 h-3 mr-1" />
                              {selectedRoom.ownerDetails.spotify.followers.toLocaleString()}{" "}
                              followers
                            </div>
                          </div>
                        </div>

                        {/* Artist Albums */}
                        {artistAlbums.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <Typography
                              variant="body2"
                              className="text-gray-500 text-xs"
                            >
                              Popular Albums
                            </Typography>
                            <div className="flex space-x-3 overflow-x-auto scrollbar-hide pb-3 -mx-3 px-3">
                              {artistAlbums.map((album) => (
                                <a
                                  key={album.id}
                                  href={album.external_urls.spotify}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block flex-shrink-0 hover:opacity-80 transition-opacity"
                                >
                                  <div className="w-20 h-20 rounded shadow-sm">
                                    {album.images?.[0]?.url ? (
                                      <img
                                        src={album.images[0].url}
                                        alt={album.name}
                                        className="w-full h-full object-cover rounded"
                                        loading="lazy"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-indigo-100 rounded flex items-center justify-center">
                                        <Disc className="w-8 h-8 text-indigo-500" />
                                      </div>
                                    )}
                                  </div>
                                  <Typography
                                    variant="caption"
                                    className="block text-center truncate mt-1 w-20"
                                  >
                                    {album.name}
                                  </Typography>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Amenities as tags */}
                  {selectedRoom.amenities &&
                    selectedRoom.amenities.length > 0 && (
                      <div>
                        <Typography
                          variant="body2"
                          className="text-gray-500 font-medium"
                        >
                          Amenities
                        </Typography>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedRoom.amenities.map((amenity, index) => (
                            <div
                              key={index}
                              className="bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-full"
                            >
                              {amenity}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </Collapse>
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

        {/* Fixed action buttons at bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t p-4 z-10">
          <div className="max-w-md mx-auto flex flex-col gap-3">
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

            <ShareButton
              title={`Check out ${selectedRoom.name}`}
              text={`I found this amazing jam room: ${
                selectedRoom.name
              }. It's only ${selectedRoom.distance.toFixed(2)} km away!`}
              url={window.location.href}
              image={
                selectedRoom.images && selectedRoom.images.length > 0
                  ? selectedRoom.images[0]
                  : ""
              }
              variant="outlined"
              color="primary"
              fullWidth
              className="rounded-lg"
            >
              Share
            </ShareButton>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JamRoomDetails;

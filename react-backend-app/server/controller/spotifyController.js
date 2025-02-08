const SpotifyWebApi = require('spotify-web-api-node');
const JamRoom = require('../models/JamRooms');

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

const initiateSpotifyVerification = async (req, res) => {
  try {
    const { jamRoomId, spotifyUsername } = req.body;
    const jamRoom = await JamRoom.findById(jamRoomId);

    if (!jamRoom) {
      return res.status(404).json({
        success: false,
        message: 'Jam room not found'
      });
    }

    // Get Spotify access token
    const credentials = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(credentials.body.access_token);

    // Try to fetch the artist profile using getUser instead of getArtist
    const artistProfile = await spotifyApi.getArtist(spotifyUsername)
      .catch(err => {
        throw new Error('Invalid Spotify username');
      });


      console.log(`Spotify user profile:`, artistProfile.body);

    // Update jamroom with verified spotify details
    jamRoom.ownerDetails.spotify = {
      username: spotifyUsername,
      displayName: artistProfile.body.name,
      profileUrl: artistProfile.body.external_urls.spotify,
      followers: artistProfile.body.followers.total,
      images: artistProfile.body.images,
      isVerified: true,
      verifiedAt: new Date()
    };

    await jamRoom.save();

    res.status(200).json({
      success: true,
      message: 'Spotify profile verified successfully',
      profile: {
        username: spotifyUsername,
        displayName: artistProfile.body.name,
        profileUrl: artistProfile.body.external_urls.spotify,
        followers: artistProfile.body.followers.total,
        images: artistProfile.body.images
      }
    });

  } catch (error) {
    console.error('Spotify verification error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to verify Spotify profile'
    });
  }
};

const getArtistAlbums = async (req, res) => {
  try{
    const {artistId} = req.params;

    const credentials = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(credentials.body.access_token);

    const albums = await spotifyApi.getArtistAlbums(artistId, { limit: 12 });

    res.json({
      success: true,
      albums: albums.body.items
    });
  }catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}

module.exports = {
  initiateSpotifyVerification,
  getArtistAlbums
};
const express = require('express');
const router = express.Router();
const { initiateSpotifyVerification, getArtistAlbums } = require('../controller/spotifyController');

router.post('/verify/initiate', initiateSpotifyVerification);
router.get('/artist-albums/:artistId', getArtistAlbums);

module.exports = router;
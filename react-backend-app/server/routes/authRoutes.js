const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const JamRoom = require('../models/JamRooms');
const { verifyToken, generateToken } = require('../middleware/auth');

router.get('/verify', verifyToken, (req, res) => {
  console.log(req.body)
  res.json({
    success: true,
    jamRoomId: req.user.jamRoomId,
    isRegistered: req.user.isRegistered,
    fundAccountId: req.user.fundAccountId // Add this line
  });
});

router.post('/check-registration', async (req, res) => {
  try {
    const { email } = req.body;
    const jamRoom = await JamRoom.findOne({ 'ownerDetails.email': email });

    if (!jamRoom) {
      return res.status(200).json({
        success: false,
        isRegistered: false
      });
    }

    // Generate new token for registered user
    const token = generateToken({ email }, jamRoom);

    res.status(200).json({
      success: true,
      isRegistered: true,
      token,
      jamRoomId: jamRoom._id,
      fundAccountId: jamRoom.bankValidationData?.fund_account?.id
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
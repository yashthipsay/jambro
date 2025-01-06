const express = require('express');
const router = express.Router();
const {createJamRoom, getAllJamRooms} = require('../controller/jamRoomController');

router.post('/create', createJamRoom);
router.get('/', getAllJamRooms);

module.exports = router;
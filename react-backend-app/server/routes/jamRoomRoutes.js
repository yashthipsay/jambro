const express = require('express');
const router = express.Router();
const {createJamRoom, getAllJamRooms, updateJamRoom} = require('../controller/jamRoomController');

router.post('/create', createJamRoom);
router.get('/', getAllJamRooms);
router.put('/:id', updateJamRoom);

module.exports = router;
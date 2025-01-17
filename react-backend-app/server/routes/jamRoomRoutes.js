const express = require('express');
const router = express.Router();
const {createJamRoom, getAllJamRooms, updateJamRoom, isJamRoomRegisteredByEmail} = require('../controller/jamRoomController');

router.post('/create', createJamRoom);
router.get('/', getAllJamRooms);
router.put('/:id', updateJamRoom);
router.post('/is-registered', isJamRoomRegisteredByEmail);

module.exports = router;
const express = require('express');
const router = express.Router();
const {createJamRoom, getAllJamRooms, updateJamRoom, isJamRoomRegisteredByEmail, getJamRoomNameById, getJamRoomByEmail} = require('../controller/jamRoomController');

router.post('/create', createJamRoom);
router.get('/', getAllJamRooms);
router.put('/:id', updateJamRoom);
router.post('/is-registered', isJamRoomRegisteredByEmail);
router.get('/:id', getJamRoomNameById);
router.get('/email/:email', getJamRoomByEmail);

module.exports = router;
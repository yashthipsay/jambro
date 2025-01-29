const express = require('express');
const router = express.Router();
const {createJamRoom, getAllJamRooms, updateJamRoom, isJamRoomRegisteredByEmail, getJamRoomNameById, getJamRoomByEmail, getJamRoomById, uploadJamRoomImages, updateAddons, deleteAddon} = require('../controller/jamRoomController');

router.post('/create', createJamRoom);
router.get('/', getAllJamRooms);
router.put('/:id', updateJamRoom);
router.post('/is-registered', isJamRoomRegisteredByEmail);
router.get('/:id', getJamRoomNameById);
router.route('/id/:id')
  .get(getJamRoomById)
  .put(getJamRoomById);
router.put('/:id/addons', updateAddons);
router.delete('/:id/addons/:addonId', deleteAddon);
router.get('/email/:email', getJamRoomByEmail);
router.put('/:id/images', uploadJamRoomImages); // New route for image uploads

module.exports = router;
const express = require('express');
const router = express.Router();
const {createJamRoom, getAllJamRooms, updateJamRoom, getJamRoomNameById, getJamRoomByEmail, getJamRoomById, uploadJamRoomImages, updateAddons, getAddon, deleteAddon} = require('../controller/jamRoomController');
const { verifyToken } = require('../middleware/auth');

router.post('/create', createJamRoom);
router.get('/', getAllJamRooms);
router.put('/:id', updateJamRoom);
router.get('/:id', getJamRoomNameById);
router.route('/id/:id')
  .get(getJamRoomById)
  .put(getJamRoomById);
router.put('/:id/addons', verifyToken, updateAddons);
router.get('/:id/addons', getAddon);
router.delete('/:id/addons/:addonId', deleteAddon);
router.get('/email/:email', getJamRoomByEmail);
router.put('/:id/images', uploadJamRoomImages); // New route for image uploads

module.exports = router;
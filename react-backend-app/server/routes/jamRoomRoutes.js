const express = require("express");
const router = express.Router();
const {
  createJamRoom,
  getAllJamRooms,
  updateJamRoom,
  getJamRoomNameById,
  getJamRoomByEmail,
  getJamRoomById,
  uploadJamRoomImages,
  updateAddons,
  getAddon,
  deleteAddon,
  addStudioService,
  getStudioServices,
  deleteStudioService,
  updateStudioService,
  updateOneSignal,
} = require("../controller/jamRoomController");
const { verifyToken } = require("../middleware/auth");

router.post("/create", createJamRoom);
router.get("/", getAllJamRooms);
router.put("/:id", updateJamRoom);
router.get("/:id", getJamRoomNameById);
router.route("/id/:id").get(getJamRoomById).put(getJamRoomById);
router.put("/:id/addons", verifyToken, updateAddons);
router.get("/:id/addons", getAddon);
router.delete("/:id/addons/:addonId", deleteAddon);
router.get("/email/:email", getJamRoomByEmail);
router.route("/images").post(uploadJamRoomImages).put(uploadJamRoomImages); // New route for image uploads

// Route to get all studio services for a jam room
router.get("/:jamRoomId/services", getStudioServices);

// Route to add a new studio service
router.post("/:jamRoomId/services", addStudioService);

// Route to update an existing studio service
router.put("/:jamRoomId/services/:serviceId", updateStudioService);

// Route to delete a studio service
router.delete("/:jamRoomId/services/:serviceId", deleteStudioService);

router.post("/update-onesignal", updateOneSignal);

module.exports = router;

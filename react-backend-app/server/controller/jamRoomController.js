const JamRoom = require("../models/JamRooms");
const path = require("path");
const multer = require("multer");
const Aws = require("aws-sdk");
const { generateToken } = require("../middleware/auth");

// Configure AWS S3
const s3 = new Aws.S3({
  region: "eu-north-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const createJamRoom = async (req, res) => {
  try {
    const {
      type,
      jamRoomDetails,
      ownerDetails,
      location,
      images,
      bankDetails,
      slots,
      feesPerSlot,
      bankValidationData,
    } = req.body;

    // Validate required fields
    if (
      !type ||
      !jamRoomDetails ||
      !jamRoomDetails.name ||
      !jamRoomDetails.description ||
      !ownerDetails ||
      !ownerDetails.fullname ||
      !ownerDetails.email ||
      !ownerDetails.phone ||
      !location ||
      !location.address ||
      !location.latitude ||
      !location.longitude ||
      !images ||
      !images.length ||
      !feesPerSlot
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Check if the jam room is already registered by owner's email
    const existingJamRoom = await JamRoom.findOne({
      "ownerDetails.email": ownerDetails.email,
    });
    if (existingJamRoom) {
      return res.status(409).json({
        success: false,
        message: "Jam room already registered",
      });
    }

    // Create default slots if not provided
    const defaultSlots = slots || [
      { slotId: 1, startTime: "09:00", endTime: "10:00" },
      { slotId: 2, startTime: "10:00", endTime: "11:00" },
      { slotId: 3, startTime: "11:00", endTime: "12:00" },
      { slotId: 4, startTime: "12:00", endTime: "13:00" },
      { slotId: 5, startTime: "13:00", endTime: "14:00" },
      { slotId: 6, startTime: "14:00", endTime: "15:00" },
      { slotId: 7, startTime: "15:00", endTime: "16:00" },
      { slotId: 8, startTime: "16:00", endTime: "17:00" },
    ];

    // Create new jam room
    const jamRoom = new JamRoom({
      type,
      jamRoomDetails,
      ownerDetails,
      location,
      images,
      bankDetails,
      slots: defaultSlots,
      feesPerSlot,
      bankValidationData,
    });

    // Save to database
    await jamRoom.save();

    // Generate token after successful registration
    const token = generateToken({ email: ownerDetails.email }, jamRoom);

    // Return success response
    res.status(201).json({
      success: true,
      data: jamRoom,
      token: token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllJamRooms = async (req, res) => {
  try {
    const jamRooms = await JamRoom.find({});

    if (!jamRooms.length) {
      return res.status(404).json({
        success: false,
        message: "No jam rooms found",
      });
    }

    res.status(200).json({
      success: true,
      data: jamRooms,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Jam rooms
const updateJamRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, slots, feesPerSlot } = req.body;

    // Validate required fields
    if (!name && !location && !slots && !feesPerSlot) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    // Find and update the jam room
    const updatedJamRoom = await JamRoom.findByIdAndUpdate(
      id,
      { name, location, slots, feesPerSlot },
      { new: true, runValidators: true }
    );

    if (!updatedJamRoom) {
      return res.status(404).json({
        success: false,
        message: "Jam room not found",
      });
    }

    res.status(200).json({
      success: true,
      data: updatedJamRoom,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get jam room name by ID
const getJamRoomNameById = async (req, res) => {
  try {
    const { id } = req.params;

    const jamRoom = await JamRoom.findById(id).select("jamRoomDetails.name");

    if (!jamRoom) {
      return res.status(404).json({
        success: false,
        message: "Jam room not found",
      });
    }

    res.status(200).json({
      success: true,
      name: jamRoom.jamRoomDetails.name,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get jam room by email
const getJamRoomByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    const jamRoom = await JamRoom.findOne({ "ownerDetails.email": email });

    if (!jamRoom) {
      return res.status(404).json({
        success: false,
        message: "Jam room not found for this email",
      });
    }

    res.status(200).json({
      success: true,
      data: jamRoom,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getJamRoomById = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.method === "PUT") {
      // Handle PUT request
      const updateData = req.body;

      // Validate if jam room exists
      let jamRoom = await JamRoom.findById(id);
      if (!jamRoom) {
        return res.status(404).json({
          success: false,
          message: "Jam room not found",
        });
      }

      // Update all fields provided in updateData
      Object.keys(updateData).forEach((key) => {
        jamRoom[key] = updateData[key];
      });

      // Save the updated jam room
      const updatedJamRoom = await jamRoom.save();

      return res.status(200).json({
        success: true,
        data: updatedJamRoom,
      });
    } else {
      // Handle GET request
      const jamRoom = await JamRoom.findById(id);

      if (!jamRoom) {
        return res.status(404).json({
          success: false,
          message: "Jam room not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: jamRoom,
      });
    }
  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 20MB limit
    files: 10, // Maximum number of files
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
}).array("images"); // Use 'images' consistently here

const uploadJamRoomImages = async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  try {
    const { files } = req.body; // Expected array of file metadata (name, type)

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files metadata provided",
      });
    }
    // Generate presigned URLs for each file
    const presignedData = await Promise.all(
      files.map(async (file) => {
        const key = `jamrooms/${Date.now()}-${file.name}`;
        const params = {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: key,
          ContentType: file.type,
          ACL: "public-read",
          Expires: 600, // URL expires in 10 minutes
        };

        const uploadUrl = await s3.getSignedUrlPromise("putObject", params);
        const finalUrl = `https://${process.env.S3_BUCKET_NAME}.s3.eu-north-1.amazonaws.com/${key}`;

        return {
          uploadUrl,
          finalUrl,
          key,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: presignedData,
    });
  } catch (error) {
    console.error("Error generating presigned URLs:", error);
    res.status(500).json({
      success: false,
      message: "Error generating upload URLs",
      error: error.message,
    });
  }
};

// Add or update addons
const updateAddons = async (req, res) => {
  try {
    const { id } = req.params;
    const { addons } = req.body;

    const jamRoom = await JamRoom.findById(id);
    if (!jamRoom) {
      return res.status(404).json({
        success: false,
        message: "Jam room not found",
      });
    }

    // Initialize addons array if it doesn't exist
    if (!jamRoom.addons) {
      jamRoom.addons = [];
    }

    jamRoom.addons = addons;
    await jamRoom.save();

    res.status(200).json({
      success: true,
      data: jamRoom.addons,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAddon = async (req, res) => {
  try {
    const { id } = req.params;

    const jamRoom = await JamRoom.findById(id);

    if (!jamRoom) {
      return res.status(404).json({
        success: false,
        message: "Jam room not found",
      });
    }

    // Handle case when addons array doesn't exist
    const addons = jamRoom.addons || [];

    res.status(200).json({
      success: true,
      data: addons,
    });
  } catch (error) {
    console.error("Error fetching addons:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete an addon
const deleteAddon = async (req, res) => {
  try {
    const { id, addonId } = req.params;

    const jamRoom = await JamRoom.findById(id);
    if (!jamRoom) {
      return res.status(404).json({
        success: false,
        message: "Jam room not found",
      });
    }

    jamRoom.addons = jamRoom.addons.filter(
      (addon) => addon._id.toString() !== addonId
    );
    await jamRoom.save();

    res.status(200).json({
      success: true,
      data: jamRoom.addons,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const addStudioService = async (req, res) => {
  try {
    const { jamRoomId } = req.params;
    const { serviceName, description, category, subParts } = req.body;

    // Validate required fields
    if (!serviceName || !category || !subParts || !subParts.length) {
      return res.status(400).json({
        success: false,
        message:
          "Service name, category and at least one sub-part are required",
      });
    }

    const jamRoom = await JamRoom.findById(jamRoomId);
    if (!jamRoom) {
      return res.status(404).json({
        success: false,
        message: "Jam room not found",
      });
    }

    // Validate sub-parts
    for (const subPart of subParts) {
      if (!subPart.name || !subPart.price) {
        return res.status(400).json({
          success: false,
          message: "Each sub-part must have a name and price",
        });
      }
    }

    // Create new service with sub-parts
    const newService = {
      serviceName,
      description,
      category,
      subParts,
    };

    // Initialize studioServices array if it doesn't exist
    if (!jamRoom.studioServices) {
      jamRoom.studioServices = [];
    }

    jamRoom.studioServices.push(newService);
    await jamRoom.save();

    res.status(201).json({
      success: true,
      data: jamRoom.studioServices,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update existing service and its sub-parts
const updateStudioService = async (req, res) => {
  try {
    const { jamRoomId, serviceId } = req.params;
    const { serviceName, description, category, subParts } = req.body;

    const jamRoom = await JamRoom.findById(jamRoomId);
    if (!jamRoom) {
      return res.status(404).json({
        success: false,
        message: "Jam room not found",
      });
    }

    const serviceIndex = jamRoom.studioServices.findIndex(
      (service) => service._id.toString() === serviceId
    );

    if (serviceIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    // Update service with new data
    jamRoom.studioServices[serviceIndex] = {
      ...jamRoom.studioServices[serviceIndex],
      serviceName:
        serviceName || jamRoom.studioServices[serviceIndex].serviceName,
      description:
        description || jamRoom.studioServices[serviceIndex].description,
      category: category || jamRoom.studioServices[serviceIndex].category,
      subParts: subParts || jamRoom.studioServices[serviceIndex].subParts,
    };

    await jamRoom.save();

    res.status(200).json({
      success: true,
      data: jamRoom.studioServices[serviceIndex],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete a service (including all its sub-parts)
const deleteStudioService = async (req, res) => {
  try {
    const { jamRoomId, serviceId } = req.params;

    const jamRoom = await JamRoom.findById(jamRoomId);
    if (!jamRoom) {
      return res.status(404).json({
        success: false,
        message: "Jam room not found",
      });
    }

    jamRoom.studioServices = jamRoom.studioServices.filter(
      (service) => service._id.toString() !== serviceId
    );

    await jamRoom.save();

    res.status(200).json({
      success: true,
      data: jamRoom.studioServices,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all services for a jam room
const getStudioServices = async (req, res) => {
  try {
    const { jamRoomId } = req.params;

    const jamRoom = await JamRoom.findById(jamRoomId);
    if (!jamRoom) {
      return res.status(404).json({
        success: false,
        message: "Jam room not found",
      });
    }

    res.status(200).json({
      success: true,
      data: jamRoom.studioServices || [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateOneSignal = async (req, res) => {
  try {
    const { email, jamRoomId, oneSignalUserId } = req.body;

    const jamRoom = await JamRoom.findById(jamRoomId);
    if (!jamRoom) {
      return res
        .status(404)
        .json({ success: false, message: "Jam room not found" });
    }

    jamRoom.ownerDetails.oneSignalUserId = oneSignalUserId;
    await jamRoom.save();

    res.json({ success: true, message: "OneSignal ID updated successfully" });
  } catch (error) {
    console.error("Error updating OneSignal ID:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  createJamRoom,
  getAllJamRooms,
  updateJamRoom,
  getJamRoomNameById,
  getJamRoomByEmail,
  getJamRoomById,
  uploadJamRoomImages,
  updateAddons,
  deleteAddon,
  getAddon,
  addStudioService,
  updateStudioService,
  deleteStudioService,
  getStudioServices,
  updateOneSignal,
};

const JamRoom = require("../models/JamRooms");
const path = require("path");
const multer = require("multer");
const Aws = require("aws-sdk");
const { generateToken } = require("../middleware/auth");

// Configure AWS S3
const s3 = new Aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const createJamRoom = async (req, res) => {
  try {
    const {
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
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Maximum number of files
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
}).array('images'); // Use 'images' consistently here

const uploadJamRoomImages = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          message: 'File upload error',
          error: err.message
        });
      } else if (err) {
        return res.status(500).json({
          success: false,
          message: 'Server error',
          error: err.message
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No images provided'
        });
      }

      try {
        const imageUrls = await Promise.all(req.files.map(async (file) => {
          const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: `jamrooms/${Date.now()}-${file.originalname}`,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read'
          };

          const uploadResult = await s3.upload(params).promise();
          return uploadResult.Location;
        }));

        res.status(200).json({
          success: true,
          imageUrls
        });
      } catch (uploadError) {
        console.error('S3 upload error:', uploadError);
        res.status(500).json({
          success: false,
          message: 'Error uploading to S3',
          error: uploadError.message
        });
      }
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
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
};

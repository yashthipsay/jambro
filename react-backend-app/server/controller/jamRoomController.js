const JamRoom = require('../models/JamRooms');

const createJamRoom = async (req, res) => {
  try {
    const {       jamRoomDetails,
      ownerDetails,
      location,
      images,
      bankDetails,
      slots,
      feesPerSlot,
      bankValidationData
     } = req.body;

    // Validate required fields
    if (!jamRoomDetails || !jamRoomDetails.name || !jamRoomDetails.description ||
      !ownerDetails || !ownerDetails.fullname || !ownerDetails.email || !ownerDetails.phone ||
      !location || !location.address || !location.latitude || !location.longitude ||
      !images || !images.length ||
      !feesPerSlot) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

        // Check if the jam room is already registered by owner's email
        const existingJamRoom = await JamRoom.findOne({ 'ownerDetails.email': ownerDetails.email });
        if (existingJamRoom) {
          return res.status(409).json({
            success: false,
            message: 'Jam room already registered'
          });
        }

    // Create default slots if not provided
    const defaultSlots = slots || [
      { slotId: 1, startTime: '09:00', endTime: '10:00' },
      { slotId: 2, startTime: '10:00', endTime: '11:00' },
      { slotId: 3, startTime: '11:00', endTime: '12:00' },
      { slotId: 4, startTime: '12:00', endTime: '13:00' },
      { slotId: 5, startTime: '13:00', endTime: '14:00' },
      { slotId: 6, startTime: '14:00', endTime: '15:00' },
      { slotId: 7, startTime: '15:00', endTime: '16:00' },
      { slotId: 8, startTime: '16:00', endTime: '17:00' }
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
      bankValidationData
    });

    // Save to database
    await jamRoom.save();

    // Return success response
    res.status(201).json({
      success: true,
      data: jamRoom
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


const getAllJamRooms = async (req, res) => {
    try {
      const jamRooms = await JamRoom.find({});
      
      if (!jamRooms.length) {
        return res.status(404).json({
          success: false,
          message: 'No jam rooms found'
        });
      }
  
      res.status(200).json({
        success: true,
        data: jamRooms
      });
  
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
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
          message: 'No fields to update'
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
          message: 'Jam room not found'
        });
      }
  
      res.status(200).json({
        success: true,
        data: updatedJamRoom
      });
  
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  // Check if a jam room is already registered by owner's email
const isJamRoomRegisteredByEmail = async (req, res) => {
  try {
    const { ownerEmail } = req.body;

    // Validate required fields
    if (!ownerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if the jam room is already registered by owner's email
    const existingJamRoom = await JamRoom.findOne({ 'ownerDetails.email': ownerEmail });
    if (existingJamRoom) {
      return res.status(200).json({
        success: true,
        message: 'Jam room is already registered',
        data: existingJamRoom
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'Jam room is not registered'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get jam room name by ID
const getJamRoomNameById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const jamRoom = await JamRoom.findById(id).select('jamRoomDetails.name');
    
    if (!jamRoom) {
      return res.status(404).json({
        success: false,
        message: 'Jam room not found'
      });
    }

    res.status(200).json({
      success: true,
      name: jamRoom.jamRoomDetails.name
    });

  } catch (error) {
    res.status(500).json({
      success: false, 
      message: error.message
    });
  }
};

// Get jam room by email
const getJamRoomByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    
    const jamRoom = await JamRoom.findOne({ 'ownerDetails.email': email });
    
    if (!jamRoom) {
      return res.status(404).json({
        success: false,
        message: 'Jam room not found for this email'
      });
    }

    res.status(200).json({
      success: true,
      data: jamRoom
    });
    
  } catch (error) {
    res.status(500).json({
      success: false, 
      message: error.message
    });
  }
};

const getJamRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const jamRoom = await JamRoom.findById(id);
    
    if (!jamRoom) {
      return res.status(404).json({
        success: false,
        message: 'Jam room not found'
      });
    }

    res.status(200).json({
      success: true,
      data: jamRoom
    });

  } catch (error) {
    res.status(500).json({
      success: false, 
      message: error.message
    });
  }
}



module.exports = {
  createJamRoom,
  getAllJamRooms,
  updateJamRoom,
  isJamRoomRegisteredByEmail,
  getJamRoomNameById,
  getJamRoomByEmail,
  getJamRoomById
};
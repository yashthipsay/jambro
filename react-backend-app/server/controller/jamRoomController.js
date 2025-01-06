const JamRoom = require('../models/JamRooms');

const createJamRoom = async (req, res) => {
  try {
    const { name, location, slots } = req.body;

    // Validate required fields
    if (!name || !location || !location.latitude || !location.longitude) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
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
      name,
      location,
      slots: defaultSlots
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


module.exports = {
  createJamRoom,
  getAllJamRooms
};
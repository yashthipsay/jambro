const { request } = require("express");
const User = require("../models/User");

const createUser = async (req, res) => {
  try {
    const { email, name, mobileNumber } = req.body;

    // Find existing user or create new one
    let user = await User.findOne({ email });

    if (user) {
      // If user exists, update their info
      if (name) user.name = name;
      if (mobileNumber && !user.savedNumbers.includes(mobileNumber)) {
        user.savedNumbers.push(mobileNumber);
      }
      await user.save();
    } else {
      // Create new user
      user = new User({
        email,
        name: name || "NA",
        savedNumbers: mobileNumber ? [mobileNumber] : [],
      });
      await user.save();
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("User registration error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getUserByEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const savePhoneNumber = async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;

    // Validate phone number format
    if (!phoneNumber.match(/^\+?([0-9]{2})?\d{10}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number format",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if number already exists
    if (!user.savedNumbers.includes(phoneNumber)) {
      user.savedNumbers.push(phoneNumber);
      await user.save();
    }

    res.json({
      success: true,
      data: {
        savedNumbers: user.savedNumbers,
      },
    });
  } catch (error) {
    console.error("Save phone number error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deletePhoneNumber = async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    user.savedNumbers = user.savedNumbers.filter((num) => num !== phoneNumber);
    await user.save();

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Add features for login i.e. already saved user
// Change password
// get user
// delete user
module.exports = {
  createUser,
  getUserByEmail,
  savePhoneNumber,
  deletePhoneNumber,
};

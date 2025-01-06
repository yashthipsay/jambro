const User = require('../models/User');

const createUser = async(req, res) => {
    try{
        const { name, email, mobileNumber } = req.body;

    // Check if user with mobile number exists
    const existingUser = await User.findOne({ mobileNumber });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number already registered'
      });
    }

        // Create new user
        const user = new User({
            name,
            email,
            mobileNumber
          });

          await user.save();

          res.status(201).json({
            success: true,
            data: user
          });
    }catch (error) {
        res.status(500).json({
          success: false,
          message: error.message
        });
      }
};

module.exports = {
    createUser
  };
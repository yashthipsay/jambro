const jwt = require('jsonwebtoken');
require('dotenv').config();

const generateToken = (user, jamRoomData) => {
    return jwt.sign({
        email: user.email,
        isRegistered: Boolean(jamRoomData),
        jamRoomId: jamRoomData?._id || null,
        fundAccountId: jamRoomData.bankValidationData?.fund_account?.id || null
    }, process.env.JWT_SECRET, {expiresIn: '24h'})
};

const verifyToken = (req, res, next) => {
    const bearerHeader = req.headers['authorization'];
  
    if (!bearerHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
  
    try {
      const token = bearerHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // Attach decoded user to request
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
};

module.exports = { generateToken, verifyToken };
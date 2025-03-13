const jwt = require("jsonwebtoken");
require("dotenv").config();

const generateToken = (user, jamRoomData) => {
  return jwt.sign(
    {
      email: user.email,
      isRegistered: Boolean(jamRoomData),
      jamRoomId: jamRoomData?._id || null,
      fundAccountId: jamRoomData.bankValidationData?.fund_account?.id || null,
    },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );
};

const verifyToken = (req, res, next) => {
  const bearerHeader = req.headers["authorization"];

  if (!bearerHeader) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  try {
    const token = bearerHeader.split(" ")[1];
    const decoded = jwt.verify(
      token,
      "fdca379c0528c79e0e4b3e44bc4bc7045b3c0b01c74e629a3f132eb2e9446a8c"
    );
    req.user = decoded; // Attach decoded user to request
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = { generateToken, verifyToken };

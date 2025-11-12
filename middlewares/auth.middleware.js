const userModel = require("../models/user.model");
const captainModel = require("../models/captian.model");
const blacklistTokenModel = require("../models/blacklistToken.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// creating middleware for checking that user is logged in or not
async function authUser(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "unauthorized" });
  }

  const isBlacklisted = await blacklistTokenModel.findOne({ token: token });

  if (isBlacklisted) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token decoded:", decoded);

    const user = await userModel.findById(decoded._id);

    if (!user) {
      console.log("❌ User not found for ID:", decoded._id);
      return res.status(401).json({ message: "User not found" });
    }

    console.log("✅ User found:", user.email);

    req.user = user;

    return next();
  } catch (err) {
    console.error("❌ Auth error:", err.message);
    return res
      .status(401)
      .json({ message: "Unauthorized", error: err.message });
  }
}

// creating middleware for checking that captain is logged in or not
async function authCaptain(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "unauthorized" });
  }

  const isBlacklisted = await blacklistTokenModel.findOne({ token: token });

  if (isBlacklisted) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Captain token decoded:", decoded);

    const captain = await captainModel.findById(decoded._id);

    if (!captain) {
      console.log("❌ Captain not found for ID:", decoded._id);
      return res.status(401).json({ message: "Captain not found" });
    }

    console.log("✅ Captain found:", captain.email);

    req.captain = captain;

    return next();
  } catch (err) {
    console.error("❌ Captain auth error:", err.message);
    return res
      .status(401)
      .json({ message: "Unauthorized", error: err.message });
  }
}

module.exports = { authUser, authCaptain };

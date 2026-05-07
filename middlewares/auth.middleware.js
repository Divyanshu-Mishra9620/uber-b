import userModel from "../models/user.model.js";
import captainModel from "../models/captian.model.js";
import blacklistTokenModel from "../models/blacklistToken.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// creating middleware for checking that user is logged in or not
async function authUser(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  console.log("🔍 Auth Check - User:");
  console.log("  - Cookies token:", req.cookies.token ? "EXISTS" : "MISSING");
  console.log(
    "  - Authorization header:",
    req.headers.authorization ? "EXISTS" : "MISSING",
  );
  console.log(
    "  - Token value:",
    token ? `${token.substring(0, 20)}...` : "NONE",
  );

  if (!token) {
    console.error("❌ No token found in cookies or Authorization header");
    return res.status(401).json({
      message: "unauthorized",
      details: "No token provided in cookies or Authorization header",
    });
  }

  const isBlacklisted = await blacklistTokenModel.findOne({ token: token });

  if (isBlacklisted) {
    console.error("❌ Token is blacklisted");
    return res
      .status(401)
      .json({ message: "Unauthorized - Token blacklisted" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token decoded:", decoded);
    console.log(
      "   Token expires at:",
      new Date(decoded.exp * 1000).toISOString(),
    );

    const user = await userModel.findById(decoded._id);

    if (!user) {
      console.log("❌ User not found for ID:", decoded._id);
      return res.status(401).json({ message: "User not found" });
    }

    console.log("✅ User found:", user.email);

    req.user = user;

    return next();
  } catch (err) {
    console.error("❌ User auth error:", err.message);

    // Distinguish between different JWT errors
    if (err.name === "TokenExpiredError") {
      console.error(
        "   ⏰ Token expired at:",
        new Date(err.expiredAt).toISOString(),
      );
      return res.status(401).json({
        message: "Token expired",
        error: "Please login again",
      });
    }

    if (err.name === "JsonWebTokenError") {
      console.error("   ❌ Invalid token signature");
      return res.status(401).json({
        message: "Invalid token",
        error: "Token signature invalid",
      });
    }

    return res
      .status(401)
      .json({ message: "Unauthorized", error: err.message });
  }
}

// creating middleware for checking that captain is logged in or not
async function authCaptain(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  console.log("🔍 Auth Check - Captain:");
  console.log("  - Cookies token:", req.cookies.token ? "EXISTS" : "MISSING");
  console.log(
    "  - Authorization header:",
    req.headers.authorization ? "EXISTS" : "MISSING",
  );
  console.log(
    "  - Token value:",
    token ? `${token.substring(0, 20)}...` : "NONE",
  );

  if (!token) {
    console.error("❌ No token found in cookies or Authorization header");
    return res.status(401).json({
      message: "unauthorized",
      details: "No token provided in cookies or Authorization header",
    });
  }

  const isBlacklisted = await blacklistTokenModel.findOne({ token: token });

  if (isBlacklisted) {
    console.error("❌ Token is blacklisted");
    return res
      .status(401)
      .json({ message: "Unauthorized - Token blacklisted" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Captain token decoded:", decoded);
    console.log(
      "   Token expires at:",
      new Date(decoded.exp * 1000).toISOString(),
    );

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

    // Distinguish between different JWT errors
    if (err.name === "TokenExpiredError") {
      console.error(
        "   ⏰ Token expired at:",
        new Date(err.expiredAt).toISOString(),
      );
      return res.status(401).json({
        message: "Token expired",
        error: "Please login again",
      });
    }

    if (err.name === "JsonWebTokenError") {
      console.error("   ❌ Invalid token signature");
      return res.status(401).json({
        message: "Invalid token",
        error: "Token signature invalid",
      });
    }

    return res
      .status(401)
      .json({ message: "Unauthorized", error: err.message });
  }
}

export { authUser, authCaptain };

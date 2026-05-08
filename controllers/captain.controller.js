import captainModel from "../models/captian.model.js";
import blacklistTokenModel from "../models/blacklistToken.model.js";
import { validationResult } from "express-validator";

async function registerCaptain(req, res, next) {
  console.log(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("❌ Validation errors:", errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { fullname, email, password, vehicle } = req.body;
    console.log("📝 Captain registration attempt:", email);

    const isCaptainExists = await captainModel.findOne({ email });
    if (isCaptainExists) {
      console.log("❌ Captain already exists with email:", email);
      return res
        .status(400)
        .json({ message: "Captain with this email already exists" });
    }

    const hashedPassword = await captainModel.hashPassword(password);

    const captain = await captainModel.create({
      fullname: {
        firstname: fullname.firstname,
        lastname: fullname.lastname,
      },
      email,
      password: hashedPassword,
      vehicle: {
        color: vehicle.color,
        plate: vehicle.plate,
        capacity: vehicle.capacity,
        vehicleType: vehicle.vehicleType,
      },
    });

    console.log("✅ Captain created with ID:", captain._id);

    const token = captain.generateAuthToken();

    console.log("✅ Token generated for captain:", captain._id);

    res.status(201).json({ token, captain });
  } catch (error) {
    console.error("❌ Captain registration error:", error);
    res
      .status(500)
      .json({ message: "Registration failed", error: error.message });
  }
}

async function loginCaptain(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  console.log("🔐 Captain login attempt:", email);

  const captain = await captainModel.findOne({ email }).select("+password");
  if (!captain) {
    console.log("❌ Captain not found with email:", email);
    return res.status(401).json({ message: "Invalid email or password" });
  }

  console.log("✅ Captain found:", captain._id);

  const isMatch = await captain.comparePassword(password);

  if (!isMatch) {
    console.log("❌ Password mismatch for captain:", email);
    return res.status(401).json({ message: "Invalid email or password" });
  }

  console.log("✅ Password matched for captain:", email);
  const token = captain.generateAuthToken();
  res.cookie("token", token);

  console.log("✅ Token generated for captain:", captain._id);
  res.status(201).json({ token, captain });
}

// this will only be called if captain is logged in and if yes then it has captain details in req.captain
async function getCaptainProfile(req, res, next) {
  res.status(200).json({ captain: req.captain });
}

// this will only be called if captain is logged in and if yes then it will find token and clear cookie and put token in blacklisted model
async function logoutCaptain(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  res.clearCookie("token");

  await blacklistTokenModel.create({ token });

  res.status(200).json({ message: "Logged out successfully" });
}

export { registerCaptain, loginCaptain, getCaptainProfile, logoutCaptain };

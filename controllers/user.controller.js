const userModel = require("../models/user.model");
const { createUser } = require("../services/user.service");
const { validationResult } = require("express-validator");
const blacklistTokenModel = require("../models/blacklistToken.model");

async function registerUser(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { fullname, email, password } = req.body;
    console.log("📝 Registration attempt for email:", email);

    const isUserExists = await userModel.findOne({ email });
    if (isUserExists) {
      console.log("❌ User already exists with email:", email);
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    const hashedPassword = await userModel.hashPassword(password);

    const user = await createUser({
      firstname: fullname.firstname,
      lastname: fullname.lastname,
      email,
      password: hashedPassword,
    });

    console.log("✅ User created with ID:", user._id);

    const token = user.generateAuthToken();
    console.log("✅ Token generated for new user:", user._id);

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({ token, user: userResponse });
  } catch (error) {
    console.error("❌ Registration error:", error);
    res
      .status(500)
      .json({ message: "Registration failed", error: error.message });
  }
}

async function loginUser(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;
    console.log("🔐 Login attempt for email:", email);

    const user = await userModel.findOne({ email }).select("+password");

    if (!user) {
      console.log("❌ User not found with email:", email);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    console.log("✅ User found, ID:", user._id);

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      console.log("❌ Password mismatch for user:", email);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = user.generateAuthToken();
    console.log("✅ Token generated for user:", user._id);

    res.cookie("token", token);

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({ token, user: userResponse });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
}

// this will only be called if user is logged in and if yes then it has user details in req.user
async function getUserProfile(req, res, next) {
  res.status(200).json({ user: req.user });
}

// this will only be called if user is logged in and if yes then it will find token and clear cookie and put token in blacklisted model
async function logoutUser(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  res.clearCookie("token");

  await blacklistTokenModel.create({ token });

  res.status(200).json({ message: "logged out" });
}

module.exports = { registerUser, loginUser, getUserProfile, logoutUser };

const rideService = require("../services/ride.service");
const mapService = require("../services/maps.service");
const { validationResult } = require("express-validator");
const { sendMessageToSocketId } = require("../socket");
const rideModel = require("../models/ride.model");

const createRide = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { pickup, destination, vehicleType } = req.body;

  try {
    console.log(pickup, destination, vehicleType);
    console.log(req.user);
    const newRide = await rideService.createRide({
      user: req.user._id,
      pickup,
      destination,
      vehicleType,
    });
    console.log("New Ride");
    console.log(newRide);

    const pickupCoordinates = await mapService.getAddressCoordinate(pickup);

    if (pickupCoordinates.error) {
      throw new Error(pickupCoordinates.error);
    }

    console.log("📍 Pickup coordinates:", pickupCoordinates);

    const captainsInRadius = await mapService.getCaptainsInTheRadius(
      pickupCoordinates.ltd,
      pickupCoordinates.lng,
      1000
    );

    console.log(`\n👥 Found ${captainsInRadius.length} captains in radius`);

    if (captainsInRadius.length === 0) {
      console.warn("⚠️ WARNING: No captains found in 1000km radius!");
      console.warn("Possible reasons:");
      console.warn("  1. No captains have joined and updated their location");
      console.warn("  2. Captains are outside the 1000km search radius");
      console.warn("  3. Captain location index not created in MongoDB");
    }

    newRide.otp = "";

    const rideWithUser = await rideModel
      .findOne({ _id: newRide._id })
      .populate("userId");

    console.log(
      `\n📤 Broadcasting new-ride to ${captainsInRadius.length} captains`
    );

    captainsInRadius.forEach((captain) => {
      console.log(
        `   → Sending to captain: ${captain._id} (socketId: ${captain.socketId})`
      );
      if (captain.socketId) {
        sendMessageToSocketId(captain.socketId, {
          event: "new-ride",
          data: rideWithUser,
        });
      } else {
        console.warn(`   ⚠️ Captain ${captain._id} has no socketId`);
      }
    });

    res.status(201).json(newRide);
  } catch (error) {
    console.error("Create ride error:", error);
    res.status(500).json({ error: error.message });
  }
};

const getFare = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { pickup, destination } = req.query;
  try {
    console.log("📍 Calculating fare for:", pickup, "→", destination);
    const fareDetails = await rideService.getFare({ pickup, destination });
    console.log("✅ Fare calculated:", fareDetails);
    res.status(200).json(fareDetails);
  } catch (error) {
    console.error("❌ Get fare error:", error.message);
    res.status(500).json({
      error: error.message,
      message: "Failed to calculate fare. Please try again.",
    });
  }
};

const confirmRide = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId } = req.body;

  try {
    const ride = await rideService.confirmRide({
      rideId,
      captain: req.captain,
    });

    //use socket to tell user that his ride is confirmed
    sendMessageToSocketId(ride.userId.socketId, {
      event: "ride-confirmed",
      data: ride,
    });

    return res.status(200).json(ride);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err.message });
  }
};

const startRide = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId, otp } = req.query;

  try {
    const ride = await rideService.startRide({
      rideId,
      otp,
      captain: req.captain,
    });
    console.log(ride);

    sendMessageToSocketId(ride.userId.socketId, {
      event: "ride-started",
      data: ride,
    });

    return res.status(200).json(ride);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const endRide = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId } = req.body;

  try {
    const ride = await rideService.endRide({ rideId, captain: req.captain });
    console.log(" ride.controller.endRide ");
    console.log(ride);

    //use socket to tell user that his ride has ended
    sendMessageToSocketId(ride.userId.socketId, {
      event: "ride-ended",
      data: ride,
    });
    return res.status(200).json(ride);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = { createRide, getFare, confirmRide, startRide, endRide };

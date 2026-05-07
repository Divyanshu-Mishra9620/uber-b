import rideService from "../services/ride.service.js";
import mapService from "../services/maps.service.js";
import captainService from "../services/captain.service.js";
import { validationResult } from "express-validator";
import { sendMessageToSocketId } from "../socket-helpers.js";
import rideModel from "../models/ride.model.js";

const createRide = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { pickup, destination, vehicleType } = req.body;

  try {
    console.log("📝 Creating ride:", { pickup, destination, vehicleType });
    console.log("👤 User ID:", req.user._id);

    const newRide = await rideService.createRide(
      req.user._id,
      pickup,
      destination,
      null, // pickupCoordinates (service will fetch)
      null, // dropoffCoordinates (service will fetch)
    );
    console.log("✅ New Ride created:", newRide._id);

    const pickupCoordinates = await mapService.getAddressCoordinate(pickup);

    if (pickupCoordinates.error) {
      throw new Error(pickupCoordinates.error);
    }

    console.log("📍 Pickup coordinates:", pickupCoordinates);

    // Find available captains (for now, just get all available captains)
    // TODO: Implement geospatial search for captains within radius
    const availableCaptains = await captainService.getAvailableCaptains();

    console.log(`\n👥 Found ${availableCaptains.length} available captains`);

    if (availableCaptains.length === 0) {
      console.warn("⚠️ WARNING: No captains found!");
      console.warn("Possible reasons:");
      console.warn("  1. No captains have joined the platform");
      console.warn("  2. All captains are currently busy");
      console.warn("  3. Captain status not properly updated");
    }

    const rideWithUser = await rideModel
      .findOne({ _id: newRide._id })
      .populate("userId")
      .select("+otp"); // Include OTP when sending to captain

    console.log(
      `\n📤 Broadcasting new-ride to ${availableCaptains.length} captains`,
    );

    availableCaptains.forEach((captain) => {
      console.log(
        `   → Sending to captain: ${captain._id} (socketId: ${captain.socketId})`,
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
    console.error("❌ Validation errors in startRide:", errors.array());
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array(),
    });
  }

  const { rideId, otp } = req.query;

  try {
    console.log(`\n🏁 Starting ride: ${rideId} with OTP: ${otp}`);

    const ride = await rideService.startRide({
      rideId,
      otp,
      captain: req.captain,
    });
    console.log("✅ Ride started successfully");

    sendMessageToSocketId(ride.userId.socketId, {
      event: "ride-started",
      data: ride,
    });

    return res.status(200).json(ride);
  } catch (err) {
    console.error("❌ Error starting ride:", err.message);
    return res.status(400).json({
      error: err.message,
      message: "Failed to start ride",
    });
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

export { createRide, getFare, confirmRide, startRide, endRide };

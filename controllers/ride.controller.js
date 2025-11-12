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

    console.log(pickupCoordinates);
    console.log("hello3");

    const captainsInRadius = await mapService.getCaptainsInTheRadius(
      pickupCoordinates.ltd,
      pickupCoordinates.lng,
      1000
    );

    newRide.otp = "";

    console.log("ride.controller.captainsinradius" + captainsInRadius);

    const rideWithUser = await rideModel
      .findOne({ _id: newRide._id })
      .populate("userId");

    captainsInRadius.map((captain) => {
      console.log("ride.controller.captain" + captain);
      sendMessageToSocketId(captain.socketId, {
        event: "new-ride",
        data: rideWithUser,
      });
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
    const fareDetails = await rideService.getFare({ pickup, destination });
    res.status(200).json(fareDetails);
  } catch (error) {
    console.error("Get fare error:", error);
    res.status(500).json({ error: error.message });
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

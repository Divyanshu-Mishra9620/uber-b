import express from "express";
import { authUser, authCaptain } from "../middlewares/auth.middleware.js";
import { body, query } from "express-validator";
import * as rideController from "../controllers/ride.controller.js";

const router = express.Router();

router.post(
  "/create",
  authUser,
  body("pickup")
    .isString()
    .isLength({ min: 3 })
    .withMessage("Invalid pickup location"),
  body("destination")
    .isString()
    .isLength({ min: 3 })
    .withMessage("Invalid destination address"),
  body("vehicleType")
    .isIn(["auto", "car", "moto"])
    .withMessage("Invalid vehicle type"),
  rideController.createRide,
);

// as ride is created an otp will be generated
//since we are making get type req so we dont need body we need query
router.get(
  "/get-fare",
  authUser,
  query("pickup")
    .isString()
    .isLength({ min: 3 })
    .withMessage("Invalid pickup location"),
  query("destination")
    .isString()
    .isLength({ min: 3 })
    .withMessage("Invalid destination address"),
  rideController.getFare,
);

router.post(
  "/confirm",
  authCaptain,
  body("rideId").isMongoId().withMessage("Invalid ride id"),
  rideController.confirmRide,
);

router.get(
  "/start-ride",
  authCaptain,
  query("rideId").isMongoId().withMessage("Invalid ride id"),
  query("otp").isLength({ min: 6, max: 6 }).withMessage("Invalid otp"),
  rideController.startRide,
);

router.post(
  "/end-ride",
  authCaptain,
  body("rideId").isMongoId().withMessage("Invalid ride id"),
  rideController.endRide,
);

export default router;

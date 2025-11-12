const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const router = express.Router();
const { body,query } = require("express-validator");
const rideController = require("../controllers/ride.controller");

router.post(
  "/create",
  authMiddleware.authUser,
  body("pickup").isString().isLength({ min: 3 }).withMessage("Invalid pickup location"),
  body("destination").isString().isLength({ min: 3 }).withMessage("Invalid destination address"),
  body("vehicleType").isIn(["auto", "car", "moto"]).withMessage("Invalid vehicle type"),
  rideController.createRide
);

// as ride is created an otp will be generated
//since we are making get type req so we dont need body we need query
router.get("/get-fare", authMiddleware.authUser,
  query("pickup").isString().isLength({ min: 3 }).withMessage("Invalid pickup location"),
  query("destination").isString().isLength({ min: 3 }).withMessage("Invalid destination address"),
  rideController.getFare
);

router.post("/confirm",authMiddleware.authCaptain,body('rideId').isMongoId().withMessage("Invalid ride id"),rideController.confirmRide);

router.get("/start-ride",authMiddleware.authCaptain,query('rideId').isMongoId().withMessage("Invalid ride id"),query('otp').isLength({min:6,max:6}).withMessage("Invalid otp"),rideController.startRide);

router.post("/end-ride",authMiddleware.authCaptain,body('rideId').isMongoId().withMessage("Invalid ride id"),rideController.endRide);

module.exports = router;

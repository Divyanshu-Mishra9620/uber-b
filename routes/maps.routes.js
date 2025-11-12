const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const router = express.Router();
const { query } = require("express-validator");

const mapController = require("../controllers/maps.controller");

router.get(
  "/get-coordinates",
  query("address").isString().isLength({ min: 3 }),
  authMiddleware.authUser,
  mapController.getCoordinates
);

// router.get("/get-coordinates",mapController.getCoordinates)

router.get(
  "/get-distance-time",
  query("origin").isString().isLength({ min: 3 }),
  query("destination").isString().isLength({ min: 3 }),
  authMiddleware.authUser,
  mapController.getDistanceTime
);

// router.get("/get-distance-time",mapController.getDistanceTime)

// Get suggestions - No auth required (public endpoint for autocomplete)
router.get(
  "/get-suggestions",
  query("input").isString().isLength({ min: 3 }),
  mapController.getSuggestions
);

module.exports = router;

import express from "express";
import { authUser } from "../middlewares/auth.middleware.js";
import { query } from "express-validator";
import * as mapController from "../controllers/maps.controller.js";

const router = express.Router();

router.get(
  "/get-coordinates",
  query("address").isString().isLength({ min: 3 }),
  authUser,
  mapController.getCoordinates,
);

// router.get("/get-coordinates",mapController.getCoordinates)

router.get(
  "/get-distance-time",
  query("origin").isString().isLength({ min: 3 }),
  query("destination").isString().isLength({ min: 3 }),
  authUser,
  mapController.getDistanceTime,
);

// router.get("/get-distance-time",mapController.getDistanceTime)

// Get suggestions - No auth required (public endpoint for autocomplete)
router.get(
  "/get-suggestions",
  query("input").isString().isLength({ min: 3 }),
  mapController.getSuggestions,
);

export default router;

import RideRepository from "../repositories/ride.repository.js";
import CaptainRepository from "../repositories/captain.repository.js";
import MapsService from "./maps.service.js";
import CacheService from "./cache.service.js";
import logger from "../utils/logger.js";
import { RIDE_STATUS, SEARCH_RADIUS } from "../config/constants.js";

/**
 * OPTIMIZED Ride Service
 * - Business logic layer
 * - Uses repositories for data access
 * - Caching strategy
 * - External service integration
 */
class RideService {
  /**
   * Create new ride
   */
  static async createRide(
    userId,
    pickupAddress,
    dropoffAddress,
    pickupCoordinates,
    dropoffCoordinates,
  ) {
    try {
      logger.info("[RideService] Creating ride", {
        userId,
        pickupAddress,
        dropoffAddress,
      });

      // Get coordinates if not provided
      let pickup = pickupCoordinates;
      let dropoff = dropoffCoordinates;

      if (!pickup) {
        pickup = await MapsService.getAddressCoordinate(pickupAddress);
      }

      if (!dropoff) {
        dropoff = await MapsService.getAddressCoordinate(dropoffAddress);
      }

      // Calculate fare
      const fareEstimate = await MapsService.getFareEstimate(pickup, dropoff);

      // Generate OTP
      const otp = this.generateOTP();

      // Create ride in DB
      const rideData = {
        userId,
        pickup: pickupAddress,
        destination: dropoffAddress,
        fare: fareEstimate.totalFare,
        distance: fareEstimate.distance,
        duration: fareEstimate.duration,
        otp,
        status: RIDE_STATUS.PENDING,
      };

      const newRide = await RideRepository.create(rideData);
      logger.info("[RideService] Ride created successfully", {
        rideId: newRide._id,
      });

      return newRide;
    } catch (error) {
      logger.error("[RideService] Error creating ride", error);
      throw error;
    }
  }

  /**
   * Calculate fare for a ride
   * @param {Object} params - { pickup, destination }
   * @returns {Object} Fare details
   */
  static async getFare({ pickup, destination }) {
    try {
      logger.info("[RideService] Calculating fare", { pickup, destination });

      // Get coordinates for both addresses
      const pickupCoords = await MapsService.getAddressCoordinate(pickup);
      const destCoords = await MapsService.getAddressCoordinate(destination);

      if (!pickupCoords || !destCoords) {
        throw new Error("Unable to get coordinates for provided addresses");
      }

      // Get fare estimate from maps service
      const fareEstimate = await MapsService.getFareEstimate(
        pickupCoords,
        destCoords,
      );

      logger.info("[RideService] Fare calculated successfully", fareEstimate);

      // Calculate fares for different vehicle types
      const baseFares = {
        car: 50, // UberGo
        moto: 30, // Moto
        auto: 40, // UberAuto
      };

      const perKmFares = {
        car: 8,
        moto: 5,
        auto: 6,
      };

      const perMinuteFares = {
        car: 1,
        moto: 0.5,
        auto: 0.75,
      };

      const vehicleFares = {};
      Object.keys(baseFares).forEach((vehicleType) => {
        vehicleFares[vehicleType] = Math.round(
          baseFares[vehicleType] +
            fareEstimate.distance * perKmFares[vehicleType] +
            fareEstimate.duration * perMinuteFares[vehicleType],
        );
      });

      return {
        pickup,
        destination,
        distance: fareEstimate.distance,
        duration: fareEstimate.duration,
        car: vehicleFares.car,
        moto: vehicleFares.moto,
        auto: vehicleFares.auto,
        currency: "INR",
      };
    } catch (error) {
      logger.error("[RideService] Error calculating fare", error);
      throw error;
    }
  }

  /**
   * Find nearby captains for a ride
   */
  static async findNearbyCaptains(
    rideId,
    pickupCoordinates,
    searchRadius = SEARCH_RADIUS.INITIAL,
  ) {
    try {
      logger.debug("[RideService] Searching for captains", {
        rideId,
        latitude: pickupCoordinates.latitude,
        longitude: pickupCoordinates.longitude,
        radius: searchRadius,
      });

      const captains = await CaptainRepository.findNearby(
        pickupCoordinates.latitude,
        pickupCoordinates.longitude,
        searchRadius,
      );

      logger.info("[RideService] Found captains", {
        rideId,
        count: captains.length,
      });
      return captains;
    } catch (error) {
      logger.error("[RideService] Error finding captains", error, { rideId });
      throw error;
    }
  }

  /**
   * Accept ride (captain accepts)
   */
  static async acceptRide(rideId, captainId) {
    try {
      logger.info("[RideService] Captain accepting ride", {
        rideId,
        captainId,
      });

      const ride = await RideRepository.acceptRide(rideId, captainId);

      // Invalidate related caches
      await CacheService.invalidateRideCache(rideId);

      logger.info("[RideService] Ride accepted", { rideId, captainId });
      return ride;
    } catch (error) {
      logger.error("[RideService] Error accepting ride", error, {
        rideId,
        captainId,
      });
      throw error;
    }
  }

  /**
   * Start ride (captain starts ride)
   */
  static async startRide(rideId, otp) {
    try {
      logger.info("[RideService] Starting ride", { rideId });

      const ride = await RideRepository.findByIdWithOtp(rideId);

      if (!ride) {
        throw new Error("Ride not found");
      }

      if (ride.status !== RIDE_STATUS.ACCEPTED) {
        throw new Error("Ride must be accepted before starting");
      }

      // Verify OTP
      if (ride.otp !== otp) {
        throw new Error("Invalid OTP");
      }

      const updated = await RideRepository.updateStatus(
        rideId,
        RIDE_STATUS.ONGOING,
        {
          startedAt: new Date(),
        },
      );

      // Clear OTP after verification
      await RideRepository.clearOTP(rideId);

      logger.info("[RideService] Ride started", { rideId });
      return updated;
    } catch (error) {
      logger.error("[RideService] Error starting ride", error, { rideId });
      throw error;
    }
  }

  /**
   * Complete ride
   */
  static async completeRide(rideId, endCoordinates = {}) {
    try {
      logger.info("[RideService] Completing ride", { rideId });

      const updated = await RideRepository.completeRide(rideId, {
        endLocation: endCoordinates,
      });

      await CacheService.invalidateRideCache(rideId);

      logger.info("[RideService] Ride completed", { rideId });
      return updated;
    } catch (error) {
      logger.error("[RideService] Error completing ride", error, { rideId });
      throw error;
    }
  }

  /**
   * Cancel ride
   */
  static async cancelRide(rideId, reason = "User cancelled") {
    try {
      logger.info("[RideService] Cancelling ride", { rideId, reason });

      const updated = await RideRepository.cancelRide(rideId, reason);

      await CacheService.invalidateRideCache(rideId);

      logger.info("[RideService] Ride cancelled", { rideId });
      return updated;
    } catch (error) {
      logger.error("[RideService] Error cancelling ride", error, { rideId });
      throw error;
    }
  }

  /**
   * Get ride by ID
   */
  static async getRideById(rideId, withDetails = false) {
    try {
      const ride = withDetails
        ? await RideRepository.findByIdWithDetails(rideId)
        : await RideRepository.findById(rideId);

      return ride;
    } catch (error) {
      logger.error("[RideService] Error getting ride", error, { rideId });
      throw error;
    }
  }

  /**
   * Get user rides
   */
  static async getUserRides(userId, page = 1, limit = 20) {
    try {
      const rides = await RideRepository.getRidesByUserId(userId, page, limit);
      return rides;
    } catch (error) {
      logger.error("[RideService] Error getting user rides", error, { userId });
      throw error;
    }
  }

  /**
   * Get captain rides
   */
  static async getCaptainRides(captainId, page = 1, limit = 20) {
    try {
      const rides = await RideRepository.getRidesByCaptainId(
        captainId,
        page,
        limit,
      );
      return rides;
    } catch (error) {
      logger.error("[RideService] Error getting captain rides", error, {
        captainId,
      });
      throw error;
    }
  }

  /**
   * Generate OTP for ride verification
   */
  static generateOTP(length = 6) {
    let otp = "";
    for (let i = 0; i < length; i++) {
      otp += Math.floor(Math.random() * 10);
    }
    return otp;
  }
}

export default RideService;

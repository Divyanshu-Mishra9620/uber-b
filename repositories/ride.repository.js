import Ride from "../models/ride.model.js";
import logger from "../utils/logger.js";
import { RIDE_STATUS, PAGINATION } from "../config/constants.js";

/**
 * OPTIMIZED Ride Repository
 * - Prevents N+1 queries
 * - Uses lean() for read-only queries
 * - Implements pagination
 * - Optimized projections
 */
class RideRepository {
  /**
   * Find ride by ID with minimal data
   */
  static async findById(rideId, withDetails = false) {
    try {
      const query = Ride.findById(rideId).lean();

      if (!withDetails) {
        // Exclude OTP from read-only queries for security
        query.select("-otp");
      }

      const ride = await query;

      if (!ride) {
        logger.warn("[RideRepo] Ride not found", { rideId });
        return null;
      }

      return ride;
    } catch (error) {
      logger.error("[RideRepo] Error finding ride", error, { rideId });
      throw error;
    }
  }

  /**
   * Find ride by ID and explicitly include the OTP
   */
  static async findByIdWithOtp(rideId) {
    try {
      const ride = await Ride.findById(rideId).select("+otp").lean();
      return ride;
    } catch (error) {
      logger.error("[RideRepo] Error finding ride with OTP", error, { rideId });
      throw error;
    }
  }

  /**
   * Find ride with full details including user/captain
   * Use sparingly - only when full details needed
   */
  static async findByIdWithDetails(rideId) {
    try {
      const ride = await Ride.findById(rideId)
        .populate("userId", "firstName lastName email phone")
        .populate("captainId", "firstName lastName vehicleType rating")
        .lean()
        .select("-otp");

      return ride;
    } catch (error) {
      logger.error("[RideRepo] Error finding ride with details", error, {
        rideId,
      });
      throw error;
    }
  }

  /**
   * Create new ride
   */
  static async create(rideData) {
    try {
      const newRide = new Ride(rideData);
      await newRide.save();

      logger.info("[RideRepo] Ride created", { rideId: newRide._id });

      // Return minimal data without OTP
      return {
        _id: newRide._id,
        userId: newRide.userId,
        pickup: newRide.pickup,
        dropoff: newRide.dropoff,
        fare: newRide.fare,
        status: newRide.status,
        createdAt: newRide.createdAt,
      };
    } catch (error) {
      logger.error("[RideRepo] Error creating ride", error);
      throw error;
    }
  }

  /**
   * Update ride status
   */
  static async updateStatus(rideId, status, additionalData = {}) {
    try {
      if (!Object.values(RIDE_STATUS).includes(status)) {
        throw new Error(`Invalid status: ${status}`);
      }

      const updateData = { status, ...additionalData };

      const updated = await Ride.findByIdAndUpdate(rideId, updateData, {
        new: true,
        lean: true,
      }).select("-otp");

      logger.debug("[RideRepo] Ride status updated", { rideId, status });
      return updated;
    } catch (error) {
      logger.error("[RideRepo] Error updating ride status", error, {
        rideId,
        status,
      });
      throw error;
    }
  }

  /**
   * Accept ride (captain accepts)
   */
  static async acceptRide(rideId, captainId) {
    try {
      const updated = await Ride.findByIdAndUpdate(
        rideId,
        {
          captain: captainId,
          status: RIDE_STATUS.ACCEPTED,
          acceptedAt: new Date(),
        },
        { new: true, lean: true },
      ).select("-otp");

      logger.info("[RideRepo] Ride accepted", { rideId, captainId });
      return updated;
    } catch (error) {
      logger.error("[RideRepo] Error accepting ride", error, {
        rideId,
        captainId,
      });
      throw error;
    }
  }

  /**
   * Complete ride
   */
  static async completeRide(rideId, endData = {}) {
    try {
      const updated = await Ride.findByIdAndUpdate(
        rideId,
        {
          status: RIDE_STATUS.COMPLETED,
          completedAt: new Date(),
          ...endData,
        },
        { new: true, lean: true },
      ).select("-otp");

      logger.info("[RideRepo] Ride completed", { rideId });
      return updated;
    } catch (error) {
      logger.error("[RideRepo] Error completing ride", error, { rideId });
      throw error;
    }
  }

  /**
   * Cancel ride
   */
  static async cancelRide(rideId, reason = "") {
    try {
      const updated = await Ride.findByIdAndUpdate(
        rideId,
        {
          status: RIDE_STATUS.CANCELLED,
          cancellationReason: reason,
          cancelledAt: new Date(),
        },
        { new: true, lean: true },
      ).select("-otp");

      logger.info("[RideRepo] Ride cancelled", { rideId, reason });
      return updated;
    } catch (error) {
      logger.error("[RideRepo] Error cancelling ride", error, { rideId });
      throw error;
    }
  }

  /**
   * Get rides for user with pagination
   */
  static async getRidesByUserId(
    userId,
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
  ) {
    try {
      const skip = (page - 1) * limit;

      const [rides, total] = await Promise.all([
        Ride.find({ userId })
          .lean()
          .select("-otp")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        Ride.countDocuments({ userId }),
      ]);

      return {
        data: rides,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error("[RideRepo] Error getting user rides", error, { userId });
      throw error;
    }
  }

  /**
   * Get rides for captain with pagination
   */
  static async getRidesByCaptainId(
    captainId,
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
  ) {
    try {
      const skip = (page - 1) * limit;

      const [rides, total] = await Promise.all([
        Ride.find({ captain: captainId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        Ride.countDocuments({ captain: captainId }),
      ]);

      return {
        data: rides,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error("[RideRepo] Error getting captain rides", error, {
        captainId,
      });
      throw error;
    }
  }

  /**
   * Get pending rides (not yet accepted)
   */
  static async getPendingRides(limit = 20) {
    try {
      const rides = await Ride.find({ status: RIDE_STATUS.PENDING })
        .lean()
        .select("-otp")
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();

      return rides;
    } catch (error) {
      logger.error("[RideRepo] Error getting pending rides", error);
      throw error;
    }
  }

  /**
   * Find rides within location radius
   */
  static async findRidesInRadius(latitude, longitude, radiusInMeters = 1000) {
    try {
      const rides = await Ride.find({
        status: RIDE_STATUS.PENDING,
        "pickup.location": {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
            $maxDistance: radiusInMeters,
          },
        },
      })
        .lean()
        .select("-otp")
        .limit(20)
        .exec();

      logger.debug("[RideRepo] Found rides in radius", { count: rides.length });
      return rides;
    } catch (error) {
      logger.error("[RideRepo] Error finding rides in radius", error);
      throw error;
    }
  }

  /**
   * Clear OTP from ride (after verification)
   */
  static async clearOTP(rideId) {
    try {
      await Ride.findByIdAndUpdate(rideId, { otp: null });
      logger.debug("[RideRepo] OTP cleared", { rideId });
    } catch (error) {
      logger.error("[RideRepo] Error clearing OTP", error, { rideId });
      throw error;
    }
  }
}

export default RideRepository;

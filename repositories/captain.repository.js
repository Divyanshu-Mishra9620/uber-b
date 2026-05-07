import Captain from "../models/captian.model.js";
import logger from "../utils/logger.js";
import {
  CAPTAIN_STATUS,
  SEARCH_RADIUS,
  PAGINATION,
} from "../config/constants.js";

/**
 * OPTIMIZED Captain Repository
 * - Implements repository pattern for database abstraction
 * - Uses lean() for read-only queries
 * - Implements pagination
 * - Optimized geospatial queries
 * - Prevents N+1 queries
 */
class CaptainRepository {
  /**
   * Find captain by ID with optional population
   */
  static async findById(captainId, includePassword = false) {
    try {
      const query = Captain.findById(captainId).lean();

      if (!includePassword) {
        query.select("-password");
      }

      const captain = await query;

      if (!captain) {
        logger.warn("[CaptainRepo] Captain not found", { captainId });
        return null;
      }

      return captain;
    } catch (error) {
      logger.error("[CaptainRepo] Error finding captain", error, { captainId });
      throw error;
    }
  }

  /**
   * Find captain by email
   */
  static async findByEmail(email) {
    try {
      const captain = await Captain.findOne({ email }).lean();
      return captain;
    } catch (error) {
      logger.error("[CaptainRepo] Error finding captain by email", error, {
        email,
      });
      throw error;
    }
  }

  /**
   * Update captain location efficiently
   * Batch updates to reduce database writes
   */
  static async updateLocation(captainId, latitude, longitude, socketId = null) {
    try {
      const updateData = {
        "location.latitude": latitude,
        "location.longitude": longitude,
        lastLocationUpdate: new Date(),
      };

      if (socketId) {
        updateData.socketId = socketId;
      }

      const updated = await Captain.findByIdAndUpdate(captainId, updateData, {
        new: true,
        lean: true,
      }).select("-password");

      logger.debug("[CaptainRepo] Location updated", { captainId });
      return updated;
    } catch (error) {
      logger.error("[CaptainRepo] Error updating location", error, {
        captainId,
      });
      throw error;
    }
  }

  /**
   * Update captain status
   */
  static async updateStatus(captainId, status) {
    try {
      if (!Object.values(CAPTAIN_STATUS).includes(status)) {
        throw new Error(`Invalid status: ${status}`);
      }

      const updated = await Captain.findByIdAndUpdate(
        captainId,
        { status, lastStatusUpdate: new Date() },
        { new: true, lean: true },
      ).select("-password");

      logger.debug("[CaptainRepo] Status updated", { captainId, status });
      return updated;
    } catch (error) {
      logger.error("[CaptainRepo] Error updating status", error, {
        captainId,
        status,
      });
      throw error;
    }
  }

  /**
   * CRITICAL OPTIMIZATION: Find nearby captains using geospatial index
   * Replaces inefficient radius search
   */
  static async findNearby(
    latitude,
    longitude,
    maxDistance = SEARCH_RADIUS.INITIAL,
    limit = 10,
  ) {
    try {
      // Requires MongoDB geospatial index on location
      const captains = await Captain.find({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
            $maxDistance: maxDistance,
          },
        },
        status: CAPTAIN_STATUS.ACTIVE,
      })
        .lean()
        .select("-password -otp")
        .limit(limit)
        .exec();

      logger.debug("[CaptainRepo] Found nearby captains", {
        latitude,
        longitude,
        count: captains.length,
      });

      return captains;
    } catch (error) {
      logger.error("[CaptainRepo] Error finding nearby captains", error);
      throw error;
    }
  }

  /**
   * Get all active captains (with pagination)
   */
  static async getActiveCaptains(
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT,
  ) {
    try {
      const skip = (page - 1) * limit;

      const [captains, total] = await Promise.all([
        Captain.find({ status: CAPTAIN_STATUS.ACTIVE })
          .lean()
          .select("-password -otp")
          .skip(skip)
          .limit(limit)
          .exec(),
        Captain.countDocuments({ status: CAPTAIN_STATUS.ACTIVE }),
      ]);

      return {
        data: captains,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error("[CaptainRepo] Error getting active captains", error);
      throw error;
    }
  }

  /**
   * Check if captain is online and available
   */
  static async isAvailable(captainId) {
    try {
      const captain = await Captain.findById(captainId)
        .lean()
        .select("status socketId");

      return (
        captain &&
        captain.status === CAPTAIN_STATUS.ACTIVE &&
        !!captain.socketId
      );
    } catch (error) {
      logger.error("[CaptainRepo] Error checking availability", error, {
        captainId,
      });
      return false;
    }
  }

  /**
   * Create new captain
   */
  static async create(captainData) {
    try {
      const newCaptain = new Captain(captainData);
      await newCaptain.save();

      return {
        _id: newCaptain._id,
        email: newCaptain.email,
        firstName: newCaptain.firstName,
        lastName: newCaptain.lastName,
      };
    } catch (error) {
      logger.error("[CaptainRepo] Error creating captain", error);
      throw error;
    }
  }

  /**
   * Bulk update captain statuses (offline all after server restart)
   */
  static async markAllOffline() {
    try {
      const result = await Captain.updateMany(
        { status: { $ne: CAPTAIN_STATUS.OFFLINE } },
        { status: CAPTAIN_STATUS.OFFLINE, socketId: null },
      );

      logger.info("[CaptainRepo] Marked all captains offline", {
        modified: result.modifiedCount,
      });

      return result;
    } catch (error) {
      logger.error("[CaptainRepo] Error marking captains offline", error);
      throw error;
    }
  }
}

export default CaptainRepository;

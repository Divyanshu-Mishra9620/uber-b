import CaptainRepository from "../repositories/captain.repository.js";
import CacheService from "./cache.service.js";
import logger from "../utils/logger.js";
import { CAPTAIN_STATUS } from "../config/constants.js";

/**
 * Captain Service
 * - Business logic for captain operations
 * - Status management
 * - Location tracking
 */
class CaptainService {
  /**
   * Get captain profile
   */
  static async getCaptainProfile(captainId) {
    try {
      const captain = await CaptainRepository.findById(captainId);

      if (!captain) {
        throw new Error("Captain not found");
      }

      logger.debug("[CaptainService] Captain profile fetched", { captainId });
      return captain;
    } catch (error) {
      logger.error("[CaptainService] Error getting captain profile", error, {
        captainId,
      });
      throw error;
    }
  }

  /**
   * Update captain status
   */
  static async updateCaptainStatus(captainId, status) {
    try {
      if (!Object.values(CAPTAIN_STATUS).includes(status)) {
        throw new Error("Invalid status");
      }

      const updated = await CaptainRepository.updateStatus(captainId, status);
      logger.info("[CaptainService] Captain status updated", {
        captainId,
        status,
      });

      return updated;
    } catch (error) {
      logger.error("[CaptainService] Error updating status", error, {
        captainId,
        status,
      });
      throw error;
    }
  }

  /**
   * Go online (mark captain as active)
   */
  static async goOnline(captainId, socketId) {
    try {
      const updated = await CaptainRepository.updateStatus(
        captainId,
        CAPTAIN_STATUS.ACTIVE,
      );

      // Update socket ID in database
      await CaptainRepository.updateLocation(
        captainId,
        updated.location?.latitude || 0,
        updated.location?.longitude || 0,
        socketId,
      );

      logger.info("[CaptainService] Captain went online", { captainId });
      return updated;
    } catch (error) {
      logger.error("[CaptainService] Error going online", error, { captainId });
      throw error;
    }
  }

  /**
   * Go offline
   */
  static async goOffline(captainId) {
    try {
      const updated = await CaptainRepository.updateStatus(
        captainId,
        CAPTAIN_STATUS.OFFLINE,
      );
      logger.info("[CaptainService] Captain went offline", { captainId });
      return updated;
    } catch (error) {
      logger.error("[CaptainService] Error going offline", error, {
        captainId,
      });
      throw error;
    }
  }

  /**
   * Check if captain is available
   */
  static async isAvailable(captainId) {
    try {
      return await CaptainRepository.isAvailable(captainId);
    } catch (error) {
      logger.error("[CaptainService] Error checking availability", error, {
        captainId,
      });
      return false;
    }
  }

  /**
   * Get active captains (for admin/monitoring)
   */
  static async getActiveCaptains(page = 1, limit = 20) {
    try {
      const captains = await CaptainRepository.getActiveCaptains(page, limit);
      logger.debug("[CaptainService] Active captains fetched", {
        count: captains.data.length,
      });
      return captains;
    } catch (error) {
      logger.error("[CaptainService] Error getting active captains", error);
      throw error;
    }
  }

  /**
   * Mark all captains as offline (on server restart)
   */
  static async markAllOfflineOnRestart() {
    try {
      await CaptainRepository.markAllOffline();
      logger.info("[CaptainService] All captains marked offline after restart");
    } catch (error) {
      logger.error("[CaptainService] Error marking captains offline", error);
    }
  }

  /**
   * Get all available captains (online and not in a ride)
   */
  static async getAvailableCaptains() {
    try {
      const result = await CaptainRepository.getActiveCaptains(1, 100); // Get first 100 active captains
      const available = result?.data || [];
      logger.debug("[CaptainService] Available captains fetched", {
        count: available.length,
      });
      return available;
    } catch (error) {
      logger.error("[CaptainService] Error getting available captains", error);
      // Return empty array instead of throwing to avoid breaking ride creation
      return [];
    }
  }
}

export default CaptainService;

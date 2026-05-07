import logger from "../utils/logger.js";
import CaptainRepository from "../repositories/captain.repository.js";
import CacheService from "../services/cache.service.js";
import { LOCATION_BATCH } from "../config/constants.js";

/**
 * Location Event Handler
 * Handles captain location updates efficiently
 * - Batches updates to reduce DB writes
 * - Caches locations in Redis
 * - Broadcasts to nearby users
 */
class LocationEventHandler {
  constructor() {
    this.locationUpdateQueue = [];
    this.processingBatch = false;
    this.batchTimer = null;
  }

  /**
   * Queue location update (prevents DB overload)
   */
  async queueLocationUpdate(
    captainId,
    latitude,
    longitude,
    socketId,
    socketManager,
  ) {
    try {
      if (this.locationUpdateQueue.length >= LOCATION_BATCH.MAX_QUEUE_SIZE) {
        logger.warn("[LocationHandler] Queue overflow, dropping update", {
          captainId,
        });
        return;
      }

      this.locationUpdateQueue.push({
        captainId,
        latitude,
        longitude,
        socketId,
        timestamp: Date.now(),
      });

      // Start batch processing if not already running
      if (
        !this.processingBatch &&
        this.locationUpdateQueue.length >= LOCATION_BATCH.BATCH_SIZE
      ) {
        await this.processBatch(socketManager);
      } else if (!this.batchTimer) {
        // Schedule batch processing after interval
        this.batchTimer = setTimeout(
          () => this.processBatch(socketManager),
          LOCATION_BATCH.BATCH_INTERVAL_MS,
        );
      }
    } catch (error) {
      logger.error("Error queueing location update", error, { captainId });
    }
  }

  /**
   * Process batched location updates
   */
  async processBatch(socketManager) {
    if (this.processingBatch || this.locationUpdateQueue.length === 0) {
      return;
    }

    this.processingBatch = true;
    clearTimeout(this.batchTimer);
    this.batchTimer = null;

    try {
      const batch = this.locationUpdateQueue.splice(
        0,
        LOCATION_BATCH.BATCH_SIZE,
      );
      logger.debug(
        `[LocationHandler] Processing batch of ${batch.length} location updates`,
      );

      // Update all locations in parallel
      const updatePromises = batch.map((update) =>
        this.updateSingleLocation(update, socketManager),
      );

      const results = await Promise.allSettled(updatePromises);

      const successful = results.filter((r) => r.status === "fulfilled").length;
      logger.info(
        `[LocationHandler] Batch processed: ${successful}/${batch.length} successful`,
      );
    } catch (error) {
      logger.error("Error processing location batch", error);
    } finally {
      this.processingBatch = false;

      // Schedule next batch if queue has items
      if (this.locationUpdateQueue.length > 0) {
        this.batchTimer = setTimeout(
          () => this.processBatch(socketManager),
          LOCATION_BATCH.BATCH_INTERVAL_MS,
        );
      }
    }
  }

  /**
   * Update single captain location
   */
  async updateSingleLocation(update, socketManager) {
    const { captainId, latitude, longitude, socketId } = update;

    try {
      // Update in database
      await CaptainRepository.updateLocation(
        captainId,
        latitude,
        longitude,
        socketId,
      );

      // Cache in Redis (short TTL - 30 seconds)
      await CacheService.setCaptainLocation(captainId, {
        latitude,
        longitude,
        socketId,
      });

      // Broadcast to users in the ride (if in active ride)
      await this.broadcastLocationToRideUsers(
        captainId,
        latitude,
        longitude,
        socketManager,
      );

      logger.debug("[LocationHandler] Location updated", { captainId });
    } catch (error) {
      logger.error("[LocationHandler] Error updating location", error, {
        captainId,
      });
    }
  }

  /**
   * Broadcast captain location to users in the same ride
   */
  async broadcastLocationToRideUsers(
    captainId,
    latitude,
    longitude,
    socketManager,
  ) {
    try {
      // Find active ride for this captain (from DB or cache)
      // Then emit location to all users in that ride
      const locationData = {
        captainId,
        latitude,
        longitude,
        timestamp: Date.now(),
      };

      // Use room-based broadcasting for efficiency
      await socketManager.emitToRoom(
        `ride:captain:${captainId}`,
        "captain-location-updated",
        locationData,
      );
    } catch (error) {
      logger.debug(
        "[LocationHandler] No active ride to broadcast location",
        error,
      );
    }
  }

  /**
   * Get captain location from cache
   */
  async getCaptainLocation(captainId) {
    try {
      return await CacheService.getCaptainLocation(captainId);
    } catch (error) {
      logger.error("[LocationHandler] Error getting cached location", error, {
        captainId,
      });
      return null;
    }
  }

  /**
   * Get multiple captain locations efficiently
   */
  async getMultipleCaptainLocations(captainIds) {
    try {
      const locations = await Promise.all(
        captainIds.map((id) => this.getCaptainLocation(id)),
      );
      return locations.filter((l) => l !== null);
    } catch (error) {
      logger.error("[LocationHandler] Error getting multiple locations", error);
      return [];
    }
  }

  /**
   * Clear location batch (on shutdown)
   */
  async clearQueue() {
    clearTimeout(this.batchTimer);
    this.locationUpdateQueue = [];
    logger.info("[LocationHandler] Location queue cleared");
  }

  /**
   * Get queue stats
   */
  getQueueStats() {
    return {
      queueSize: this.locationUpdateQueue.length,
      isProcessing: this.processingBatch,
      maxQueueSize: LOCATION_BATCH.MAX_QUEUE_SIZE,
    };
  }
}

export default new LocationEventHandler();

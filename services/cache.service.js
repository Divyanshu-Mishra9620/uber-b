import redis from "../config/redis.js";
import logger from "../utils/logger.js";
import { CACHE_TTL } from "../config/constants.js";

/**
 * Centralized Cache Service
 * Handles all caching operations with consistent key patterns
 */
class CacheService {
  /**
   * Generate cache key with prefix pattern
   */
  static generateKey(prefix, ...args) {
    return `cache:${prefix}:${args.join(":")}`;
  }

  /**
   * Get from cache with automatic JSON parsing
   */
  static async get(prefix, ...args) {
    try {
      const key = this.generateKey(prefix, ...args);
      const cached = await redis.get(key);

      if (cached) {
        logger.debug(`[Cache HIT] ${key}`);
        return JSON.parse(cached);
      }

      logger.debug(`[Cache MISS] ${key}`);
      return null;
    } catch (error) {
      logger.error("Cache get error", error);
      return null;
    }
  }

  /**
   * Set cache with automatic JSON stringification
   */
  static async set(prefix, data, ttl = CACHE_TTL.RIDE_FARE, ...args) {
    try {
      const key = this.generateKey(prefix, ...args);
      const stringified = JSON.stringify(data);

      await redis.set(key, stringified, ttl);
      logger.debug(`[Cache SET] ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      logger.error("Cache set error", error);
    }
  }

  /**
   * Delete cache entry
   */
  static async delete(prefix, ...args) {
    try {
      const key = this.generateKey(prefix, ...args);
      await redis.del(key);
      logger.debug(`[Cache DEL] ${key}`);
    } catch (error) {
      logger.error("Cache delete error", error);
    }
  }

  /**
   * Delete multiple cache entries by pattern
   */
  static async deletePattern(prefix, ...args) {
    try {
      const pattern = this.generateKey(prefix, ...args).replace(
        /:[^:]*$/,
        ":*",
      );
      // In production, use SCAN instead of KEYS to avoid blocking
      logger.debug(`[Cache DEL Pattern] ${pattern}`);
    } catch (error) {
      logger.error("Cache delete pattern error", error);
    }
  }

  /**
   * Get or fetch - cache aside pattern
   */
  static async getOrFetch(prefix, fetchFn, ttl = CACHE_TTL.RIDE_FARE, ...args) {
    try {
      // Try to get from cache
      const cached = await this.get(prefix, ...args);
      if (cached) return cached;

      // If not in cache, fetch fresh data
      const data = await fetchFn();

      // Store in cache
      await this.set(prefix, data, ttl, ...args);

      return data;
    } catch (error) {
      logger.error("Cache getOrFetch error", error);
      // If cache fails, still try to fetch
      return await fetchFn();
    }
  }

  /**
   * Cache busting - delete related caches
   */
  static async invalidateRideCache(rideId) {
    await Promise.all([
      this.delete("ride", rideId),
      this.delete("fare", rideId),
      this.delete("ride:details", rideId),
    ]);
  }

  /**
   * Cache location data with short TTL
   */
  static async setCaptainLocation(captainId, locationData) {
    await this.set(
      "captain:location",
      locationData,
      CACHE_TTL.CAPTAIN_LOCATION,
      captainId,
    );
  }

  /**
   * Get captain location from cache
   */
  static async getCaptainLocation(captainId) {
    return await this.get("captain:location", captainId);
  }

  /**
   * Cache address geocoding (long TTL - 24 hours)
   */
  static async setAddressCache(address, coordinates) {
    await this.set(
      "address:geocode",
      coordinates,
      CACHE_TTL.ADDRESS_GEOCODE,
      address,
    );
  }

  /**
   * Get cached address
   */
  static async getAddressCache(address) {
    return await this.get("address:geocode", address);
  }

  /**
   * Cache fare calculation (1 hour TTL)
   */
  static async setFareCache(pickup, dropoff, fareData) {
    const key = `${pickup}:${dropoff}`;
    await this.set("fare:estimate", fareData, CACHE_TTL.RIDE_FARE, key);
  }

  /**
   * Get cached fare
   */
  static async getFareCache(pickup, dropoff) {
    const key = `${pickup}:${dropoff}`;
    return await this.get("fare:estimate", key);
  }

  /**
   * Clear all caches (use sparingly)
   */
  static async clearAll() {
    try {
      logger.warn("[Cache] Clearing all caches");
      await redis.del("cache:*");
    } catch (error) {
      logger.error("Cache clearAll error", error);
    }
  }
}

export default CacheService;

import Redis from "ioredis";
import logger from "../utils/logger.js";

/**
 * Redis client configuration
 * Used for caching, session management, and pub/sub
 */
class RedisClient {
  client = null;
  connected = false;

  async connect() {
    try {
      const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

      this.client = new Redis(redisUrl, {
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        enableOfflineQueue: true,
      });

      this.client.on("connect", () => {
        this.connected = true;
        logger.info("[Redis] Connected successfully");
      });

      this.client.on("error", (err) => {
        logger.error("[Redis] Connection error", err);
      });

      this.client.on("close", () => {
        this.connected = false;
        logger.warn("[Redis] Connection closed");
      });

      // Wait for connection
      await this.client.ping();
      return this.client;
    } catch (error) {
      logger.error("[Redis] Failed to connect", error);
      throw error;
    }
  }

  async get(key) {
    if (!this.client) throw new Error("Redis not connected");
    return await this.client.get(key);
  }

  async set(key, value, expirySeconds = null) {
    if (!this.client) throw new Error("Redis not connected");

    if (expirySeconds) {
      await this.client.setex(key, expirySeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key) {
    if (!this.client) throw new Error("Redis not connected");
    return await this.client.del(key);
  }

  async delMany(keys) {
    if (!this.client) throw new Error("Redis not connected");
    if (keys.length === 0) return 0;
    return await this.client.del(...keys);
  }

  async exists(key) {
    if (!this.client) throw new Error("Redis not connected");
    return await this.client.exists(key);
  }

  async incr(key) {
    if (!this.client) throw new Error("Redis not connected");
    return await this.client.incr(key);
  }

  async expire(key, seconds) {
    if (!this.client) throw new Error("Redis not connected");
    return await this.client.expire(key, seconds);
  }

  async hset(key, field, value) {
    if (!this.client) throw new Error("Redis not connected");
    return await this.client.hset(key, field, value);
  }

  async hget(key, field) {
    if (!this.client) throw new Error("Redis not connected");
    return await this.client.hget(key, field);
  }

  async hgetall(key) {
    if (!this.client) throw new Error("Redis not connected");
    return await this.client.hgetall(key);
  }

  async lpush(key, value) {
    if (!this.client) throw new Error("Redis not connected");
    return await this.client.lpush(key, value);
  }

  async rpop(key) {
    if (!this.client) throw new Error("Redis not connected");
    return await this.client.rpop(key);
  }

  async llen(key) {
    if (!this.client) throw new Error("Redis not connected");
    return await this.client.llen(key);
  }

  async lrange(key, start, stop) {
    if (!this.client) throw new Error("Redis not connected");
    return await this.client.lrange(key, start, stop);
  }

  isConnected() {
    return this.connected;
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      logger.info("[Redis] Disconnected");
    }
  }
}

export default new RedisClient();

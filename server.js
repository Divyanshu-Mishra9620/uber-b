import http from "node:http";
import dotenv from "dotenv";
import app from "./app.js";
import SocketManager from "./core/SocketManager.js";
import redis from "./config/redis.js";
import logger from "./utils/logger.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { setSocketManager } from "./socket-helpers.js";

// Load environment variables from .env file
dotenv.config();

const PORT = process.env.PORT || 3000;

let server;
let socketManagerInstance = null;

/**
 * Initialize server
 */
async function startServer() {
  try {
    // Connect to MongoDB
    logger.info("Connecting to MongoDB...");
    await connectDB();
    logger.info("✅ MongoDB connected");

    // Connect to Redis
    logger.info("Connecting to Redis...");
    await redis.connect();
    logger.info("✅ Redis connected");

    // Create HTTP server
    server = http.createServer(app);

    // Initialize Socket.io
    socketManagerInstance = new SocketManager(server);
    setSocketManager(socketManagerInstance);
    logger.info("✅ Socket.io initialized");

    // Start server
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
    });

    // Graceful shutdown
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    logger.error("Failed to start server", error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
async function shutdown() {
  logger.info("🛑 Shutting down gracefully...");

  try {
    // Close server
    if (server) {
      server.close(() => {
        logger.info("HTTP server closed");
      });
    }

    // Close Socket.io
    if (socketManagerInstance) {
      socketManagerInstance.getInstance().close();
      logger.info("Socket.io closed");
    }

    // Close MongoDB
    await disconnectDB();

    // Close Redis
    await redis.disconnect();
    logger.info("Redis disconnected");

    logger.info("✅ Graceful shutdown complete");
    process.exit(0);
  } catch (error) {
    logger.error("Error during shutdown", error);
    process.exit(1);
  }
}

startServer();

export const getSocketManager = () => socketManagerInstance;

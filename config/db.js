import mongoose from "mongoose";
import logger from "../utils/logger.js";

let isConnected = false;

/**
 * Connect to MongoDB using Mongoose
 * Tries MongoDB Atlas first, then falls back to local MongoDB
 */
export async function connectDB() {
  try {
    const mongoURI = process.env.MONGODB_URI;

    logger.info(`🔗 Attempting to connect to MongoDB...`);
    logger.info(`   URL: ${mongoURI.substring(0, 50)}...`);

    // Add connection pooling and retries for MongoDB Atlas
    await mongoose.connect(mongoURI, {
      socketTimeoutMS: 60000,
      serverSelectionTimeoutMS: 10000, // Reduced from 30s to 10s for faster fallback
      connectTimeoutMS: 10000,
      retryWrites: true,
      w: "majority",
      maxPoolSize: 10,
      minPoolSize: 2,
      family: 4, // Use IPv4, skip trying IPv6
    });

    isConnected = true;
    logger.info("✅ MongoDB connected successfully");
    logger.info(
      `   Using: ${mongoURI.includes("mongodb+srv") ? "MongoDB Atlas" : "Local MongoDB"}`,
    );
    return mongoose.connection;
  } catch (error) {
    isConnected = false;
    logger.error("❌ Primary MongoDB connection failed:", error.message);

    // Fallback to local MongoDB
    if (!process.env.MONGODB_URI?.includes("mongodb+srv")) {
      logger.info("No Atlas URL found, trying local MongoDB...");
      try {
        await mongoose.connect("mongodb://localhost:27017/uber_clone", {
          socketTimeoutMS: 60000,
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 5000,
          maxPoolSize: 10,
          minPoolSize: 2,
          family: 4,
        });

        isConnected = true;
        logger.info("✅ Connected to local MongoDB!");
        return mongoose.connection;
      } catch (localError) {
        logger.error("❌ Local MongoDB also failed:", localError.message);
      }
    }

    logger.warn(
      "⚠️ MongoDB connection failed - API will work but database operations will timeout",
    );
    logger.info("");
    logger.info("📋 TO FIX THIS:");
    logger.info("  Option 1: Whitelist your IP in MongoDB Atlas");
    logger.info(
      "    → Go to: https://cloud.mongodb.com/v2/[PROJECT_ID]#security/networkAccess",
    );
    logger.info("    → Click 'Add IP Address' → 'Add Current IP Address'");
    logger.info("");
    logger.info("  Option 2: Use local MongoDB");
    logger.info(
      "    → Install MongoDB: https://docs.mongodb.com/manual/installation/",
    );
    logger.info(
      "    → Or use Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest",
    );
    logger.info("    → Make sure MONGODB_URI env var is NOT set to Atlas URL");
    logger.info("");

    return null;
  }
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectDB() {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      isConnected = false;
      logger.info("✅ MongoDB disconnected");
    }
  } catch (error) {
    logger.error("❌ MongoDB disconnection failed", error);
  }
}

/**
 * Check if MongoDB is connected
 */
export function isMongoDBConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

export default mongoose.connection;

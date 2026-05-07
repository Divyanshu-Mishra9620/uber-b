#!/usr/bin/env node

/**
 * MIGRATION SCRIPT FOR PHASE 1 OPTIMIZATION
 *
 * This script helps migrate from old architecture to new optimized architecture
 * Run: node scripts/migrate-phase1.js
 */

import mongodb from "mongodb";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const indexes = [
  {
    name: "Captain Location (Geospatial)",
    collection: "captains",
    index: { location: "2dsphere" },
    options: { sparse: true },
  },
  {
    name: "Ride Pickup Location (Geospatial)",
    collection: "rides",
    index: { "pickup.location": "2dsphere" },
    options: { sparse: true },
  },
  {
    name: "Ride Dropoff Location (Geospatial)",
    collection: "rides",
    index: { "dropoff.location": "2dsphere" },
    options: { sparse: true },
  },
  {
    name: "Captain Status Index",
    collection: "captains",
    index: { status: 1 },
    options: { background: true },
  },
  {
    name: "Ride Status Index",
    collection: "rides",
    index: { status: 1 },
    options: { background: true },
  },
  {
    name: "Ride User Index",
    collection: "rides",
    index: { userId: 1 },
    options: { background: true },
  },
  {
    name: "Ride Captain Index",
    collection: "rides",
    index: { captainId: 1 },
    options: { background: true },
  },
  {
    name: "Ride Creation Date Index",
    collection: "rides",
    index: { createdAt: -1 },
    options: { background: true },
  },
  {
    name: "Captain Status + Location (Compound)",
    collection: "captains",
    index: { status: 1, location: "2dsphere" },
    options: { sparse: true, background: true },
  },
  {
    name: "Ride Status + Date (Compound)",
    collection: "rides",
    index: { status: 1, createdAt: -1 },
    options: { background: true },
  },
];

async function createIndexes() {
  let client;

  try {
    logger.info("Connecting to MongoDB...");
    client = new mongodb.MongoClient(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await client.connect();
    const db = client.db();

    logger.info("🚀 Starting index creation...");
    logger.info(`Total indexes to create: ${indexes.length}`);

    let successful = 0;
    let failed = 0;

    for (const indexConfig of indexes) {
      try {
        const collection = db.collection(indexConfig.collection);

        logger.info(`Creating: ${indexConfig.name}`);
        await collection.createIndex(indexConfig.index, indexConfig.options);

        logger.info(`✅ Created: ${indexConfig.name}`);
        successful++;
      } catch (error) {
        logger.error(`❌ Failed to create: ${indexConfig.name}`, error);
        failed++;
      }
    }

    logger.info(`\n📊 RESULTS:`);
    logger.info(`✅ Successful: ${successful}`);
    logger.info(`❌ Failed: ${failed}`);
    logger.info(`Total: ${successful + failed}`);

    if (failed === 0) {
      logger.info("\n🎉 All indexes created successfully!");
    }
  } catch (error) {
    logger.error("Migration failed", error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      logger.info("MongoDB connection closed");
    }
  }
}

/**
 * Mark all captains as offline (after server restart)
 */
async function markAllCaptainsOffline() {
  let client;

  try {
    logger.info("Connecting to MongoDB...");
    client = new mongodb.MongoClient(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await client.connect();
    const db = client.db();

    logger.info("Marking all captains as offline...");
    const result = await db.collection("captains").updateMany(
      { status: { $ne: "offline" } },
      {
        $set: {
          status: "offline",
          socketId: null,
          lastStatusUpdate: new Date(),
        },
      },
    );

    logger.info(`✅ Marked ${result.modifiedCount} captains as offline`);
  } catch (error) {
    logger.error("Failed to mark captains offline", error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

/**
 * Run all migrations
 */
async function runAllMigrations() {
  try {
    logger.info("====== PHASE 1 MIGRATION ======\n");

    logger.info("STEP 1: Creating database indexes...");
    await createIndexes();

    logger.info("\n\nSTEP 2: Marking all captains as offline...");
    await markAllCaptainsOffline();

    logger.info("\n✅ PHASE 1 MIGRATION COMPLETE!\n");
    logger.info("Next steps:");
    logger.info("1. Update environment variables");
    logger.info(
      "2. Install new dependencies: npm install helmet compression ioredis express-validator",
    );
    logger.info("3. Start the server: npm start");
    logger.info("4. Monitor logs and performance");

    process.exit(0);
  } catch (error) {
    logger.error("Migration error", error);
    process.exit(1);
  }
}

// Run migrations
runAllMigrations();

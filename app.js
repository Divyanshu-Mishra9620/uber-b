import express from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import cookieParser from "cookie-parser";
import logger from "./utils/logger.js";
import userRoutes from "./routes/user.routes.js";
import captainRoutes from "./routes/captain.routes.js";
import rideRoutes from "./routes/ride.routes.js";
import mapsRoutes from "./routes/maps.routes.js";

const app = express();

/**
 * CORS: Enable cross-origin requests
 * Allow frontend to communicate with backend
 */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:3000",
      process.env.FRONTEND_URL || "http://localhost:5173",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

/**
 * SECURITY: Helmet middleware
 * Sets various HTTP headers for security
 */
app.use(helmet());

/**
 * COMPRESSION: Compress responses
 * Reduces bandwidth usage significantly
 */
app.use(compression());

/**
 * BODY PARSER: Parse request bodies
 */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

/**
 * COOKIE PARSER: Parse cookies from requests
 */
app.use(cookieParser());

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info(
      `[${req.method}] ${req.path} - ${res.statusCode} - ${duration}ms`,
    );
  });
  next();
});

/**
 * HEALTH CHECK: Basic health endpoint
 */
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * DB CHECK: Test database connection
 */
app.get("/db-check", async (req, res) => {
  try {
    const mongooseConnection = require("mongoose").connection;
    if (mongooseConnection.readyState === 1) {
      res.json({
        status: "connected",
        database: "MongoDB",
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: "disconnected",
        database: "MongoDB",
        readyState: mongooseConnection.readyState,
      });
    }
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

/**
 * ROOT ENDPOINT
 */
app.get("/", (req, res) => {
  res.json({
    message: "Uber Clone API - Phase 1 Optimized",
    version: "1.0.0",
    status: "running",
  });
});

/**
 * API ROUTES
 */
app.use("/users", userRoutes);
app.use("/captains", captainRoutes);
app.use("/rides", rideRoutes);
app.use("/maps", mapsRoutes);

/**
 * 404 Handler
 */
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
    path: req.path,
  });
});

/**
 * GLOBAL ERROR HANDLER
 * Must be last middleware
 */
app.use((err, req, res, next) => {
  logger.error("Error:", err);
  res.status(err.statusCode || 500).json({
    status: "error",
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

export default app;

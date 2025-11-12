const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const express = require("express");
const { connectToDb } = require("./db/db");
const userRoute = require("./routes/user.routes");
const cookieParser = require("cookie-parser");
const captainRoute = require("./routes/captain.routes");
const mapsRoute = require("./routes/maps.routes");
const rideRoute = require("./routes/ride.routes");

const app = express();
connectToDb();

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
      "https://uber-b-4vyh.vercel.app",
    ];

    // Allow requests with no origin (like mobile apps, curl requests)
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      origin.includes("vercel.app") ||
      origin.includes("onrender.com")
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/users", userRoute);
app.use("/captains", captainRoute);
app.use("/maps", mapsRoute);
app.use("/rides", rideRoute);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 3000,
  });
});

// Debug endpoint - Check environment variables (only for development)
app.get("/debug/env", (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ message: "Forbidden" });
  }

  res.status(200).json({
    PORT: process.env.PORT ? "✅ SET" : "❌ NOT SET",
    JWT_SECRET: process.env.JWT_SECRET ? "✅ SET" : "❌ NOT SET",
    DB_CONNECT: process.env.DB_CONNECT
      ? "✅ SET (first 50 chars): " +
        process.env.DB_CONNECT.substring(0, 50) +
        "..."
      : "❌ NOT SET",
    NODE_ENV: process.env.NODE_ENV || "development",
  });
});

app.get("/", (req, res) => {
  res.send("Hello World");
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Global error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

module.exports = app;

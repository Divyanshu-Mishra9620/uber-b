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

app.get("/", (req, res) => {
  res.send("Hello World");
});

module.exports = app;

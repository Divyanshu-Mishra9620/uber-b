const mongoose = require("mongoose");

function connectToDb() {
  const dbUrl = process.env.DB_CONNECT;

  if (!dbUrl) {
    console.error("❌ FATAL: DB_CONNECT environment variable is not set!");
    console.error(
      "📋 Available env vars:",
      Object.keys(process.env).filter((k) => !k.includes("SECRET"))
    );
    process.exit(1);
  }

  console.log(
    "🔗 Connecting to MongoDB with URL:",
    dbUrl.substring(0, 50) + "..."
  );

  mongoose
    .connect(dbUrl, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })
    .then(() => {
      console.log("✅ MongoDB Connected Successfully");
    })
    .catch((err) => {
      console.error("❌ MongoDB Connection Error:", err.message);
      console.error("📋 Full error:", err);
      // Retry connection after 5 seconds
      setTimeout(connectToDb, 5000);
    });
}

module.exports = { connectToDb };

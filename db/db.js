const mongoose = require("mongoose");

function connectToDb() {
  mongoose
    .connect(process.env.DB_CONNECT)
    .then(() => {
      console.log("✅ MongoDB Connected Successfully");
    })
    .catch((err) => {
      console.error("❌ MongoDB Connection Error:", err.message);
      // Retry connection after 5 seconds
      setTimeout(connectToDb, 5000);
    });
}

module.exports = { connectToDb };

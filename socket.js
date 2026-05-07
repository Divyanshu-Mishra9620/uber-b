import { Server } from "socket.io";
import userModel from "./models/user.model.js";
import captainModel from "./models/captian.model.js";

// we want to connect both user and captain to same socket instance so as captain and user connects we will save their socket id in database so that we can send notification to specific user or captain

let io;

function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: function (origin, callback) {
        const allowedOrigins = [
          "http://localhost:5173",
          "http://localhost:5174",
          "http://localhost:3000",
          "https://uber-b-4vyh.vercel.app",
        ];

        // Allow if origin matches, or if it contains vercel.app/localhost/onrender.com
        const isAllowed =
          !origin ||
          allowedOrigins.includes(origin) ||
          origin.includes("vercel.app") ||
          origin.includes("localhost") ||
          origin.includes("onrender.com");

        if (isAllowed) {
          console.log(`✅ Socket.io CORS allowed for origin: ${origin}`);
          callback(null, true);
        } else {
          console.error(`❌ Socket.io CORS blocked origin: ${origin}`);
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    socket.on("join", async (data) => {
      const { userId, userType } = data;

      console.log(
        `📍 Join event received: userId=${userId}, type=${userType}, socketId=${socket.id}`,
      );
      try {
        if (userType === "user") {
          await userModel.findByIdAndUpdate(userId, { socketId: socket.id });
          const updatedUser = await userModel.findById(userId);
          console.log(
            `✅ User ${userId} socketId updated and verified: ${updatedUser.socketId}`,
          );
        } else if (userType === "captain") {
          await captainModel.findByIdAndUpdate(userId, { socketId: socket.id });
          const updatedCaptain = await captainModel.findById(userId);
          console.log(
            `✅ Captain ${userId} socketId updated and verified: ${updatedCaptain.socketId}`,
          );
        }
      } catch (error) {
        console.error(`❌ Error saving socketId for ${userId}:`, error.message);
        socket.emit("error", { message: "Failed to save socket connection" });
      }
    });

    socket.on("update-location-captain", async (data) => {
      const { userId, location } = data;

      if (
        !location ||
        location.ltd === undefined ||
        location.lng === undefined
      ) {
        console.error(`❌ Invalid location data for captain ${userId}`);
        return socket.emit("error", { message: "Invalid location data" });
      }

      try {
        await captainModel.findByIdAndUpdate(userId, {
          location: {
            type: "Point",
            coordinates: [location.lng, location.ltd], // GeoJSON format: [longitude, latitude]
          },
        });

        // Verify location was saved
        const updatedCaptain = await captainModel.findById(userId);
        console.log(
          `✅ Captain ${userId} location updated and verified: [${updatedCaptain.location.coordinates[0]}, ${updatedCaptain.location.coordinates[1]}]`,
        );
      } catch (error) {
        console.error(`❌ Error updating captain location:`, error.message);
        socket.emit("error", { message: "Failed to update location" });
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(`⚠️ Client disconnected: ${socket.id} - Reason: ${reason}`);
    });

    socket.on("connect_error", (error) => {
      console.error(`❌ Socket.io connection error:`, error.message);
    });
  });
}

const sendMessageToSocketId = (socketId, messageObject) => {
  console.log(messageObject);

  if (io) {
    io.to(socketId).emit(messageObject.event, messageObject.data);
  } else {
    console.log("Socket.io not initialized.");
  }
};

export { initializeSocket, sendMessageToSocketId };

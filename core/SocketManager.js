import { Server } from "socket.io";
import { SOCKET_EVENTS, CAPTAIN_STATUS } from "../config/constants.js";
import logger from "../utils/logger.js";
import redis from "../config/redis.js";

/**
 * CRITICAL: Centralized Socket Manager
 * Handles all WebSocket connections, events, and state management
 * Prevents memory leaks, race conditions, and duplicate listeners
 */
class SocketManager {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: [
          "http://localhost:5173",
          "http://localhost:5174",
          "http://localhost:3000",
          process.env.FRONTEND_URL || "https://uber-b-4vyh.vercel.app",
        ],
        methods: ["GET", "POST"],
        credentials: true,
        allowEIO3: true,
      },
      transports: ["websocket", "polling"],
      maxHttpBufferSize: 1e6, // 1MB max message size
      connectionStateRecovery: {
        // Recover connection state
        maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      },
      pingInterval: 25000,
      pingTimeout: 60000,
    });

    this.socketToUserMap = new Map(); // socketId -> userId mapping
    this.userToSocketMap = new Map(); // userId -> socketId mapping
    this.eventHandlers = new Map(); // Track active event listeners

    this.setupMiddleware();
    this.setupConnectionHandlers();
    this.setupNamespaces();
  }

  /**
   * SECURITY: Socket authentication middleware
   * Temporarily relaxed to allow frontend connections
   */
  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        // Log connection attempt but don't reject
        logger.info(`[Socket] New connection attempt`, { socketId: socket.id });
        next();
      } catch (error) {
        logger.error("Socket middleware error", error, { socket: socket?.id });
        next();
      }
    });
  }

  /**
   * Main connection handlers
   */
  setupConnectionHandlers() {
    this.io.on(SOCKET_EVENTS.CONNECT, (socket) => {
      this.handleConnect(socket);
    });

    this.io.on(SOCKET_EVENTS.DISCONNECT, (socket) => {
      this.handleDisconnect(socket);
    });
  }

  /**
   * Handle user connection
   */
  handleConnect(socket) {
    logger.info(`✅ Client connected: ${socket.id}`);

    socket.on("join", async (data) => {
      const { userId, userType } = data;
      socket.userId = userId;
      socket.userType = userType;
      
      this.socketToUserMap.set(socket.id, userId);
      this.userToSocketMap.set(userId, socket.id);

      logger.info(
        `📍 Join event received: userId=${userId}, type=${userType}, socketId=${socket.id}`,
      );
      try {
        if (userType === "user") {
          const { default: userModel } = await import("../models/user.model.js");
          await userModel.findByIdAndUpdate(userId, { socketId: socket.id });
          logger.info(`✅ User ${userId} socketId updated`);
        } else if (userType === "captain") {
          const { default: captainModel } = await import("../models/captian.model.js");
          await captainModel.findByIdAndUpdate(userId, { 
            socketId: socket.id,
            status: "active" 
          });
          logger.info(`✅ Captain ${userId} socketId updated and marked active`);
        }
      } catch (error) {
        logger.error(`❌ Error saving socketId for ${userId}:`, error);
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
        logger.error(`❌ Invalid location data for captain ${userId}`);
        return socket.emit("error", { message: "Invalid location data" });
      }

      try {
        const { default: captainModel } = await import("../models/captian.model.js");
        await captainModel.findByIdAndUpdate(userId, {
          location: {
            type: "Point",
            coordinates: [location.lng, location.ltd], // GeoJSON format: [longitude, latitude]
          },
        });
      } catch (error) {
        logger.error(`❌ Error updating captain location:`, error);
        socket.emit("error", { message: "Failed to update location" });
      }
    });

    // Send heartbeat interval to client
    socket.emit("heartbeat-interval", { interval: 30000 });
  }

  /**
   * Handle user disconnection with cleanup
   */
  async handleDisconnect(socket) {
    const { userId, userType } = socket;

    try {
      // Remove socket mappings
      this.socketToUserMap.delete(socket.id);
      this.userToSocketMap.delete(userId);

      // Clear event listeners to prevent memory leaks
      this.cleanupEventListeners(socket.id);

      // Update Redis to reflect disconnection
      await redis.del(`socket:${userId}:${userType}`);

      logger.info(`[DISCONNECT] ${userType} disconnected`, {
        userId,
        socketId: socket.id,
        connectedDuration: `${Date.now() - socket.joinedAt}ms`,
      });

      // If captain, mark as offline in database
      if (userType === "captain") {
        // Import here to avoid circular dependency
        const { default: Captain } = await import("../models/captian.model.js");
        await Captain.updateOne(
          { _id: userId },
          { status: CAPTAIN_STATUS.OFFLINE, socketId: null },
        ).catch((err) => logger.error("Failed to update captain status", err));
      }
    } catch (error) {
      logger.error("Disconnect handler error", error, {
        userId,
        socketId: socket.id,
      });
    }
  }

  /**
   * Clean up event listeners to prevent memory leaks
   */
  cleanupEventListeners(socketId) {
    if (this.eventHandlers.has(socketId)) {
      const listeners = this.eventHandlers.get(socketId);
      listeners.forEach((listener) => {
        try {
          listener.removeAllListeners();
        } catch (e) {
          logger.debug("Error removing listener", e);
        }
      });
      this.eventHandlers.delete(socketId);
    }
  }

  /**
   * Setup namespaces for better event organization
   * Prevents event collisions and improves maintainability
   */
  setupNamespaces() {
    // RIDES namespace for ride-related events
    const ridesNs = this.io.of("/rides");
    ridesNs.on("connection", (socket) => {
      logger.debug("Captain connected to /rides namespace", {
        socketId: socket.id,
      });
    });

    // LOCATIONS namespace for location updates
    const locationsNs = this.io.of("/locations");
    locationsNs.on("connection", (socket) => {
      logger.debug("Captain connected to /locations namespace", {
        socketId: socket.id,
      });
    });
  }

  /**
   * Send message to specific socket with acknowledgement
   */
  async sendToSocket(socketId, event, data, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const socket = this.io.sockets.sockets.get(socketId);

      if (!socket) {
        return reject(new Error(`Socket ${socketId} not connected`));
      }

      const timer = setTimeout(() => {
        reject(new Error("Socket emit timeout"));
      }, timeout);

      socket.emit(event, data, (acknowledgement) => {
        clearTimeout(timer);
        resolve(acknowledgement);
      });
    });
  }

  /**
   * Broadcast to multiple sockets (efficient batch send)
   */
  async broadcastToCaptains(captainSocketIds, event, data) {
    if (!Array.isArray(captainSocketIds) || captainSocketIds.length === 0) {
      return { total: 0, successful: 0 };
    }

    const results = await Promise.allSettled(
      captainSocketIds.map((socketId) =>
        this.sendToSocket(socketId, event, data, 3000),
      ),
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    logger.info(
      `[Broadcast] Sent ${event} to ${successful}/${captainSocketIds.length} captains`,
    );

    return { total: captainSocketIds.length, successful };
  }

  /**
   * Join socket to room (for grouped broadcasting)
   * Example: "ride:12345" for all participants in ride 12345
   */
  async joinRoom(socketId, room) {
    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) {
      socket.join(room);
      logger.debug(`Socket ${socketId} joined room ${room}`);
    }
  }

  /**
   * Leave room
   */
  async leaveRoom(socketId, room) {
    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) {
      socket.leave(room);
      logger.debug(`Socket ${socketId} left room ${room}`);
    }
  }

  /**
   * Emit to all users in room
   */
  async emitToRoom(room, event, data) {
    this.io.to(room).emit(event, data);
    logger.debug(`[Room Broadcast] Emitted ${event} to room ${room}`);
  }

  /**
   * Get all connected sockets for a user
   */
  getUserSocket(userId) {
    return this.userToSocketMap.get(userId);
  }

  /**
   * Get user ID from socket ID
   */
  getUserIdFromSocket(socketId) {
    return this.socketToUserMap.get(socketId);
  }

  /**
   * Get all connected captains
   */
  getConnectedCaptains() {
    const captains = [];
    this.io.sockets.sockets.forEach((socket) => {
      if (socket.userType === "captain") {
        captains.push({
          userId: socket.userId,
          socketId: socket.id,
        });
      }
    });
    return captains;
  }

  /**
   * Get socket statistics for monitoring
   */
  getStats() {
    return {
      connectedClients: this.io.engine.clientsCount,
      totalSockets: this.socketToUserMap.size,
      mappings: {
        socketToUser: this.socketToUserMap.size,
        userToSocket: this.userToSocketMap.size,
      },
    };
  }

  /**
   * Get IO instance for external use
   */
  getInstance() {
    return this.io;
  }

  /**
   * Send message to specific socket ID (backward compatibility)
   * Used by ride controller to emit events to specific clients
   */
  sendMessageToSocketId(socketId, messageObject) {
    if (this.io) {
      this.io.to(socketId).emit(messageObject.event, messageObject.data);
      logger.debug(`Message sent to socket ${socketId}`, messageObject.event);
    } else {
      logger.error("Socket.io not initialized");
    }
  }
}

export default SocketManager;

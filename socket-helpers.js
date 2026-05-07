import logger from "./utils/logger.js";

let socketManagerInstance = null;

/**
 * Set the socket manager instance
 * Called from server.js after initialization
 */
export const setSocketManager = (instance) => {
  socketManagerInstance = instance;
};

/**
 * Send message to specific socket ID
 * Wrapper around SocketManager for backward compatibility
 * @param {string} socketId - The socket ID to send to
 * @param {object} messageObject - Object with event and data
 */
export const sendMessageToSocketId = (socketId, messageObject) => {
  try {
    if (socketManagerInstance) {
      socketManagerInstance.sendMessageToSocketId(socketId, messageObject);
    } else {
      logger.error("SocketManager not initialized");
    }
  } catch (error) {
    logger.error("Error sending message to socket", error);
  }
};

export default { sendMessageToSocketId, setSocketManager };

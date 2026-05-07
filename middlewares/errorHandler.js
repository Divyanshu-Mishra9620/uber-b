import { HTTP_STATUS, API_STATUS } from "../config/constants.js";
import logger from "../utils/logger.js";

/**
 * Global error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  logger.error("Request error", err, {
    method: req.method,
    url: req.url,
    userId: req.user?.id,
  });

  // Default error response
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = err.message || "Internal server error";
  let status = API_STATUS.ERROR;

  // Handle specific error types
  if (err.name === "ValidationError") {
    statusCode = HTTP_STATUS.UNPROCESSABLE_ENTITY;
    status = API_STATUS.VALIDATION_ERROR;
    message = err.message;
  }

  if (err.name === "CastError") {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = "Invalid ID format";
  }

  if (err.name === "JsonWebTokenError") {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    status = API_STATUS.UNAUTHORIZED;
    message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    status = API_STATUS.UNAUTHORIZED;
    message = "Token expired";
  }

  // Prevent exposing internal error details in production
  if (
    process.env.NODE_ENV === "production" &&
    statusCode === HTTP_STATUS.INTERNAL_SERVER_ERROR
  ) {
    message = "Something went wrong. Please try again later.";
  }

  res.status(statusCode).json({
    statusCode,
    status,
    message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === "development" && { error: err.stack }),
  });
};

export default errorHandler;

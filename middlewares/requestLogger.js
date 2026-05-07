import logger from "../utils/logger.js";

/**
 * Request logging middleware
 * Tracks all incoming requests with timing and metadata
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const requestId =
    req.headers["x-request-id"] || `${Date.now()}-${Math.random()}`;

  req.requestId = requestId;

  // Log incoming request
  logger.debug(`[${req.method}] ${req.path}`, {
    requestId,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    userId: req.user?.id,
  });

  // Override res.json to log response
  const originalJson = res.json.bind(res);
  res.json = function (data) {
    const duration = Date.now() - startTime;

    logger.info(`[${req.method}] ${req.path} - ${res.statusCode}`, {
      requestId,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id,
    });

    return originalJson(data);
  };

  next();
};

export default requestLogger;

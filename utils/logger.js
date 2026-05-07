/**
 * Centralized Logger Utility
 * Provides structured logging across the application
 */

const LOG_LEVELS = {
  ERROR: "ERROR",
  WARN: "WARN",
  INFO: "INFO",
  DEBUG: "DEBUG",
};

const colors = {
  ERROR: "\x1b[31m", // Red
  WARN: "\x1b[33m", // Yellow
  INFO: "\x1b[36m", // Cyan
  DEBUG: "\x1b[35m", // Magenta
  RESET: "\x1b[0m",
};

class Logger {
  constructor(module = "APP") {
    this.module = module;
  }

  formatLog(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const color = colors[level] || "";
    const reset = colors.RESET;

    const log = {
      timestamp,
      level,
      module: this.module,
      message,
      ...(Object.keys(data).length > 0 && { data }),
    };

    return {
      log,
      formatted: `${color}[${timestamp}] [${level}] [${this.module}] ${message}${reset}`,
    };
  }

  info(message, data = {}) {
    const { formatted } = this.formatLog(LOG_LEVELS.INFO, message, data);
    console.log(formatted);
    if (data && Object.keys(data).length > 0) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  error(message, error = null, data = {}) {
    const { formatted } = this.formatLog(LOG_LEVELS.ERROR, message, {
      error,
      ...data,
    });
    console.error(formatted);
    if (error?.stack) {
      console.error(error.stack);
    }
    if (data && Object.keys(data).length > 0) {
      console.error(JSON.stringify(data, null, 2));
    }
  }

  warn(message, data = {}) {
    const { formatted } = this.formatLog(LOG_LEVELS.WARN, message, data);
    console.warn(formatted);
    if (data && Object.keys(data).length > 0) {
      console.warn(JSON.stringify(data, null, 2));
    }
  }

  debug(message, data = {}) {
    if (
      process.env.DEBUG_MODE === "true" ||
      process.env.NODE_ENV === "development"
    ) {
      const { formatted } = this.formatLog(LOG_LEVELS.DEBUG, message, data);
      console.log(formatted);
      if (data && Object.keys(data).length > 0) {
        console.log(JSON.stringify(data, null, 2));
      }
    }
  }

  // Request/Response logging
  logRequest(method, url, query = {}, body = {}) {
    this.debug(`${method} ${url}`, { query, body });
  }

  logResponse(method, url, statusCode, duration) {
    this.info(`${method} ${url} - ${statusCode}`, {
      duration: `${duration}ms`,
    });
  }
}

export default new Logger("BACKEND");

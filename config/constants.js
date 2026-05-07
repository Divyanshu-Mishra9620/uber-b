// Socket Events
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  ERROR: "error",

  // User events
  USER_JOIN: "join",
  USER_LOCATION_UPDATE: "update-location-captain",

  // Ride events
  NEW_RIDE: "new-ride",
  RIDE_CONFIRMED: "ride-confirmed",
  RIDE_STARTED: "ride-started",
  RIDE_ENDED: "ride-ended",

  // Status events
  RIDE_ACCEPTED: "ride-accepted",
  RIDE_CANCELLED: "ride-cancelled",
};

// API Response Status
export const API_STATUS = {
  SUCCESS: "success",
  ERROR: "error",
  VALIDATION_ERROR: "validation_error",
  UNAUTHORIZED: "unauthorized",
  NOT_FOUND: "not_found",
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// Cache TTL (seconds)
export const CACHE_TTL = {
  RIDE_FARE: 3600, // 1 hour
  CAPTAIN_LOCATION: 30, // 30 seconds
  ADDRESS_GEOCODE: 86400, // 24 hours
  USER_SESSION: 86400, // 24 hours
  DISTANCE_CACHE: 3600, // 1 hour
};

// Location Update Batch Settings
export const LOCATION_BATCH = {
  BATCH_SIZE: 50, // Process 50 updates per batch
  BATCH_INTERVAL_MS: 1000, // Every 1 second
  MAX_QUEUE_SIZE: 5000, // Max queued updates
};

// Search Radius (meters)
export const SEARCH_RADIUS = {
  INITIAL: 1000, // 1km
  MAX: 5000, // 5km
  EXPANSION_STEP: 1000, // Expand by 1km
};

// API Timeouts (ms)
export const TIMEOUTS = {
  NOMINATIM: 8000, // Address geocoding
  OSRM: 10000, // Distance calculation
  MAPS_SERVICE: 12000, // Overall maps service
  DB_OPERATION: 5000, // Database operation
  EXTERNAL_API: 10000, // External API calls
};

// Rate Limiting
export const RATE_LIMITS = {
  CREATE_RIDE: { points: 10, duration: 60 }, // 10 rides/min
  GET_FARE: { points: 30, duration: 60 }, // 30 fares/min
  UPDATE_LOCATION: { points: 100, duration: 60 }, // 100 updates/min
  AUTH_ATTEMPTS: { points: 5, duration: 900 }, // 5 attempts/15min
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

// OTP Settings
export const OTP = {
  LENGTH: 6,
  EXPIRY_MINUTES: 5,
  MAX_ATTEMPTS: 3,
  RESEND_DELAY_SECONDS: 60,
};

// Ride Status
export const RIDE_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  ONGOING: "ongoing",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

// Captain Status
export const CAPTAIN_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  OFFLINE: "offline",
  ON_RIDE: "on_ride",
};

export default {
  SOCKET_EVENTS,
  API_STATUS,
  HTTP_STATUS,
  CACHE_TTL,
  LOCATION_BATCH,
  SEARCH_RADIUS,
  TIMEOUTS,
  RATE_LIMITS,
  PAGINATION,
  OTP,
  RIDE_STATUS,
  CAPTAIN_STATUS,
};

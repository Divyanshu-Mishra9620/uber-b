import { API_STATUS, HTTP_STATUS } from "../config/constants.js";

/**
 * Standardized API Response
 * Ensures all APIs return consistent format
 */
export class ApiResponse {
  constructor(
    statusCode,
    data = null,
    message = "",
    status = API_STATUS.SUCCESS,
  ) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.status = status;
    this.timestamp = new Date().toISOString();
  }

  static success(
    data = null,
    message = "Success",
    statusCode = HTTP_STATUS.OK,
  ) {
    return new ApiResponse(statusCode, data, message, API_STATUS.SUCCESS);
  }

  static created(data = null, message = "Created") {
    return new ApiResponse(
      HTTP_STATUS.CREATED,
      data,
      message,
      API_STATUS.SUCCESS,
    );
  }

  static error(message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    return new ApiResponse(statusCode, null, message, API_STATUS.ERROR);
  }

  static validationError(errors, message = "Validation failed") {
    return new ApiResponse(
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      errors,
      message,
      API_STATUS.VALIDATION_ERROR,
    );
  }

  static unauthorized(message = "Unauthorized") {
    return new ApiResponse(
      HTTP_STATUS.UNAUTHORIZED,
      null,
      message,
      API_STATUS.UNAUTHORIZED,
    );
  }

  static notFound(message = "Not found") {
    return new ApiResponse(
      HTTP_STATUS.NOT_FOUND,
      null,
      message,
      API_STATUS.NOT_FOUND,
    );
  }

  toJSON() {
    return {
      statusCode: this.statusCode,
      status: this.status,
      data: this.data,
      message: this.message,
      timestamp: this.timestamp,
    };
  }
}

export default ApiResponse;

import { validationResult } from "express-validator";
import { ApiResponse } from "../core/ApiResponse.js";

/**
 * Validation error handler middleware
 * Catches and formats validation errors
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.param,
      message: error.msg,
      value: error.value,
    }));

    const response = ApiResponse.validationError(
      formattedErrors,
      "Validation failed",
    );

    return res.status(response.statusCode).json(response.toJSON());
  }

  next();
};

export default handleValidationErrors;

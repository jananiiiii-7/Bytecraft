import type { ErrorRequestHandler } from "express";
import { AppError } from "../types/http";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  console.error("Unhandled error:", err);

  return res.status(500).json({
    error: "Internal server error",
  });
};

import type { Request, Response, NextFunction } from "express";
import { AppError } from "../types/http";

export function notFound(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

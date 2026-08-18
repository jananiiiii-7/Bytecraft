import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./utils/env";
import { rateLimiter } from "./middleware/rateLimiter";
import healthRoutes from "./routes/health";
import aiRoutes from "./routes/ai";
import assessmentRoutes from "./routes/assessment";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";

export const app = express();

app.use(helmet());
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(rateLimiter);

app.use(healthRoutes);
app.use(aiRoutes);
app.use(assessmentRoutes);

app.use(notFound);
app.use(errorHandler);

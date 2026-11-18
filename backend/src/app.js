import express from "express";
import cors from "cors";
import healthRoutes from "./presentation/routes/health.routes.js";
import { notFoundHandler } from "./presentation/middleware/notFoundHandler.js";
import { errorHandler } from "./presentation/middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:5173" }));
  app.use(express.json());

  app.use("/api", healthRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

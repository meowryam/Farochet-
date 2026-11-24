/**
 * Sales Summary Routes (Presentation Layer)
 *
 * Routes:
 *   GET /api/admin/sales-summary  — Raazia-only; generates FR-18 summary.
 */

import { Router } from "express";
import { createSalesSummaryController } from "../controllers/sales-summary.controller.js";
import { authenticateRequest } from "../middleware/authentication.js";
import { requireRole } from "../middleware/authorizeRole.js";

function createSalesSummaryRoutes({
  salesSummary,
  authenticate = authenticateRequest,
} = {}) {
  if (!salesSummary) {
    throw new Error("Sales Summary routes require the Sales Summary component.");
  }

  const controller = createSalesSummaryController(salesSummary);
  const router = Router();

  // All routes require a valid RAAZIA session.
  router.use(authenticate, requireRole("RAAZIA"));

  // GET /api/admin/sales-summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
  router.get("/", controller.getSalesSummary);

  return router;
}

export { createSalesSummaryRoutes };

/**
 * Sales Summary Controller (Presentation Layer — MVC within Presentation only)
 *
 * Handles HTTP request/response for GET /api/admin/sales-summary.
 * Delegates all business logic to the Sales Summary component.
 * Does not implement any FR-18 counting or pricing rules.
 */

function createSalesSummaryController(salesSummary) {
  if (!salesSummary) {
    throw new Error("Sales Summary controller requires the Sales Summary component.");
  }

  /**
   * GET /api/admin/sales-summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
   *
   * Query parameters:
   *   startDate - Inclusive start date in YYYY-MM-DD (PKT).
   *   endDate   - Inclusive end date in YYYY-MM-DD (PKT).
   *
   * Responses:
   *   200 { summary }   - Generated sales summary.
   *   400               - Missing or invalid date parameters.
   *   401               - Not authenticated.
   *   403               - Not Raazia.
   */
  async function getSalesSummary(req, res) {
    const viewer = req.authenticatedUser;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: {
          code: "MISSING_DATE_PARAMETERS",
          message: "Both startDate and endDate query parameters are required (YYYY-MM-DD).",
        },
      });
    }

    const summary = await salesSummary.generateSalesSummary(viewer, startDate, endDate);
    return res.status(200).json({ summary });
  }

  return { getSalesSummary };
}

export { createSalesSummaryController };

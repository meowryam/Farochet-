/**
 * Sales Summary Business Logic Component
 *
 * Owns: generating the limited operational sales summary under FR-18.
 * Obtains confirmed-order information through the Order Management interface.
 * Does NOT own or directly access Order persistence.
 *
 * FR-18 rules:
 * - Filter by Order confirmation date (confirmedAt), not inquiry/payment/delivery date.
 * - Inclusive start/end dates interpreted in Pakistan Standard Time (PKT = UTC+5).
 * - Confirmed count: all Orders confirmed in range, including subsequently cancelled.
 * - Cancelled count: Orders confirmed in range that are subsequently cancelled.
 * - Total Approved Price: sum of confirmed non-cancelled Orders in range only.
 * - Label MUST be "Total Approved Price (Order Value)", never "Payments Received".
 * - PendingOrderRequests are excluded.
 */

function summaryError(message, status, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

/**
 * Convert an inclusive calendar date string (YYYY-MM-DD) interpreted in PKT
 * to the UTC Date boundaries for database comparison.
 *
 * PKT is UTC+5 (no daylight-saving time).
 *
 * @param {string} dateStr - YYYY-MM-DD
 * @param {"start"|"end"} boundary - "start" = 00:00:00 PKT; "end" = 23:59:59.999 PKT
 * @returns {Date} UTC Date
 */
function pktDateBoundary(dateStr, boundary) {
  // Parse the date components. Using explicit parsing avoids browser/runtime
  // timezone injection from new Date("YYYY-MM-DD") which treats the value as UTC midnight.
  const [year, month, day] = dateStr.split("-").map(Number);

  // PKT offset is +5 hours = -300 minutes relative to UTC.
  // "start" = PKT 00:00:00 = UTC day-5h => UTC previous day 19:00:00
  // "end"   = PKT 23:59:59.999 = UTC same day 18:59:59.999
  const PKT_OFFSET_MS = 5 * 60 * 60 * 1000; // 5 hours in ms

  let utcMs;
  if (boundary === "start") {
    // PKT midnight = UTC midnight - 5h
    utcMs = Date.UTC(year, month - 1, day, 0, 0, 0, 0) - PKT_OFFSET_MS;
  } else {
    // PKT end of day = UTC midnight next day - 5h - 1ms
    utcMs = Date.UTC(year, month - 1, day, 23, 59, 59, 999) - PKT_OFFSET_MS;
  }

  return new Date(utcMs);
}

/**
 * Validate a YYYY-MM-DD date string strictly.
 * Returns null if valid, an error message string if invalid.
 */
function validateDateString(dateStr, label) {
  if (typeof dateStr !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return `${label} must be a date in YYYY-MM-DD format.`;
  }
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  if (
    d.getUTCFullYear() !== year ||
    d.getUTCMonth() + 1 !== month ||
    d.getUTCDate() !== day
  ) {
    return `${label} is not a valid calendar date.`;
  }
  return null;
}

/**
 * Create the Sales Summary business logic component.
 *
 * @param {{ orderManagement: object }} deps
 */
function createSalesSummary({ orderManagement }) {
  if (!orderManagement) {
    throw new Error("Sales Summary requires the Order Management component.");
  }

  /**
   * Generate the FR-18 sales summary for Raazia.
   *
   * @param {object} viewer - Authenticated user; must be RAAZIA.
   * @param {string} startDate - Inclusive start date in YYYY-MM-DD (PKT).
   * @param {string} endDate - Inclusive end date in YYYY-MM-DD (PKT).
   * @returns {Promise<SalesSummaryResult>}
   */
  async function generateSalesSummary(viewer, startDate, endDate) {
    // Authorization: only Raazia may access the sales summary.
    if (!viewer) {
      throw summaryError(
        "Authentication is required to view the sales summary.",
        401,
        "AUTHENTICATION_REQUIRED",
      );
    }
    if (viewer.role !== "RAAZIA") {
      throw summaryError(
        "Only Raazia can view the sales summary.",
        403,
        "SALES_SUMMARY_ACCESS_DENIED",
      );
    }

    // Validate input dates.
    const startError = validateDateString(startDate, "Start date");
    if (startError) {
      throw summaryError(startError, 400, "INVALID_DATE_RANGE");
    }
    const endError = validateDateString(endDate, "End date");
    if (endError) {
      throw summaryError(endError, 400, "INVALID_DATE_RANGE");
    }

    // Ensure start is not after end.
    if (startDate > endDate) {
      throw summaryError(
        "Start date must not be after end date.",
        400,
        "INVALID_DATE_RANGE",
      );
    }

    // Convert inclusive PKT calendar dates to UTC boundaries.
    const startUtc = pktDateBoundary(startDate, "start");
    const endUtc = pktDateBoundary(endDate, "end");

    // Obtain confirmed-order information through Order Management's interface.
    const allOrders = await orderManagement.listOrdersForSalesSummary(viewer, {
      confirmedAtStart: startUtc,
      confirmedAtEnd: endUtc,
    });

    // Apply FR-18 counting rules.
    const confirmedCount = allOrders.length;
    const cancelledOrders = allOrders.filter(
      (order) => order.manufacturingStatus === "Cancelled",
    );
    const cancelledCount = cancelledOrders.length;

    // Total Approved Price: sum of confirmed non-cancelled Orders in range.
    const totalApprovedPrice = allOrders
      .filter((order) => order.manufacturingStatus !== "Cancelled")
      .reduce((sum, order) => sum + (order.approvedPrice ?? 0), 0);

    return {
      startDate,
      endDate,
      confirmedCount,
      cancelledCount,
      totalApprovedPrice,
      // FR-18: label MUST be this exact string.
      totalApprovedPriceLabel: "Total Approved Price (Order Value)",
    };
  }

  return { generateSalesSummary };
}

/**
 * @typedef {object} SalesSummaryResult
 * @property {string} startDate
 * @property {string} endDate
 * @property {number} confirmedCount - All orders confirmed in range, including cancelled.
 * @property {number} cancelledCount - Subset of confirmedCount that are cancelled.
 * @property {number} totalApprovedPrice - Sum of non-cancelled confirmed orders.
 * @property {string} totalApprovedPriceLabel - Always "Total Approved Price (Order Value)".
 */

export { createSalesSummary, pktDateBoundary };

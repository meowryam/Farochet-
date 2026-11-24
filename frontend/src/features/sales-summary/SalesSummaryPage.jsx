import { useState } from "react";
import AdminShell from "../../components/layout/AdminShell";
import PageHeader from "../../components/layout/PageHeader";
import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import TextField from "../../components/ui/TextField";
import { getAdminSalesSummary } from "../../services/api";

/**
 * Sales Summary Page — Member 1 Cycle 5 (FR-18)
 *
 * Raazia can select an inclusive start/end date range (interpreted in PKT)
 * and view:
 *   - Confirmed order count (including subsequently cancelled).
 *   - Cancelled order count (subset of confirmed in range).
 *   - Total Approved Price (Order Value) — sum of non-cancelled confirmed orders.
 *
 * PRD FR-18 rules enforced:
 * - Uses Order confirmation date only.
 * - Cancelled orders are counted in confirmedCount AND cancelledCount
 *   but excluded from totalApprovedPrice.
 * - Label is always "Total Approved Price (Order Value)".
 * - PendingOrderRequests are excluded.
 */
export default function SalesSummaryPage() {
  // Today's date in YYYY-MM-DD (local, used only as a sensible default)
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = today.slice(0, 8) + "01";

  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleGenerate(e) {
    e.preventDefault();
    setError(null);
    setSummary(null);

    if (!startDate || !endDate) {
      setError("Please enter both a start date and an end date.");
      return;
    }
    if (startDate > endDate) {
      setError("Start date must not be after end date.");
      return;
    }

    setLoading(true);
    try {
      const result = await getAdminSalesSummary(startDate, endDate);
      setSummary(result);
    } catch (err) {
      setError(err.message ?? "Failed to generate the sales summary. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminShell>
      <PageHeader title="Sales Summary" subtitle="FR-18 — Order value summary by confirmation date range (PKT)" />

      <Card>
        <form onSubmit={handleGenerate} noValidate>
          <div className="form-row" style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: "1 1 180px" }}>
              <TextField
                label="Start Date (inclusive, PKT)"
                type="date"
                id="sales-start-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                aria-describedby={error ? "summary-error" : undefined}
              />
            </div>
            <div style={{ flex: "1 1 180px" }}>
              <TextField
                label="End Date (inclusive, PKT)"
                type="date"
                id="sales-end-date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                aria-describedby={error ? "summary-error" : undefined}
              />
            </div>
            <div>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? "Generating…" : "Generate Summary"}
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {error && (
        <Alert
          id="summary-error"
          variant="error"
          role="alert"
          style={{ marginTop: "1rem" }}
        >
          {error}
        </Alert>
      )}

      {summary && (
        <div style={{ marginTop: "1.5rem" }}>
          <Card>
            <SummaryDisplay summary={summary} />
          </Card>
        </div>
      )}
    </AdminShell>
  );
}

/**
 * Displays the FR-18 sales summary result.
 * Renders each metric with its precise PRD-compliant label.
 */
function SummaryDisplay({ summary }) {
  const {
    startDate,
    endDate,
    confirmedCount,
    cancelledCount,
    totalApprovedPrice,
    totalApprovedPriceLabel,
  } = summary;

  return (
    <div>
      <p style={{ marginBottom: "1rem", color: "var(--color-text-secondary, #6b7280)" }}>
        Orders confirmed between <strong>{startDate}</strong> and <strong>{endDate}</strong> (inclusive, PKT).
      </p>

      <dl className="summary-metrics" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        <SummaryMetric
          label="Confirmed Orders"
          value={confirmedCount}
          description="All orders confirmed in range, including subsequently cancelled."
        />
        <SummaryMetric
          label="Cancelled (of Confirmed)"
          value={cancelledCount}
          description="Subset of confirmed orders subsequently cancelled."
        />
        <SummaryMetric
          label={totalApprovedPriceLabel}
          value={`PKR ${totalApprovedPrice.toLocaleString()}`}
          description="Sum of Approved Prices for confirmed, non-cancelled orders. This is not a record of payments received."
          accent
        />
      </dl>

      {confirmedCount === 0 && (
        <p style={{ marginTop: "1rem", color: "var(--color-text-secondary, #6b7280)" }}>
          No confirmed orders found in the selected date range.
        </p>
      )}
    </div>
  );
}

function SummaryMetric({ label, value, description, accent }) {
  return (
    <div
      style={{
        padding: "1rem",
        background: accent ? "var(--color-primary-soft, #fdf4ff)" : "var(--color-surface, #f9fafb)",
        borderRadius: "0.5rem",
        border: `1px solid ${accent ? "var(--color-primary-border, #d8b4fe)" : "var(--color-border, #e5e7eb)"}`,
      }}
    >
      <dt style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-secondary, #6b7280)", marginBottom: "0.25rem" }}>
        {label}
      </dt>
      <dd style={{ fontSize: "1.5rem", fontWeight: 700, color: accent ? "var(--color-primary, #7c3aed)" : "var(--color-text, #111827)", margin: 0 }}>
        {value}
      </dd>
      {description && (
        <p style={{ fontSize: "0.75rem", color: "var(--color-text-secondary, #6b7280)", marginTop: "0.25rem" }}>
          {description}
        </p>
      )}
    </div>
  );
}

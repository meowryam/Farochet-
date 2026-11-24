import { useState } from "react";
import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";

function formatTimestamp(value) {
  return new Date(value).toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function referencePriceFrom(quotation) {
  if (!quotation) return null;
  return quotation.publicPrice ?? quotation.standardCataloguePrice ?? null;
}

export default function NegotiationPanel({
  negotiation,
  onSubmit,
  isSubmitting = false,
  error = "",
  admin = false,
  idPrefix = "negotiation",
}) {
  const [price, setPrice] = useState("");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");

  const entries = negotiation?.entries ?? [];
  const referencePrice = referencePriceFrom(negotiation?.quotation);

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    const parsedPrice = Number(price);
    if (price === "" || !Number.isSafeInteger(parsedPrice) || parsedPrice <= 0) {
      setFormError("Enter a positive whole amount in PKR.");
      return;
    }

    const trimmedNote = note.trim();
    try {
      await onSubmit({
        proposedPrice: parsedPrice,
        ...(trimmedNote === "" ? {} : { note: trimmedNote }),
      });
      setPrice("");
      setNote("");
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : "Could not submit the offer.");
    }
  }

  return (
    <Card title="Price negotiation" description="Offers submitted for this customization.">
      <div className="catalogue-info-fields">
        <div>
          <strong>Quotation reference price</strong>
          <p>{referencePrice === null ? "No catalogue price" : `PKR ${referencePrice}`}</p>
        </div>
      </div>

      {error && <Alert tone="error" title="Action could not be completed">{error}</Alert>}
      {formError && <Alert tone="error" title="Offer not submitted">{formError}</Alert>}

      {entries.length === 0 ? (
        <EmptyState
          title="No offers recorded"
          description="Offers submitted for this request will appear here."
        />
      ) : (
        <div className="catalogue-table-wrap">
          <table className="catalogue-table">
            <thead>
              <tr>
                <th scope="col">Submitted</th>
                <th scope="col">Proposer</th>
                <th scope="col">Proposed price</th>
                <th scope="col">Note</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td>{formatTimestamp(entry.createdAt)}</td>
                  <td>{entry.proposer === "RAAZIA" ? "Raazia" : "Customer"}</td>
                  <td>PKR {entry.proposedPrice}</td>
                  <td>{entry.note ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="catalogue-info-fields">
          <div>
            <label htmlFor={`${idPrefix}-price`}>Proposed price (whole PKR)</label>
            <input
              id={`${idPrefix}-price`}
              name="proposedPrice"
              type="number"
              min="1"
              step="1"
              required
              value={price}
              onChange={(event) => setPrice(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor={`${idPrefix}-note`}>Note (optional)</label>
            <textarea
              id={`${idPrefix}-note`}
              name="note"
              maxLength={500}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
        </div>
        <div className="catalogue-row-actions">
          <Button type="submit" admin={admin} loading={isSubmitting}>Submit offer</Button>
        </div>
      </form>
    </Card>
  );
}

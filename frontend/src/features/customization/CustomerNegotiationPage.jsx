import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageHeader from "../../components/layout/PageHeader";
import Alert from "../../components/ui/Alert";
import { addMyNegotiationEntry, getMyNegotiation } from "../../services/api";
import NegotiationPanel from "./NegotiationPanel";

export default function CustomerNegotiationPage() {
  const { id } = useParams();
  const [negotiation, setNegotiation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      setNegotiation(await getMyNegotiation(id));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load offers.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitOffer(offer) {
    setIsSubmitting(true);
    try {
      await addMyNegotiationEntry(id, offer);
      setNegotiation(await getMyNegotiation(id));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Farochet"
        title="Price negotiation"
        description="Offers you and Raazia have submitted for your custom-order request."
      />

      {error && <Alert tone="error" title="Action could not be completed">{error}</Alert>}

      {isLoading ? (
        <p className="catalogue-state" role="status">Loading offers…</p>
      ) : (
        <NegotiationPanel
          negotiation={negotiation}
          onSubmit={submitOffer}
          isSubmitting={isSubmitting}
          idPrefix="customer-negotiation"
        />
      )}
    </>
  );
}

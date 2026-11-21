import { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import Alert from "../../components/ui/Alert";
import { getPublicAvailability } from "../../services/api";

export default function AvailabilityPage() {
  const [availability, setAvailability] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getPublicAvailability()
      .then((value) => {
        if (active) setAvailability(value);
      })
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load availability.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <main className="availability-public-page">
      <Card title="Current Availability">
        {error && <Alert tone="error">{error}</Alert>}
        {!error && isLoading && (
          <p className="availability-not-provided" role="status">Loading availability…</p>
        )}
        {!error && !isLoading && !availability && (
          <p className="availability-not-provided">Availability has not yet been provided.</p>
        )}
        {!error && !isLoading && availability && <p className="availability-information">{availability.information}</p>}
      </Card>
    </main>
  );
}

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminShell from "../../components/layout/AdminShell";
import PageHeader from "../../components/layout/PageHeader";
import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import TextArea from "../../components/ui/TextArea";
import { useAuth } from "../../contexts/AuthContext";
import {
  getAdminAvailability,
  updateAdminAvailability,
} from "../../services/api";

const AVAILABILITY_NAV_ITEMS = [
  { label: "Availability", href: "/admin/availability", key: "availability" },
];

export default function AvailabilityManagementPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [information, setInformation] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadAvailability = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const availability = await getAdminAvailability();
      setInformation(availability?.information ?? "");
      setUpdatedAt(availability?.updatedAt ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load availability.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAvailability();
  }, [loadAvailability]);

  async function endSession() {
    setError("");
    try {
      await signOut();
      navigate("/admin/sign-in", { replace: true });
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : "Could not end the session.");
    }
  }

  async function saveAvailability(event) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setNotice("");
    try {
      const availability = await updateAdminAvailability(information);
      setInformation(availability.information);
      setUpdatedAt(availability.updatedAt);
      setNotice("Latest availability information saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save availability.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AdminShell activeKey="availability" navItems={AVAILABILITY_NAV_ITEMS} logoutHref={null}>
      <PageHeader
        eyebrow="Farochet Admin"
        title="Availability Management"
        description="Maintain your latest business availability information."
        action={<Button variant="outline" admin onClick={endSession}>End local session</Button>}
      />
      {error && <Alert tone="error" title="Action could not be completed">{error}</Alert>}
      {notice && <Alert tone="success">{notice}</Alert>}
      <Card
        title="Latest availability"
        description={updatedAt
          ? `Last updated ${new Date(updatedAt).toLocaleString()}`
          : "No availability information has been provided yet."}
      >
        <form className="availability-form" onSubmit={saveAvailability}>
          <TextArea
            id="availability-information"
            name="information"
            label="Availability information"
            value={information}
            onChange={(event) => setInformation(event.target.value)}
            placeholder="Describe when you are currently able to accept and discuss inquiries."
            helpText="This is manual business availability, not product stock or a recurring schedule."
            rows={5}
            required
            disabled={isLoading || isSaving}
          />
          <div className="availability-actions">
            <Button type="submit" admin disabled={isLoading || isSaving}>
              {isSaving ? "Saving..." : "Save availability"}
            </Button>
          </div>
        </form>
      </Card>
    </AdminShell>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ContentContainer from "../components/layout/ContentContainer";
import CustomerShell from "../components/layout/CustomerShell";
import PageHeader from "../components/layout/PageHeader";
import { useAuth } from "../contexts/AuthContext";

export default function CustomerAccountPage() {
  const { user, signOut } = useAuth();
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function logout() {
    setError("");
    try {
      await signOut();
      navigate("/sign-in", { replace: true });
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : "Could not end the session.");
    }
  }

  return (
    <CustomerShell>
      <ContentContainer className="account-page">
        <PageHeader
          eyebrow="Customer"
          title="Farochet account"
          description="Your Customer profile."
          action={<Button variant="outline" onClick={logout}>Sign out</Button>}
        />
        <Card
          title="Profile details"
        >
          {error && <Alert tone="error">{error}</Alert>}
          <dl className="account-details">
            <div><dt>Display name</dt><dd>{user?.displayName || "Not provided"}</dd></div>
            <div><dt>Email address</dt><dd>{user?.email || "Not available"}</dd></div>
          </dl>
          <div className="account-actions">
            <Button variant="outline" onClick={() => navigate("/inquiries")}>My Inquiries</Button>
            <Button variant="outline" onClick={() => navigate("/wishlist")}>My Wishlist</Button>
          </div>
        </Card>
      </ContentContainer>
    </CustomerShell>
  );
}

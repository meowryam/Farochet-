
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import FarochetLogo from "../components/brand/FarochetLogo";
import { useAuth } from "../contexts/AuthContext";
import { getSupabaseClient } from "../services/supabaseClient";

export default function AuthCallbackPage() {
  const { completePendingRegistration } = useAuth();
  const navigate = useNavigate();
  const started = useRef(false);
  const [status, setStatus] = useState("Confirming your email...");
  const [error, setError] = useState("");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function completeRegistration() {
      try {
        const client = getSupabaseClient();

        const { data, error: sessionError } = await client.auth.getSession();

        if (sessionError) throw sessionError;

        if (!data.session?.access_token) {
          throw new Error(
            "Your confirmation link could not establish a session. Please sign in to finish setting up your account.",
          );
        }

        setStatus("Setting up your Farochet Customer account...");

        const profile = await completePendingRegistration(data.session);

        if (profile.role !== "CUSTOMER") {
          throw new Error("This confirmation link is not for a Customer account.");
        }

        navigate("/account", { replace: true });
      } catch (callbackError) {
        setError(
          callbackError instanceof Error
            ? callbackError.message
            : "Your registration could not be completed.",
        );
      }
    }

    void completeRegistration();
  }, [completePendingRegistration, navigate]);

  return (
    <main className="auth-page">
      <h1 className="sr-only">Email confirmation</h1>
      <FarochetLogo className="auth-page__brand" />

      <Card
        className="auth-card"
        title={error ? "Confirmation could not be completed" : "Confirming your email"}
        description={error ? "Your account setup needs another step." : status}
      >
        {error ? (
          <>
            <Alert tone="error" title="Registration incomplete">
              {error}
            </Alert>
            <p className="auth-form__support">
              <Link to="/sign-in">Go to sign in</Link>
            </p>
            <Button type="button" fullWidth onClick={() => navigate("/sign-in")}>
              Sign In
            </Button>
          </>
        ) : (
          <p className="auth-form__support">
            Please keep this page open while we finish setting up your account.
          </p>
        )}
      </Card>
    </main>
  );
}

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import TextField from "../components/ui/TextField";
import FarochetLogo from "../components/brand/FarochetLogo";
import { useAuth } from "../contexts/AuthContext";

export default function SignInPage({ adminOnly = false }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [profileSetupRequired, setProfileSetupRequired] = useState(false);
  const { signIn, completeCustomerRegistration, signOut, error: authError } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const completingCustomerRegistration = !adminOnly
    && location.state?.completeCustomerRegistration === true;

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setProfileSetupRequired(false);

    try {
      const profile = completingCustomerRegistration
        ? await completeCustomerRegistration({ email, password })
        : await signIn({ email, password });
      if (adminOnly && profile.role !== "RAAZIA") {
        await signOut();
        setError("This account cannot access the Farochet Admin workspace.");
        return;
      }
      navigate(
        location.state?.from?.pathname
          ?? (profile.role === "RAAZIA" ? "/admin/products" : "/customer"),
        { replace: true },
      );
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Sign-in could not be completed.");
      setProfileSetupRequired(signInError?.code === "APPLICATION_PROFILE_REQUIRED");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <h1 className="sr-only">{adminOnly ? "Farochet Admin sign in" : "Sign in"}</h1>
      <FarochetLogo className="auth-page__brand" />
      <Card
        className="auth-card"
        title={adminOnly ? "Farochet Admin sign in" : "Welcome back"}
        description={completingCustomerRegistration
          ? "Sign in to finish setting up your Customer profile."
          : "Sign in with your Farochet account."}
      >
        {error && <Alert tone="error" title="Sign-in failed">{error}</Alert>}
        {!error && authError && <Alert tone="error" title="Authentication unavailable">{authError}</Alert>}
        <form className="auth-form" onSubmit={submit}>
          <TextField
            id="sign-in-email"
            label="Email address"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <TextField
            id="sign-in-password"
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <Button type="submit" fullWidth loading={submitting}>Sign In</Button>
        </form>
        {!adminOnly && (
          <p className="auth-form__support">
            New to Farochet? <Link to="/register">Create a Customer account</Link>
          </p>
        )}
        {!adminOnly && profileSetupRequired && (
          <p className="auth-form__support">
            Just confirmed a Customer registration?{" "}
            <Link to="/sign-in" state={{ completeCustomerRegistration: true }}>
              Finish Customer setup
            </Link>
          </p>
        )}
        {adminOnly && (
          <p className="auth-form__support">
            <Link to="/">Return to Farochet</Link>
          </p>
        )}
      </Card>
    </main>
  );
}

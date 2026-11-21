import { useState } from "react";
import { Link } from "react-router-dom";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import TextField from "../components/ui/TextField";
import FarochetLogo from "../components/brand/FarochetLogo";
import { useAuth } from "../contexts/AuthContext";

export default function CustomerRegistrationPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [registrationSubmitted, setRegistrationSubmitted] = useState(false);
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState("");
  const { signUp, error: authError } = useAuth();

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    if (displayName.trim().length === 0) {
      setError("Enter a display name.");
      setSubmitting(false);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      setSubmitting(false);
      return;
    }
    if (password.length === 0) {
      setError("Enter a password.");
      setSubmitting(false);
      return;
    }
    if (password !== passwordConfirmation) {
      setError("Passwords do not match.");
      setSubmitting(false);
      return;
    }

    try {
      const result = await signUp({ displayName, email, password });
      setEmailConfirmationRequired(result.emailConfirmationRequired);
      setRegistrationMessage(result.message);
      setRegistrationSubmitted(true);
    } catch (signUpError) {
      setError(signUpError instanceof Error ? signUpError.message : "Account creation could not be completed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <h1 className="sr-only">Create your Farochet Customer account</h1>
      <FarochetLogo className="auth-page__brand" />
      <Card
        className="auth-card"
        title="Create your Farochet account"
        description="Create a Customer account to use Farochet."
      >
        {registrationSubmitted ? (
          <div className="auth-form">
            <Alert tone="success" title="Registration request received">
              {registrationMessage}
            </Alert>
            <p>
              {emailConfirmationRequired
                ? "After confirming your email, sign in to finish setting up your Customer profile."
                : "Sign in to finish setting up your Customer profile."}
              <br />
              Check your inbox and spam folder for the confirmation email.
            </p>
            <Link to="/sign-in" state={{ completeCustomerRegistration: true }}>
              Continue to finish Customer setup
            </Link>
          </div>
        ) : (
          <>
            {error && <Alert tone="error" title="Account creation failed">{error}</Alert>}
            {!error && authError && <Alert tone="error" title="Authentication unavailable">{authError}</Alert>}
            <form className="auth-form" onSubmit={submit}>
              <TextField
                id="registration-display-name"
                label="Display name"
                autoComplete="name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                required
              />
              <TextField
                id="registration-email"
                label="Email address"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <TextField
                id="registration-password"
                label="Password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <TextField
                id="registration-password-confirmation"
                label="Confirm password"
                type="password"
                autoComplete="new-password"
                value={passwordConfirmation}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
                required
              />
              <Button type="submit" fullWidth loading={submitting}>Create Account</Button>
            </form>
            <p className="auth-form__support">
              Already have an account? <Link to="/sign-in">Sign in</Link>
            </p>
          </>
        )}
      </Card>
    </main>
  );
}

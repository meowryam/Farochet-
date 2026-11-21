import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Alert from "../ui/Alert";
import Card from "../ui/Card";

export default function RequireAuth({ roles, children }) {
  const { session, user, loading, error } = useAuth();
  const location = useLocation();

  if (loading) {
    return <main className="auth-page"><p role="status">Checking your sign-in session…</p></main>;
  }

  if (!session) {
    return <Navigate to={roles.includes("RAAZIA") ? "/admin/sign-in" : "/sign-in"} replace state={{ from: location }} />;
  }

  if (!user) {
    return (
      <main className="auth-page">
        <Card className="auth-card" title="Account access unavailable">
          <Alert tone="error">{error || "This account is not configured for application access."}</Alert>
        </Card>
      </main>
    );
  }

  if (!roles.includes(user.role)) {
    return <Navigate to={user.role === "RAAZIA" ? "/admin/products" : "/account"} replace />;
  }

  return children;
}

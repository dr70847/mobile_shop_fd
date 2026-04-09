import React, { useContext, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext";
import "../components/products.css";
import "./auth.css";

export default function LoginPage() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const nextPath = useMemo(() => location.state?.from?.pathname || "/", [location.state]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login({ email, password });
      navigate(nextPath, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ms-authPage">
      <div className="ms-authHeader">
        <h1 className="ms-authTitle">Welcome back</h1>
        <p className="ms-authSubtitle">Login to track orders and manage your account.</p>
      </div>

      <div className="ms-panel">
        <div className="ms-panel__header">
          <div className="ms-panel__title">Login</div>
          <div className="ms-panel__subtle">Secure access</div>
        </div>

        <form className="ms-form" onSubmit={onSubmit}>
          <div className="ms-formRow">
            <div className="ms-formLabel">Email</div>
            <input
              className="ms-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="ms-formRow">
            <div className="ms-formLabel">Password</div>
            <input
              className="ms-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <button className="ms-btn ms-btn--primary" type="submit" disabled={submitting}>
            {submitting ? "Logging in…" : "Login"}
          </button>

          {error ? <div className="ms-formError">{error}</div> : null}

          <div className="ms-formFooter">
            Don’t have an account? <Link to="/signup">Sign up</Link>
          </div>
        </form>
      </div>
    </div>
  );
}


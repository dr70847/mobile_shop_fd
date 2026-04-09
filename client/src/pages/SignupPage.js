import React, { useContext, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext";
import "../components/products.css";
import "./auth.css";

export default function SignupPage() {
  const { signup } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const nextPath = useMemo(() => location.state?.from?.pathname || "/", [location.state]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await signup({ name, email, password });
      navigate(nextPath, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Signup failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ms-authPage">
      <div className="ms-authHeader">
        <h1 className="ms-authTitle">Create your account</h1>
        <p className="ms-authSubtitle">Sign up to place orders and save favorites.</p>
      </div>

      <div className="ms-panel">
        <div className="ms-panel__header">
          <div className="ms-panel__title">Sign up</div>
          <div className="ms-panel__subtle">Takes less than a minute</div>
        </div>

        <form className="ms-form" onSubmit={onSubmit}>
          <div className="ms-formRow">
            <div className="ms-formLabel">Name</div>
            <input
              className="ms-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
              required
            />
          </div>

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
              placeholder="Create a password"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>

          <button className="ms-btn ms-btn--primary" type="submit" disabled={submitting}>
            {submitting ? "Creating account…" : "Create account"}
          </button>

          {error ? <div className="ms-formError">{error}</div> : null}

          <div className="ms-formFooter">
            Already have an account? <Link to="/login">Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}


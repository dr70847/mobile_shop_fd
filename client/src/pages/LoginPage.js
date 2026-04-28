import React, { useContext, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";
import { AuthContext } from "../auth/AuthContext";
import { useNotification } from "../ui/NotificationContext";
import ValidatedTextField from "../ui/components/ValidatedTextField";

function validateForm(values, requiresTwoFactor) {
  const nextErrors = {};
  if (requiresTwoFactor) {
    if (!values.code.trim()) nextErrors.code = "Authentication code is required.";
    else if (!/^\d{6}$/.test(values.code.trim())) nextErrors.code = "Enter the 6-digit code from your app.";
    return nextErrors;
  }

  if (!values.email.trim()) nextErrors.email = "Email is required.";
  else if (!/^\S+@\S+\.\S+$/.test(values.email)) nextErrors.email = "Please enter a valid email.";
  if (!values.password.trim()) nextErrors.password = "Password is required.";
  return nextErrors;
}

export default function LoginPage() {
  const { login, verifyTwoFactorLogin } = useContext(AuthContext);
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const nextPath = useMemo(() => location.state?.from?.pathname || "/", [location.state]);

  const [values, setValues] = useState({ email: "", password: "", code: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [pendingTwoFactor, setPendingTwoFactor] = useState(null);

  function onFieldChange(field, value) {
    const nextValues = { ...values, [field]: value };
    setValues(nextValues);
    setErrors(validateForm(nextValues, Boolean(pendingTwoFactor)));
  }

  async function onSubmit(e) {
    e.preventDefault();
    const formErrors = validateForm(values, Boolean(pendingTwoFactor));
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    setSubmitting(true);
    setError("");
    try {
      if (pendingTwoFactor) {
        await verifyTwoFactorLogin({
          twoFactorToken: pendingTwoFactor.twoFactorToken,
          code: values.code,
        });
      } else {
        const result = await login(values);
        if (result?.requiresTwoFactor) {
          setPendingTwoFactor({
            twoFactorToken: result.twoFactorToken,
            email: values.email,
          });
          setValues((prev) => ({ ...prev, code: "" }));
          setErrors({});
          showToast("Shkruaj kodin 6-shifror nga Authenticator app.", "info");
          return;
        }
      }
      showToast("Login successful.", "success");
      navigate(nextPath, { replace: true });
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Login failed.";
      setError(message);
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  function resetTwoFactorStep() {
    setPendingTwoFactor(null);
    setValues((prev) => ({ ...prev, code: "" }));
    setErrors({});
    setError("");
  }

  return (
    <Box sx={{ maxWidth: 560, mx: "auto", py: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Welcome back
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {pendingTwoFactor
            ? `Enter the code from your Authenticator app for ${pendingTwoFactor.email}.`
            : "Login to track orders and manage your account."}
        </Typography>

        <Box component="form" onSubmit={onSubmit}>
          <Stack spacing={2}>
            {pendingTwoFactor ? (
              <>
                <Alert severity="info">
                  Password u verifikua. Tani fut kodin 6-shifror nga aplikacioni yt Authenticator.
                </Alert>
                <ValidatedTextField
                  label="Authenticator code"
                  type="text"
                  value={values.code}
                  onChange={(e) => onFieldChange("code", e.target.value)}
                  errorText={errors.code}
                  autoComplete="one-time-code"
                />
              </>
            ) : (
              <>
                <ValidatedTextField
                  label="Email"
                  type="email"
                  value={values.email}
                  onChange={(e) => onFieldChange("email", e.target.value)}
                  errorText={errors.email}
                  autoComplete="email"
                />
                <ValidatedTextField
                  label="Password"
                  type="password"
                  value={values.password}
                  onChange={(e) => onFieldChange("password", e.target.value)}
                  errorText={errors.password}
                  autoComplete="current-password"
                />
              </>
            )}
            <Button variant="contained" type="submit" disabled={submitting}>
              {submitting ? "Please wait..." : pendingTwoFactor ? "Verify code" : "Login"}
            </Button>
            {pendingTwoFactor ? (
              <Button variant="text" type="button" disabled={submitting} onClick={resetTwoFactorStep}>
                Back to password
              </Button>
            ) : null}
            {error ? <Alert severity="error">{error}</Alert> : null}
            <Typography variant="body2">
              Don&apos;t have an account? <Link to="/signup">Sign up</Link>
            </Typography>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}


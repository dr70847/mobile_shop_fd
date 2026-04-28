import React, { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useNotification } from "../ui/NotificationContext";
import ValidatedTextField from "../ui/components/ValidatedTextField";

function validate(values) {
  const errors = {};
  if (!values.newPassword.trim()) {
    errors.newPassword = "New password is required.";
  } else if (values.newPassword.length < 6) {
    errors.newPassword = "Password must be at least 6 characters.";
  }
  if (!values.confirmPassword.trim()) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (values.newPassword !== values.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }
  return errors;
}

export default function ResetPasswordPage() {
  const { showToast } = useNotification();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => String(searchParams.get("token") || "").trim(), [searchParams]);

  const [values, setValues] = useState({ newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!token) {
      setError("Reset token is missing or invalid.");
      return;
    }
    const validationErrors = validate(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const res = await axios.post("/auth/reset-password", { token, newPassword: values.newPassword });
      const message = res.data?.message || "Password reset successful.";
      setSuccess(message);
      showToast(message, "success");
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Failed to reset password.";
      setError(message);
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box sx={{ maxWidth: 560, mx: "auto", py: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Reset password
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Choose a new password for your account.
        </Typography>

        {!token ? (
          <Alert severity="error">Invalid reset link. Please request a new reset email.</Alert>
        ) : (
          <Box component="form" onSubmit={onSubmit}>
            <Stack spacing={2}>
              <ValidatedTextField
                label="New password"
                type="password"
                value={values.newPassword}
                onChange={(e) => setValues((prev) => ({ ...prev, newPassword: e.target.value }))}
                errorText={errors.newPassword}
                autoComplete="new-password"
              />
              <ValidatedTextField
                label="Confirm new password"
                type="password"
                value={values.confirmPassword}
                onChange={(e) => setValues((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                errorText={errors.confirmPassword}
                autoComplete="new-password"
              />
              <Button variant="contained" type="submit" disabled={submitting}>
                {submitting ? "Updating..." : "Reset password"}
              </Button>
              {error ? <Alert severity="error">{error}</Alert> : null}
              {success ? <Alert severity="success">{success}</Alert> : null}
            </Stack>
          </Box>
        )}
        <Typography variant="body2" sx={{ mt: 2 }}>
          Back to <Link to="/login">Login</Link>
        </Typography>
      </Paper>
    </Box>
  );
}

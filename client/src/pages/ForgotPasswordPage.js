import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useNotification } from "../ui/NotificationContext";
import ValidatedTextField from "../ui/components/ValidatedTextField";

function validateEmail(email) {
  const value = String(email || "").trim();
  if (!value) return "Email is required.";
  if (!/^\S+@\S+\.\S+$/.test(value)) return "Please enter a valid email.";
  return "";
}

export default function ForgotPasswordPage() {
  const { showToast } = useNotification();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    const validationError = validateEmail(email);
    setError(validationError);
    if (validationError) return;

    setSubmitting(true);
    setInfo("");
    try {
      const res = await axios.post("/auth/request-password-reset", { email: email.trim() });
      const message = res.data?.message || "If this email exists, a reset link has been sent.";
      setInfo(message);
      showToast(message, "success");
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Failed to request password reset.";
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
          Forgot password
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Enter your email and we&apos;ll send you a reset link.
        </Typography>

        <Box component="form" onSubmit={onSubmit}>
          <Stack spacing={2}>
            <ValidatedTextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(validateEmail(e.target.value));
              }}
              errorText={error}
              autoComplete="email"
            />
            <Button variant="contained" type="submit" disabled={submitting}>
              {submitting ? "Sending..." : "Send reset link"}
            </Button>
            {info ? <Alert severity="success">{info}</Alert> : null}
            <Typography variant="body2">
              Back to <Link to="/login">Login</Link>
            </Typography>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}

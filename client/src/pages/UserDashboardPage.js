import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import QRCode from "qrcode";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { AuthContext } from "../auth/AuthContext";
import { useNotification } from "../ui/NotificationContext";

const actions = ["Track latest order", "Update shipping details", "View recommended products"];

export default function UserDashboardPage() {
  const { user, refreshUser } = useContext(AuthContext);
  const { showToast } = useNotification();
  const [setupData, setSetupData] = useState(null);
  const [setupCode, setSetupCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [working, setWorking] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    profileImageUrl: user?.profile_image_url || "",
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const twoFactorEnabled = Boolean(user?.two_factor_enabled);
  const emailVerified = Boolean(user?.email_verified_at);

  useEffect(() => {
    setProfileForm({
      name: user?.name || "",
      email: user?.email || "",
      profileImageUrl: user?.profile_image_url || "",
    });
  }, [user]);

  async function saveProfile(e) {
    e.preventDefault();
    if (!user?.id) return;
    setWorking(true);
    try {
      await axios.patch(`/api/v1/users/${user.id}`, {
        name: profileForm.name,
        email: profileForm.email,
        profile_image_url: profileForm.profileImageUrl,
      });
      await refreshUser();
      showToast("Profile settings updated.", "success");
    } catch (err) {
      showToast(err?.response?.data?.message || "Could not update profile.", "error");
    } finally {
      setWorking(false);
    }
  }

  async function requestEmailVerification() {
    setWorking(true);
    try {
      const res = await axios.post("/auth/email-verification/request");
      showToast(res?.data?.message || "Verification email sent.", "info");
    } catch (err) {
      showToast(err?.response?.data?.message || "Could not send verification email.", "error");
    } finally {
      setWorking(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      showToast("Fill current and new password.", "warning");
      return;
    }
    setWorking(true);
    try {
      await axios.post("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: "", newPassword: "" });
      showToast("Password changed successfully.", "success");
    } catch (err) {
      showToast(err?.response?.data?.message || "Could not change password.", "error");
    } finally {
      setWorking(false);
    }
  }

  async function startTwoFactorSetup() {
    setWorking(true);
    try {
      const res = await axios.post("/auth/2fa/setup");
      const otpauthUrl = res.data?.otpauthUrl;
      const qrCodeDataUrl = otpauthUrl ? await QRCode.toDataURL(otpauthUrl) : "";
      setSetupData({
        secret: res.data?.secret || "",
        qrCodeDataUrl,
      });
      setSetupCode("");
      showToast("Skano kodin QR dhe konfirmo me kodin 6-shifror.", "info");
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to start 2FA setup.", "error");
    } finally {
      setWorking(false);
    }
  }

  async function enableTwoFactor() {
    setWorking(true);
    try {
      await axios.post("/auth/2fa/enable", { code: setupCode });
      setSetupData(null);
      setSetupCode("");
      await refreshUser();
      showToast("2FA u aktivizua me sukses.", "success");
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to enable 2FA.", "error");
    } finally {
      setWorking(false);
    }
  }

  async function disableTwoFactor() {
    setWorking(true);
    try {
      await axios.post("/auth/2fa/disable", { code: disableCode });
      setDisableCode("");
      setSetupData(null);
      await refreshUser();
      showToast("2FA u caktivizua.", "success");
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to disable 2FA.", "error");
    } finally {
      setWorking(false);
    }
  }

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
        User Dashboard
      </Typography>
      <Typography variant="body1" sx={{ mb: 3, opacity: 0.8 }}>
        Quick access to your account and shopping activity.
      </Typography>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Suggested next actions
          </Typography>
          <Divider />
          <List>
            {actions.map((action) => (
              <ListItem key={action} disablePadding sx={{ py: 1 }}>
                <ListItemText primary={action} />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Account settings
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
            Update profile photo, username, and email.
          </Typography>
          <Stack spacing={2} component="form" onSubmit={saveProfile}>
            {emailVerified ? (
              <Alert severity="success">Your email is verified.</Alert>
            ) : (
              <Alert severity="warning">
                Your email is not verified yet. Verify it to increase account security.
              </Alert>
            )}
            {!emailVerified ? (
              <Button variant="outlined" onClick={requestEmailVerification} disabled={working}>
                Send verification email
              </Button>
            ) : null}
            <TextField
              label="Username"
              value={profileForm.name}
              onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={profileForm.email}
              onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Profile photo URL"
              value={profileForm.profileImageUrl}
              onChange={(e) => setProfileForm((p) => ({ ...p, profileImageUrl: e.target.value }))}
              fullWidth
            />
            <Button type="submit" variant="contained" disabled={working}>
              Save profile settings
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Security settings
          </Typography>
          <Stack spacing={2} component="form" onSubmit={changePassword}>
            <TextField
              label="Current password"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
              fullWidth
            />
            <TextField
              label="New password"
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
              fullWidth
            />
            <Button type="submit" variant="contained" disabled={working}>
              Change password
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Two-factor authentication
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
            Protect your account with a 6-digit code from Google Authenticator, Microsoft Authenticator, or similar apps.
          </Typography>

          <Stack spacing={2}>
            <Alert severity={twoFactorEnabled ? "success" : "warning"}>
              {twoFactorEnabled ? "2FA is currently enabled on your account." : "2FA is not enabled yet."}
            </Alert>

            {!twoFactorEnabled ? (
              <>
                <Button variant="contained" onClick={startTwoFactorSetup} disabled={working}>
                  {setupData ? "Regenerate setup code" : "Set up Authenticator app"}
                </Button>

                {setupData ? (
                  <Stack spacing={2}>
                    {setupData.qrCodeDataUrl ? (
                      <Box
                        component="img"
                        src={setupData.qrCodeDataUrl}
                        alt="Authenticator QR code"
                        sx={{ width: 220, height: 220, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
                      />
                    ) : null}
                    <TextField
                      label="Manual setup key"
                      value={setupData.secret}
                      InputProps={{ readOnly: true }}
                      fullWidth
                    />
                    <TextField
                      label="Enter 6-digit code"
                      value={setupCode}
                      onChange={(e) => setSetupCode(e.target.value)}
                      fullWidth
                    />
                    <Button variant="contained" onClick={enableTwoFactor} disabled={working || !setupCode.trim()}>
                      Confirm and enable 2FA
                    </Button>
                  </Stack>
                ) : null}
              </>
            ) : (
              <Stack spacing={2}>
                <TextField
                  label="Authenticator code to disable"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value)}
                  fullWidth
                />
                <Button color="error" variant="outlined" onClick={disableTwoFactor} disabled={working || !disableCode.trim()}>
                  Disable 2FA
                </Button>
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

import React, { useContext, useState } from "react";
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
  const twoFactorEnabled = Boolean(user?.two_factor_enabled);

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

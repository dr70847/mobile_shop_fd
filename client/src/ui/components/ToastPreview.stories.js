import React from "react";
import { Button, Stack } from "@mui/material";
import { NotificationProvider, useNotification } from "../NotificationContext";

function DemoButtons() {
  const { showToast } = useNotification();
  return (
    <Stack direction="row" spacing={2}>
      <Button variant="contained" onClick={() => showToast("Saved successfully.", "success")}>
        Success Toast
      </Button>
      <Button variant="outlined" onClick={() => showToast("Invalid form data.", "error")}>
        Error Toast
      </Button>
      <Button onClick={() => showToast("Background sync started.", "info")}>Info Toast</Button>
    </Stack>
  );
}

export default {
  title: "Feedback/ToastNotifications",
  component: DemoButtons,
};

export const Preview = {
  render: () => (
    <NotificationProvider>
      <DemoButtons />
    </NotificationProvider>
  ),
};

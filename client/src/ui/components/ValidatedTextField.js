import React from "react";
import { TextField } from "@mui/material";

export default function ValidatedTextField({ errorText, ...props }) {
  return <TextField {...props} error={Boolean(errorText)} helperText={errorText || " "} fullWidth />;
}

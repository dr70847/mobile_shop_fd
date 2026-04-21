import React from "react";
import { Box, Card, CardContent, Chip, Grid, Typography } from "@mui/material";

const metrics = [
  { label: "Open tickets", value: "12" },
  { label: "Orders pending", value: "36" },
  { label: "Team members online", value: "7" },
];

export default function ManagerPage() {
  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
        Manager Dashboard
      </Typography>
      <Typography variant="body1" sx={{ mb: 3, opacity: 0.8 }}>
        Operational overview, escalations, and daily monitoring.
      </Typography>

      <Grid container spacing={2}>
        {metrics.map((item) => (
          <Grid key={item.label} item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {item.label}
                </Typography>
                <Typography variant="h5" sx={{ mt: 1, fontWeight: 700 }}>
                  {item.value}
                </Typography>
                <Chip label="Live" color="success" size="small" sx={{ mt: 2 }} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

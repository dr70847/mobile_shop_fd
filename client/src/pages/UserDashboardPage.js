import React from "react";
import { Box, Card, CardContent, Divider, List, ListItem, ListItemText, Typography } from "@mui/material";

const actions = ["Track latest order", "Update shipping details", "View recommended products"];

export default function UserDashboardPage() {
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
    </Box>
  );
}

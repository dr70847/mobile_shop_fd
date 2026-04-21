import React, { useState } from "react";
import { Button } from "@mui/material";
import ConfirmActionDialog from "./ConfirmActionDialog";

export default {
  title: "Feedback/ConfirmActionDialog",
  component: ConfirmActionDialog,
};

function DialogDemo(args) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Open dialog
      </Button>
      <ConfirmActionDialog
        {...args}
        open={open}
        onCancel={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
      />
    </>
  );
}

export const DeleteDialog = {
  render: (args) => <DialogDemo {...args} />,
  args: {
    title: "Delete product",
    description: "This action cannot be undone.",
    confirmLabel: "Delete",
    confirmColor: "error",
  },
};

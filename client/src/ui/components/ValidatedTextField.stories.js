import React from "react";
import ValidatedTextField from "./ValidatedTextField";

export default {
  title: "Forms/ValidatedTextField",
  component: ValidatedTextField,
  args: {
    label: "Email",
    value: "",
    placeholder: "you@example.com",
    errorText: "",
  },
};

export const Default = {};

export const WithError = {
  args: {
    errorText: "Please enter a valid email address.",
  },
};

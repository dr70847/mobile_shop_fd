const express = require("express");
const authRoutes = require("../../routes/auth");
const { observeModule } = require("../shared/moduleObservability");

const MODULE_NAME = "authentication";
const router = express.Router();

router.use(observeModule(MODULE_NAME));
router.use("/", authRoutes);

module.exports = {
  name: MODULE_NAME,
  basePath: "/api/v1/auth",
  legacyPath: "/auth",
  router,
  publicApi: [
    "POST /api/v1/auth/signup",
    "POST /api/v1/auth/login",
    "GET /api/v1/auth/activate",
    "POST /api/v1/auth/change-password",
    "POST /api/v1/auth/request-password-reset",
    "POST /api/v1/auth/reset-password",
    "POST /api/v1/auth/oauth/token",
    "GET /api/v1/auth/me",
  ],
  docsPath: "/docs/modules/authentication",
};

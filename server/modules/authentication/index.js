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
    "POST /api/v1/auth/oauth/token",
    "GET /api/v1/auth/me",
  ],
  docsPath: "/docs/modules/authentication",
};

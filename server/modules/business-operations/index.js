const express = require("express");
const productRoutes = require("../../routes/products");
const orderRoutes = require("../../routes/orders");
const { observeModule } = require("../shared/moduleObservability");

const MODULE_NAME = "business-operations";
const router = express.Router();

router.use(observeModule(MODULE_NAME));
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);

module.exports = {
  name: MODULE_NAME,
  basePath: "/api/v1/business",
  router,
  publicApi: [
    "GET /api/v1/products",
    "GET /api/v1/products/:id",
    "POST /api/v1/products",
    "PUT /api/v1/products/:id",
    "DELETE /api/v1/products/:id",
    "GET /api/v1/orders",
    "GET /api/v1/orders/my",
    "POST /api/v1/orders/checkout",
  ],
  docsPath: "/docs/modules/business-operations",
};

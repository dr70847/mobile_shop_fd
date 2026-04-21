const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const fs = require("fs");
const path = require("path");
const { apiLimiter } = require("./middleware/rateLimit");
const { cacheMiddleware } = require("./middleware/cache");
const { openApiSpec } = require("./docs/openapi");
const { modules } = require("./modules/registry");

const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");
const categoryRoutes = require("./routes/categories");
const reviewRoutes = require("./routes/reviews");
const paymentRoutes = require("./routes/payments");
const shipmentRoutes = require("./routes/shipments");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend po funksionon!");
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.get("/api/v1/modules", (req, res) => {
  return res.json({
    items: modules.map((mod) => ({
      name: mod.name,
      basePath: mod.basePath,
      publicApi: mod.publicApi,
      docsPath: mod.docsPath,
    })),
  });
});

app.get("/docs/modules/:moduleName", (req, res) => {
  const moduleName = String(req.params.moduleName || "").trim().toLowerCase();
  const docsFilePath = path.join(__dirname, "docs", "modules", `${moduleName}.md`);
  if (!fs.existsSync(docsFilePath)) {
    return res.status(404).json({ message: "Module documentation not found." });
  }
  const content = fs.readFileSync(docsFilePath, "utf8");
  return res.type("text/markdown").send(content);
});

app.use("/api", apiLimiter);
app.use("/api/v1/products", cacheMiddleware(45), productRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/shipments", shipmentRoutes);

for (const mod of modules) {
  app.use(mod.basePath, mod.router);
  if (mod.legacyPath) {
    app.use(mod.legacyPath, mod.router);
  }
}

// Backward-compatible non-versioned endpoints
app.use("/products", cacheMiddleware(45), productRoutes);
app.use("/orders", orderRoutes);
app.use("/categories", categoryRoutes);
app.use("/reviews", reviewRoutes);
app.use("/payments", paymentRoutes);
app.use("/shipments", shipmentRoutes);

module.exports = app;

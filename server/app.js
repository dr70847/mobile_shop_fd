const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const { apiLimiter } = require("./middleware/rateLimit");
const { cacheMiddleware } = require("./middleware/cache");
const { openApiSpec } = require("./docs/openapi");

const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");
const authRoutes = require("./routes/auth");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend po funksionon!");
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.use("/api", apiLimiter);
app.use("/api/v1/products", cacheMiddleware(45), productRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/auth", authRoutes);

// Backward-compatible non-versioned endpoints
app.use("/products", cacheMiddleware(45), productRoutes);
app.use("/orders", orderRoutes);
app.use("/auth", authRoutes);

module.exports = app;

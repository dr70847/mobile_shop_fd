const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { createProxyMiddleware } = require("http-proxy-middleware");
const { getServiceUrl } = require("./serviceDiscovery");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "gateway" });
});

function proxyFor(serviceName, pathRewrite = {}) {
  const target = getServiceUrl(serviceName);
  if (!target) {
    throw new Error(`Service ${serviceName} is not registered in discovery.`);
  }
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite,
    onError: (_err, _req, res) => {
      res.status(502).json({ error: `${serviceName} service unavailable` });
    },
  });
}

app.use("/api/v1/auth", proxyFor("auth", { "^/api/v1/auth": "/auth" }));
app.use("/api/v1/products", proxyFor("catalog", { "^/api/v1/products": "/products" }));
app.use("/api/v1/orders", proxyFor("order", { "^/api/v1/orders": "/orders" }));
app.use("/api/v1/inventory", proxyFor("inventory", { "^/api/v1/inventory": "/api/inventory" }));
app.use("/api/v1/admin", proxyFor("admin", { "^/api/v1/admin": "/api/admin" }));
app.use("/auth", proxyFor("auth"));
app.use("/products", proxyFor("catalog"));
app.use("/orders", proxyFor("order"));

const port = process.env.PORT ? Number(process.env.PORT) : 8080;
app.listen(port, () => {
  console.log(`Gateway running on http://localhost:${port}`);
});

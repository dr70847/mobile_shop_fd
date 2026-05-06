const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function setupProxy(app) {
  app.use(
    ["/api", "/auth", "/docs", "/products", "/orders", "/categories", "/reviews", "/payments", "/shipments"],
    createProxyMiddleware({
      target: "https://localhost:3444",
      changeOrigin: true,
      secure: false,
      logLevel: "warn",
    })
  );
};

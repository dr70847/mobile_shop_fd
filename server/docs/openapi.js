const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Mobile Shop API",
    version: "1.0.0",
    description: "Versioned REST API with JWT/OAuth2, HATEOAS, caching and rate limiting.",
  },
  servers: [{ url: "http://localhost:3001" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      oauth2Password: {
        type: "oauth2",
        flows: {
          password: {
            tokenUrl: "/api/v1/auth/oauth/token",
            scopes: {},
          },
        },
      },
    },
  },
  paths: {
    "/api/v1/auth/signup": { post: { summary: "Create account" } },
    "/api/v1/auth/login": { post: { summary: "Login and get JWT" } },
    "/api/v1/auth/oauth/token": { post: { summary: "OAuth2 password token endpoint" } },
    "/api/v1/auth/me": { get: { summary: "Current user", security: [{ bearerAuth: [] }] } },
    "/api/v1/products": { get: { summary: "List products" }, post: { summary: "Create product", security: [{ bearerAuth: [] }] } },
    "/api/v1/products/{id}": { get: { summary: "Get product by id" }, put: { summary: "Update product", security: [{ bearerAuth: [] }] }, delete: { summary: "Delete product", security: [{ bearerAuth: [] }] } },
    "/api/v1/orders": { get: { summary: "List orders" } },
    "/api/v1/orders/my": { get: { summary: "My orders", security: [{ bearerAuth: [] }] } },
    "/api/v1/orders/checkout": { post: { summary: "Checkout", security: [{ bearerAuth: [] }] } },
  },
};

module.exports = { openApiSpec };

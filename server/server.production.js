/**
 * Production entry for Hostinger / PaaS: single HTTP port, TLS terminated by host.
 * Start command: node server.production.js
 */
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
require("dotenv").config({ path: path.join(__dirname, ".env") });

process.env.NODE_ENV = process.env.NODE_ENV || "production";
process.env.TRUST_PROXY = process.env.TRUST_PROXY || "true";

const http = require("http");
const app = require("./app");

const PORT = Number(process.env.PORT || 3000);

http.createServer(app).listen(PORT, "0.0.0.0", () => {
  console.log(`MobileShop API (production) listening on port ${PORT}`);
});

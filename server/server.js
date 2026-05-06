const path = require('path');
const https = require('https');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const app = require("./app");
const { getHttpsConfig } = require('./config/https');

// Start server with HTTPS
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
const HTTPS_PORT = process.env.HTTPS_PORT ? Number(process.env.HTTPS_PORT) : 3443;

// Start HTTP server as redirect-only. HTTPS remains the only app-serving channel.
const httpServer = require('http').createServer((req, res) => {
  const hostHeader = req.headers.host || `localhost:${PORT}`;
  const hostWithoutPort = hostHeader.split(':')[0];
  res.writeHead(301, { Location: `https://${hostWithoutPort}:${HTTPS_PORT}${req.url}` });
  res.end();
});

// Start HTTPS server
try {
  const httpsConfig = getHttpsConfig();
  const httpsServer = https.createServer(httpsConfig, app);
  
  httpServer.listen(PORT, () => {
    console.log(`HTTP Server running on http://localhost:${PORT}`);
    console.log('HTTP requests are redirected to HTTPS');
  });
  
  httpsServer.listen(HTTPS_PORT, () => {
    console.log(`HTTPS Server running on https://localhost:${HTTPS_PORT}`);
    console.log('Security features enabled:');
    console.log('- Input sanitization and validation');
    console.log('- SQL injection protection');
    console.log('- XSS protection with security headers');
    console.log('- HTTPS encryption');
  });
  
} catch (error) {
  console.error('Failed to start HTTPS server:', error.message);
  process.exit(1);
}
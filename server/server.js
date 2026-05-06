const path = require('path');
const https = require('https');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const app = require("./app");
const { getHttpsConfig } = require('./config/https');

// Start server with HTTPS
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
const HTTPS_PORT = process.env.HTTPS_PORT ? Number(process.env.HTTPS_PORT) : 3443;

// Start HTTP server (redirects to HTTPS in production)
const httpServer = require('http').createServer((req, res) => {
  if (process.env.NODE_ENV === 'production') {
    // Redirect HTTP to HTTPS in production
    res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
    res.end();
  } else {
    // In development, allow HTTP for testing
    app(req, res);
  }
});

// Start HTTPS server
try {
  const httpsConfig = getHttpsConfig();
  const httpsServer = https.createServer(httpsConfig, app);
  
  httpServer.listen(PORT, () => {
    console.log(`HTTP Server running on http://localhost:${PORT}`);
    if (process.env.NODE_ENV === 'production') {
      console.log('HTTP requests will be redirected to HTTPS');
    }
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
  console.log('Starting HTTP server only...');
  
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Warning: HTTPS not available - run with HTTPS for production');
  });
}
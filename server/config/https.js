const fs = require('fs');
const path = require('path');

// HTTPS Configuration
const httpsConfig = {
  // Development configuration with self-signed certificate
  development: {
    key: fs.readFileSync(path.join(__dirname, '../certs/server.key'), 'utf8'),
    cert: fs.readFileSync(path.join(__dirname, '../certs/server.crt'), 'utf8'),
    rejectUnauthorized: false
  },
  
  // Production configuration with Let's Encrypt
  production: {
    key: fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/privkey.pem', 'utf8'),
    cert: fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/fullchain.pem', 'utf8'),
    ca: fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/chain.pem', 'utf8'),
    rejectUnauthorized: true
  }
};

// Get HTTPS configuration based on environment
const getHttpsConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  if (env === 'production') {
    // Check if Let's Encrypt certificates exist
    if (fs.existsSync('/etc/letsencrypt/live/yourdomain.com/privkey.pem')) {
      return httpsConfig.production;
    } else {
      console.warn('Let\'s Encrypt certificates not found. Falling back to development mode.');
      return httpsConfig.development;
    }
  }
  
  // Development mode - create self-signed certificates if they don't exist
  const certsDir = path.join(__dirname, '../certs');
  const keyPath = path.join(certsDir, 'server.key');
  const certPath = path.join(certsDir, 'server.crt');
  
  if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
  }
  
  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    console.log('Generating self-signed SSL certificate for development...');
    generateSelfSignedCert(certsDir, keyPath, certPath);
  }
  
  return httpsConfig.development;
};

// Generate self-signed certificate for development
const generateSelfSignedCert = (certsDir, keyPath, certPath) => {
  const { execSync } = require('child_process');
  
  try {
    // Generate private key
    execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: 'inherit' });
    
    // Generate certificate signing request
    const csrPath = path.join(certsDir, 'server.csr');
    execSync(`openssl req -new -key "${keyPath}" -out "${csrPath}" -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"`, { stdio: 'inherit' });
    
    // Generate self-signed certificate
    execSync(`openssl x509 -req -days 365 -in "${csrPath}" -signkey "${keyPath}" -out "${certPath}"`, { stdio: 'inherit' });
    
    // Clean up CSR file
    fs.unlinkSync(csrPath);
    
    console.log('Self-signed certificate generated successfully!');
  } catch (error) {
    console.error('Error generating self-signed certificate:', error.message);
    console.log('Please install OpenSSL and ensure it\'s in your PATH');
    process.exit(1);
  }
};

module.exports = {
  getHttpsConfig
};

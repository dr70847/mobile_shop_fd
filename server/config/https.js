const fs = require('fs');
const path = require('path');
const selfsigned = require('selfsigned');

// Get HTTPS configuration based on environment
const getHttpsConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  const certsDir = path.join(__dirname, '../certs');
  const keyPath = path.join(certsDir, 'server.key');
  const certPath = path.join(certsDir, 'server.crt');
  
  if (env === 'production') {
    // Check if Let's Encrypt certificates exist
    const letsEncryptKey = '/etc/letsencrypt/live/yourdomain.com/privkey.pem';
    const letsEncryptCert = '/etc/letsencrypt/live/yourdomain.com/fullchain.pem';
    const letsEncryptChain = '/etc/letsencrypt/live/yourdomain.com/chain.pem';
    if (fs.existsSync(letsEncryptKey) && fs.existsSync(letsEncryptCert) && fs.existsSync(letsEncryptChain)) {
      return {
        key: fs.readFileSync(letsEncryptKey, 'utf8'),
        cert: fs.readFileSync(letsEncryptCert, 'utf8'),
        ca: fs.readFileSync(letsEncryptChain, 'utf8'),
        rejectUnauthorized: true
      };
    } else {
      throw new Error("Let's Encrypt certificates not found in production environment.");
    }
  }
  
  // Development mode - create self-signed certificates if they don't exist
  if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
  }
  
  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    console.log('Generating self-signed SSL certificate for development...');
    generateSelfSignedCert(certsDir, keyPath, certPath);
  }
  
  return {
    key: fs.readFileSync(keyPath, 'utf8'),
    cert: fs.readFileSync(certPath, 'utf8'),
    rejectUnauthorized: false
  };
};

// Generate self-signed certificate for development
const generateSelfSignedCert = (certsDir, keyPath, certPath) => {
  try {
    const attrs = [{ name: 'commonName', value: 'localhost' }];
    const pems = selfsigned.generate(attrs, {
      keySize: 2048,
      days: 365,
      algorithm: 'sha256',
      extensions: [{ name: 'basicConstraints', cA: true }]
    });
    fs.writeFileSync(keyPath, pems.private, 'utf8');
    fs.writeFileSync(certPath, pems.cert, 'utf8');
    console.log('Self-signed certificate generated successfully!');
  } catch (error) {
    console.error('Error generating self-signed certificate:', error.message);
    process.exit(1);
  }
};

module.exports = {
  getHttpsConfig
};

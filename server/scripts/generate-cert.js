const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const selfsigned = require('selfsigned');

// Generate self-signed certificate for development (Windows compatible)
const generateSelfSignedCert = () => {
  const certsDir = path.join(__dirname, '../certs');
  const keyPath = path.join(certsDir, 'server.key');
  const certPath = path.join(certsDir, 'server.crt');
  
  // Create certs directory if it doesn't exist
  if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true });
  }
  
  // Check if certificates already exist
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    console.log('SSL certificates already exist!');
    return;
  }
  
  console.log('Generating self-signed SSL certificate for development...');
  
  try {
    // Check if OpenSSL is available
    execSync('openssl version', { stdio: 'pipe' });
    
    // Generate private key
    console.log('Generating private key...');
    execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: 'pipe' });
    
    // Generate certificate signing request
    console.log('Generating certificate signing request...');
    const csrPath = path.join(certsDir, 'server.csr');
    execSync(`openssl req -new -key "${keyPath}" -out "${csrPath}" -subj "/C=US/ST=State/L=City/O=MobileShop/CN=localhost"`, { stdio: 'pipe' });
    
    // Generate self-signed certificate
    console.log('Generating self-signed certificate...');
    execSync(`openssl x509 -req -days 365 -in "${csrPath}" -signkey "${keyPath}" -out "${certPath}"`, { stdio: 'pipe' });
    
    // Clean up CSR file
    fs.unlinkSync(csrPath);
    
    console.log('✅ Self-signed certificate generated successfully!');
    console.log(`📁 Certificate location: ${certsDir}`);
    console.log(`🔑 Private key: ${keyPath}`);
    console.log(`📜 Certificate: ${certPath}`);
    
  } catch (error) {
    console.error('❌ Error generating self-signed certificate:', error.message);
    console.log('\n💡 Solutions:');
    console.log('1. Install OpenSSL for Windows from https://slproweb.com/products/Win32OpenSSL.html');
    console.log('2. Make sure OpenSSL is in your PATH environment variable');
    console.log('3. Or use Git Bash which includes OpenSSL');
    console.log('\n🔧 Alternative: Use PowerShell with New-SelfSignedCertificate');
    
    // Pure JS fallback for Windows/non-OpenSSL environments
    try {
      console.log('\n🔄 Trying JavaScript fallback...');
      const attrs = [{ name: 'commonName', value: 'localhost' }];
      const pems = selfsigned.generate(attrs, {
        keySize: 2048,
        days: 365,
        algorithm: 'sha256'
      });
      fs.writeFileSync(keyPath, pems.private, 'utf8');
      fs.writeFileSync(certPath, pems.cert, 'utf8');
      console.log('✅ JavaScript fallback certificate generated!');
    } catch (fallbackError) {
      console.error('❌ JavaScript fallback also failed:', fallbackError.message);
      process.exit(1);
    }
  }
};

// Run if called directly
if (require.main === module) {
  generateSelfSignedCert();
}

module.exports = { generateSelfSignedCert };

# Security Implementation Guide

This document outlines the security features implemented in the Mobile Shop application.

## 🔐 Security Features Implemented

### 1. Input Sanitization & Output Encoding

#### XSS Protection
- **Location**: `server/middleware/security.js`
- **Implementation**: 
  - Uses `isomorphic-dompurify` for HTML sanitization
  - Removes all HTML tags from user input
  - Encodes special characters in output
- **Coverage**: All request body, query parameters, and route parameters

#### SQL Injection Protection
- **Location**: `server/middleware/security.js`
- **Implementation**:
  - Pattern-based detection of SQL injection attempts
  - Blocks requests containing SQL keywords and patterns
  - Works with MySQL2 parameterized queries
- **Coverage**: All incoming requests

#### Input Validation
- **Location**: `server/middleware/security.js`
- **Implementation**:
  - Uses `express-validator` for structured validation
  - Email validation with normalization
  - Password strength requirements
  - Product data validation
  - Order ID validation
- **Coverage**: Registration, login, product management

### 2. Security Headers with Helmet.js

#### Headers Configured
- **Content Security Policy (CSP)**: Restricts resource loading
- **HTTP Strict Transport Security (HSTS)**: Enforces HTTPS
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing
- **X-XSS-Protection**: Enables browser XSS filtering

#### CSP Directives
```javascript
defaultSrc: ["'self'"],
styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
fontSrc: ["'self'", "https://fonts.gstatic.com"],
imgSrc: ["'self'", "data:", "https:"],
scriptSrc: ["'self'"],
connectSrc: ["'self'"],
frameSrc: ["'none'"],
objectSrc: ["'none'"]
```

### 3. HTTPS Configuration

#### Development Environment
- **Self-signed certificates** for local development
- **HTTP port**: 3001
- **HTTPS port**: 3443
- **Certificate generation**: `npm run ssl:generate`

#### Production Environment
- **Let's Encrypt certificates** for production
- **Automatic HTTP to HTTPS redirects**
- **Certificate paths**: `/etc/letsencrypt/live/yourdomain.com/`

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
cd server
npm install helmet express-validator isomorphic-dompurify mysql2
```

### 2. Generate SSL Certificates (Development)
```bash
cd server
npm run ssl:generate
```

### 3. Environment Configuration
Update your `.env` file:
```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=mobile_shop
DB_PORT=3306

# API
PORT=3001
HTTPS_PORT=3443
NODE_ENV=development
JWT_SECRET=your-long-random-secret

# Default admin
ADMIN_EMAIL=admin@mobileshop.local
ADMIN_PASSWORD=admin123
ADMIN_NAME=Admin
```

### 4. Start the Server
```bash
# Development
npm run dev

# Production
NODE_ENV=production npm start
```

## 🔍 Security Testing

### Manual Testing
1. **XSS Protection**: Try injecting `<script>alert('XSS')</script>` in forms
2. **SQL Injection**: Try `OR 1=1--` in search fields
3. **Headers**: Check security headers in browser dev tools

### Automated Testing
```bash
# Run all security-related tests
npm run test

# Integration tests
npm run test:integration

# API tests
npm run test:newman
```

## 📋 Security Checklist

### ✅ Implemented
- [x] Input sanitization for XSS prevention
- [x] SQL injection protection
- [x] Security headers with Helmet.js
- [x] HTTPS encryption (self-signed dev, Let's Encrypt prod)
- [x] Input validation with express-validator
- [x] Password strength requirements
- [x] Rate limiting (existing)
- [x] Authentication middleware (existing)

### 🔄 Recommendations
- [ ] Implement CSRF tokens
- [ ] Add logging for security events
- [ ] Set up security monitoring
- [ ] Regular security audits
- [ ] Dependency vulnerability scanning
- [ ] Content Security Policy refinement

## 🛠️ Troubleshooting

### SSL Certificate Issues
**Problem**: Cannot generate self-signed certificates
**Solution**: 
1. Install OpenSSL for Windows from https://slproweb.com/products/Win32OpenSSL.html
2. Add OpenSSL to PATH
3. Use Git Bash as alternative

### HTTPS Not Working
**Problem**: HTTPS server fails to start
**Solution**:
1. Check certificate files exist in `server/certs/`
2. Verify certificate permissions
3. Check port availability (3443)

### Validation Errors
**Problem**: Valid input being rejected
**Solution**:
1. Check validation rules in `middleware/security.js`
2. Review error messages in response
3. Adjust validation patterns if needed

## 🔧 Configuration Options

### Custom Security Headers
Modify helmet configuration in `server/app.js`:
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      // Your custom CSP directives
    }
  }
}));
```

### Custom Validation Rules
Add new validation rules in `server/middleware/security.js`:
```javascript
const customValidation = [
  body('field').custom(value => {
    // Your validation logic
    return true;
  })
];
```

### HTTPS Configuration
Update HTTPS settings in `server/config/https.js`:
```javascript
production: {
  key: fs.readFileSync('/path/to/your/key.pem', 'utf8'),
  cert: fs.readFileSync('/path/to/your/cert.pem', 'utf8'),
  // Additional options
}
```

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [Express Validator Documentation](https://express-validator.github.io/docs/)

## 🚨 Security Incident Response

If a security incident is detected:
1. Immediately block the offending IP
2. Log all relevant details
3. Review and patch vulnerabilities
4. Rotate secrets if necessary
5. Notify stakeholders

---

**Last Updated**: May 2025
**Version**: 1.0.0

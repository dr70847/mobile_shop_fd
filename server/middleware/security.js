const { body, validationResult, query, param } = require('express-validator');

const sanitizeText = (value) => {
  if (typeof value !== 'string') return value;
  // Strip HTML/script tags and inline event handlers in a lightweight way.
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/ on\w+="[^"]*"/gi, '')
    .replace(/ on\w+='[^']*'/gi, '')
    .replace(/<[^>]*>/g, '');
};

// XSS Protection middleware
const sanitizeInput = (req, res, next) => {
  // Sanitize all string inputs in request body
  if (req.body) {
    sanitizeObject(req.body);
  }
  
  // Sanitize query parameters
  if (req.query) {
    sanitizeObject(req.query);
  }
  
  // Sanitize route parameters
  if (req.params) {
    sanitizeObject(req.params);
  }
  
  next();
};

// Recursive function to sanitize object properties
const sanitizeObject = (obj) => {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = sanitizeText(obj[key]);
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
};

// Output encoding for XSS protection
const encodeOutput = (data) => {
  if (typeof data === 'string') {
    return data
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  return data;
};

const deepEncodeOutput = (value) => {
  if (typeof value === 'string') {
    return encodeOutput(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => deepEncodeOutput(item));
  }
  if (value && typeof value === 'object') {
    const encoded = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      encoded[key] = deepEncodeOutput(nestedValue);
    }
    return encoded;
  }
  return value;
};

// Output encoding middleware to reduce reflected/stored XSS risk.
const outputEncodingMiddleware = (_req, res, next) => {
  const originalSend = res.send.bind(res);
  const originalType = res.type.bind(res);

  res.type = (type) => {
    res.locals = res.locals || {};
    res.locals.responseType = String(type || "").toLowerCase();
    return originalType(type);
  };

  res.send = (payload) => {
    const responseType = String(res.getHeader("Content-Type") || res.locals?.responseType || "").toLowerCase();
    if (typeof payload === "string" && responseType.includes("text/html")) {
      return originalSend(encodeOutput(payload));
    }
    return originalSend(payload);
  };

  next();
};

// Validation middleware for common inputs
const validateUserInput = {
  register: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email required'),
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must be at least 8 characters with uppercase, lowercase, number and special character'),
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .escape()
      .withMessage('Name must be 2-50 characters'),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      next();
    }
  ],
  
  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email required'),
    body('password')
      .notEmpty()
      .withMessage('Password required'),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      next();
    }
  ],
  
  product: [
    body('name')
      .trim()
      .isLength({ min: 1, max: 255 })
      .escape()
      .withMessage('Product name must be 1-255 characters'),
    body('description')
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 1000 })
      .escape()
      .withMessage('Description must not exceed 1000 characters'),
    body('image_url')
      .optional({ nullable: true, checkFalsy: true })
      .isURL({ protocols: ['http', 'https'], require_protocol: true })
      .withMessage('Image URL must be a valid http/https URL'),
    body('price')
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
    body('stock')
      .optional()
      .customSanitizer((value, { req }) => {
        if (typeof value !== 'undefined') return value;
        return req.body?.stock_quantity;
      })
      .isInt({ min: 0 })
      .withMessage('Stock must be a non-negative integer'),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      next();
    }
  ],
  
  orderId: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Valid order ID required'),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      next();
    }
  ]
};

// SQL Injection protection middleware
const sqlInjectionProtection = (req, res, next) => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /(--|\*\/|\/\*)/gi,
    /(\bOR\b.*=.*\bOR\b)/gi,
    /(\bAND\b.*=.*\bAND\b)/gi,
    /(1=1|1 = 1)/gi,
    /(\bWHERE\b.*\bOR\b)/gi
  ];

  const checkForSQLInjection = (value) => {
    if (typeof value === 'string') {
      for (const pattern of sqlPatterns) {
        if (pattern.test(value)) {
          return true;
        }
      }
    }
    return false;
  };

  const scanObject = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string' && checkForSQLInjection(obj[key])) {
        return true;
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (scanObject(obj[key])) {
          return true;
        }
      }
    }
    return false;
  };

  // Check request body, query, and params
  if ((req.body && scanObject(req.body)) ||
      (req.query && scanObject(req.query)) ||
      (req.params && scanObject(req.params))) {
    return res.status(400).json({
      message: 'Invalid input detected'
    });
  }

  next();
};

module.exports = {
  sanitizeInput,
  encodeOutput,
  outputEncodingMiddleware,
  validateUserInput,
  sqlInjectionProtection
};

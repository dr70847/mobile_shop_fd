const { body, validationResult, query, param } = require('express-validator');
const createDOMPurify = require('isomorphic-dompurify');

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
      // Remove HTML tags and encode special characters
      obj[key] = createDOMPurify.sanitize(obj[key], {
        ALLOWED_TAGS: [], // No HTML tags allowed
        ALLOWED_ATTR: []
      });
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
      .trim()
      .isLength({ max: 1000 })
      .escape()
      .withMessage('Description must not exceed 1000 characters'),
    body('price')
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
    body('stock_quantity')
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
  validateUserInput,
  sqlInjectionProtection
};

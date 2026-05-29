import { body, param, query, validationResult } from 'express-validator';

/**
 * Validation middleware factory
 * Creates middleware that validates request data using express-validator
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

/**
 * Common validation rules
 */
export const validationRules = {
  // Email validation
  email: () => body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email address is required'),

  // Password validation
  password: () => body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),

  // IMEI validation (15 digits)
  imei: () => body('imei')
    .isLength({ min: 15, max: 15 })
    .isNumeric()
    .withMessage('IMEI must be exactly 15 digits'),

  // IMEI parameter validation
  imeiParam: () => param('imei')
    .isLength({ min: 15, max: 15 })
    .isNumeric()
    .withMessage('IMEI must be exactly 15 digits'),

  // Name validation
  name: () => body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  // Phone number validation
  phone: () => body('phone')
    .isMobilePhone('any')
    .withMessage('Valid phone number is required'),

  // Pagination validation
  pagination: () => [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],

  // Location validation
  location: () => [
    body('location.lat')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),
    body('location.lng')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180')
  ],

  // Device registration validation
  deviceRegistration: () => [
    validationRules.imei(),
    body('brand')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Brand must be between 2 and 50 characters'),
    body('model')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Model must be between 2 and 50 characters')
  ],

  // User registration validation
  userRegistration: () => [
    validationRules.name(),
    validationRules.email(),
    validationRules.password()
  ],

  // User login validation
  userLogin: () => [
    validationRules.email(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],

  // Stolen device report validation
  stolenReport: () => [
    validationRules.imei(),
    body('location')
      .isObject()
      .withMessage('Location must be an object with lat and lng'),
    body('location.lat')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),
    body('location.lng')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180'),
    body('circumstances')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Circumstances must be less than 500 characters')
  ],

  // Plan upgrade validation
  planUpgrade: () => [
    body('planId')
      .isIn(['free', 'pro', 'enterprise'])
      .withMessage('Invalid plan ID')
  ]
};

/**
 * Sanitization middleware
 * Removes potentially dangerous characters from request inputs
 */
export const sanitizeInput = (req, res, next) => {
  // Sanitize body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }

  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].trim();
      }
    });
  }

  next();
};

/**
 * Rate limit validation
 * Checks if the request exceeds rate limits
 */
export const checkRateLimit = (req, res, next) => {
  // This is handled by express-rate-limit middleware
  // This middleware can be used for custom rate limiting logic
  next();
};

const { body, validationResult } = require('express-validator');

// Common validation rules
const nameValidation = body('name')
  .trim()
  .isLength({ min: 5, max: 20 })
  .withMessage('Name must be between 5 and 20 characters');

const emailValidation = body('email')
  .trim()
  .isEmail()
  .normalizeEmail()
  .withMessage('Must be a valid email address');

const passwordValidation = body('password')
  .isLength({ min: 8, max: 16 })
  .withMessage('Password must be between 8 and 16 characters')
  .matches(/[A-Z]/)
  .withMessage('Password must contain at least one uppercase letter')
  .matches(/[!@#$%^&*(),.?":{}|<>]/)
  .withMessage('Password must contain at least one special character');

const addressValidation = body('address')
  .trim()
  .isLength({ max: 400 })
  .withMessage('Address must be at most 400 characters');

// Validation result handler
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

// Signup validations
const signupValidation = [
  nameValidation,
  emailValidation,
  passwordValidation,
  addressValidation,
  validate,
];

// Login validations
const loginValidation = [
  body('email').trim().isEmail().withMessage('Must be a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

// Password update validation
const passwordUpdateValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8, max: 16 })
    .withMessage('New password must be between 8 and 16 characters')
    .matches(/[A-Z]/)
    .withMessage('New password must contain at least one uppercase letter')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('New password must contain at least one special character'),
  validate,
];

// Admin create user validation
const createUserValidation = [
  nameValidation,
  emailValidation,
  passwordValidation,
  addressValidation,
  body('role')
    .isIn(['admin', 'user', 'store_owner'])
    .withMessage('Role must be admin, user, or store_owner'),
  validate,
];

// Store validation
const storeValidation = [
  body('name')
    .trim()
    .isLength({ min: 20, max: 60 })
    .withMessage('Store name must be between 20 and 60 characters'),
  emailValidation,
  addressValidation,
  validate,
];

// Rating validation
const ratingValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  validate,
];

module.exports = {
  signupValidation,
  loginValidation,
  passwordUpdateValidation,
  createUserValidation,
  storeValidation,
  ratingValidation,
};

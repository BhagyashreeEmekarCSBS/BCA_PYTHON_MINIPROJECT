const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const {
  signupValidation,
  loginValidation,
  passwordUpdateValidation,
} = require('../middleware/validation');

// Public routes
router.post('/signup', signupValidation, authController.signup);
router.post('/login', loginValidation, authController.login);

// Protected routes
router.get('/me', authenticate, authController.getMe);
router.put('/password', authenticate, passwordUpdateValidation, authController.updatePassword);

module.exports = router;

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');
const {
  createUserValidation,
  storeValidation,
} = require('../middleware/validation');

// All admin routes require authentication + admin role
router.use(authenticate, authorize('admin'));

router.get('/dashboard', adminController.getDashboard);
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.post('/users', createUserValidation, adminController.createUser);
router.get('/stores', adminController.getStores);
router.post('/stores', storeValidation, adminController.createStore);

module.exports = router;

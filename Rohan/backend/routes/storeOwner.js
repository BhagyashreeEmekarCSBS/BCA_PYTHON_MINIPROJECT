const express = require('express');
const router = express.Router();
const storeOwnerController = require('../controllers/storeOwnerController');
const { authenticate, authorize } = require('../middleware/auth');

// All store-owner routes require authentication + store_owner role
router.use(authenticate, authorize('store_owner'));

router.get('/dashboard', storeOwnerController.getDashboard);

module.exports = router;

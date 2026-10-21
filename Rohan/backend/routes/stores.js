const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const { authenticate, authorize } = require('../middleware/auth');
const { ratingValidation } = require('../middleware/validation');

// All store routes require authentication
router.use(authenticate, authorize('user'));

router.get('/', storeController.getStores);
router.post('/:storeId/ratings', ratingValidation, storeController.submitRating);
router.put('/:storeId/ratings', ratingValidation, storeController.updateRating);

module.exports = router;

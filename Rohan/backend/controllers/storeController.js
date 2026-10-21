const { Op } = require('sequelize');
const { Store, Rating, sequelize } = require('../models');

// GET /api/stores
exports.getStores = async (req, res) => {
  try {
    const { name, address, sortBy, sortOrder } = req.query;
    const userId = req.user.id;

    const where = {};
    if (name) where.name = { [Op.like]: `%${name}%` };
    if (address) where.address = { [Op.like]: `%${address}%` };

    const allowedSortFields = ['name', 'address', 'createdAt'];
    const orderDirection = sortOrder?.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    const order = [];
    if (sortBy && allowedSortFields.includes(sortBy)) {
      order.push([sortBy, orderDirection]);
    } else {
      order.push(['createdAt', 'DESC']);
    }

    const stores = await Store.findAll({
      where,
      include: [
        {
          model: Rating,
          as: 'ratings',
          attributes: ['id', 'rating', 'userId'],
        },
      ],
      order,
    });

    // Format response with average ratings and user's rating
    const formatted = stores.map((store) => {
      const storeData = store.toJSON();
      const allRatings = storeData.ratings;
      const userRating = allRatings.find((r) => r.userId === userId);
      const avgRating =
        allRatings.length > 0
          ? (allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length).toFixed(1)
          : null;

      return {
        id: storeData.id,
        name: storeData.name,
        email: storeData.email,
        address: storeData.address,
        averageRating: avgRating,
        totalRatings: allRatings.length,
        userRating: userRating ? userRating.rating : null,
        userRatingId: userRating ? userRating.id : null,
      };
    });

    if (sortBy === 'rating' || sortBy === 'averageRating') {
      formatted.sort((a, b) => {
        const ratingA = a.averageRating !== null ? parseFloat(a.averageRating) : -1;
        const ratingB = b.averageRating !== null ? parseFloat(b.averageRating) : -1;
        return orderDirection === 'DESC' ? ratingB - ratingA : ratingA - ratingB;
      });
    }

    res.json({ stores: formatted });
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/stores/:storeId/ratings
exports.submitRating = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { rating } = req.body;
    const userId = req.user.id;

    const store = await Store.findByPk(storeId);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Check if user already rated
    const existingRating = await Rating.findOne({
      where: { userId, storeId },
    });

    if (existingRating) {
      return res.status(409).json({
        message: 'You have already rated this store. Use PUT to modify your rating.',
      });
    }

    const newRating = await Rating.create({ rating, userId, storeId });

    res.status(201).json({
      message: 'Rating submitted successfully',
      rating: newRating,
    });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors.map((e) => ({ field: e.path, message: e.message })),
      });
    }
    console.error('Submit rating error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PUT /api/stores/:storeId/ratings
exports.updateRating = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { rating } = req.body;
    const userId = req.user.id;

    const existingRating = await Rating.findOne({
      where: { userId, storeId },
    });

    if (!existingRating) {
      return res.status(404).json({ message: 'Rating not found. Submit a rating first.' });
    }

    existingRating.rating = rating;
    await existingRating.save();

    res.json({
      message: 'Rating updated successfully',
      rating: existingRating,
    });
  } catch (error) {
    console.error('Update rating error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

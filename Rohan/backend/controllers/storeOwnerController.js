const { Store, Rating, User, sequelize } = require('../models');

// GET /api/store-owner/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const ownerId = req.user.id;

    const store = await Store.findOne({
      where: { ownerId },
    });

    if (!store) {
      return res.status(404).json({ message: 'No store found for this owner' });
    }

    // Get average rating
    const avgResult = await Rating.findOne({
      where: { storeId: store.id },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
        [sequelize.fn('COUNT', sequelize.col('rating')), 'totalRatings'],
      ],
      raw: true,
    });

    // Get users who submitted ratings
    const ratings = await Rating.findAll({
      where: { storeId: store.id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      store: {
        id: store.id,
        name: store.name,
        email: store.email,
        address: store.address,
        averageRating: avgResult.averageRating
          ? parseFloat(avgResult.averageRating).toFixed(1)
          : null,
        totalRatings: parseInt(avgResult.totalRatings) || 0,
      },
      ratings: ratings.map((r) => ({
        id: r.id,
        rating: r.rating,
        userName: r.user.name,
        userEmail: r.user.email,
        submittedAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error('Store owner dashboard error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

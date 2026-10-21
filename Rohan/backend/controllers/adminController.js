const { Op } = require('sequelize');
const { User, Store, Rating, sequelize } = require('../models');
const bcrypt = require('bcryptjs');

// GET /api/admin/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalStores = await Store.count();
    const totalRatings = await Rating.count();

    res.json({
      totalUsers,
      totalStores,
      totalRatings,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const { name, email, address, role, sortBy, sortOrder } = req.query;

    const where = {};
    if (name) where.name = { [Op.like]: `%${name}%` };
    if (email) where.email = { [Op.like]: `%${email}%` };
    if (address) where.address = { [Op.like]: `%${address}%` };
    if (role) where.role = role;

    const allowedSortFields = ['name', 'email', 'address', 'role', 'createdAt'];
    const orderDirection = sortOrder?.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    const order = [];
    if (sortBy && allowedSortFields.includes(sortBy)) {
      order.push([sortBy, orderDirection]);
    } else {
      order.push(['createdAt', 'DESC']);
    }

    const users = await User.findAll({
      where,
      order,
      attributes: { exclude: ['password'] },
    });

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/admin/users/:id
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Store,
          as: 'ownedStore',
          include: [
            {
              model: Rating,
              as: 'ratings',
              attributes: [],
            },
          ],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userData = user.toJSON();

    // If store owner, calculate average rating
    if (user.role === 'store_owner' && userData.ownedStore) {
      const avgRating = await Rating.findOne({
        where: { storeId: userData.ownedStore.id },
        attributes: [
          [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
          [sequelize.fn('COUNT', sequelize.col('rating')), 'totalRatings'],
        ],
        raw: true,
      });

      userData.ownedStore.averageRating = avgRating.averageRating
        ? parseFloat(avgRating.averageRating).toFixed(1)
        : null;
      userData.ownedStore.totalRatings = parseInt(avgRating.totalRatings) || 0;
    }

    res.json({ user: userData });
  } catch (error) {
    console.error('Get user by id error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/admin/users
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, address, role } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password, address, role });

    res.status(201).json({
      message: 'User created successfully',
      user: user.toSafeJSON(),
    });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors.map((e) => ({ field: e.path, message: e.message })),
      });
    }
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/admin/stores
exports.getStores = async (req, res) => {
  try {
    const { name, email, address, sortBy, sortOrder } = req.query;

    const where = {};
    if (name) where.name = { [Op.like]: `%${name}%` };
    if (email) where.email = { [Op.like]: `%${email}%` };
    if (address) where.address = { [Op.like]: `%${address}%` };

    const allowedSortFields = ['name', 'email', 'address', 'createdAt'];
    const orderDirection = sortOrder?.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    const order = [];
    if (sortBy === 'rating' || sortBy === 'averageRating') {
      order.push([sequelize.literal('averageRating'), orderDirection]);
    } else if (sortBy && allowedSortFields.includes(sortBy)) {
      order.push([sortBy, orderDirection]);
    } else {
      order.push(['createdAt', 'DESC']);
    }

    const stores = await Store.findAll({
      where,
      order,
      include: [
        {
          model: Rating,
          as: 'ratings',
          attributes: [],
        },
      ],
      attributes: {
        include: [
          [sequelize.fn('AVG', sequelize.col('ratings.rating')), 'averageRating'],
        ],
      },
      group: ['Store.id'],
      subQuery: false,
    });

    res.json({ stores });
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/admin/stores
exports.createStore = async (req, res) => {
  try {
    const { name, email, address, ownerId } = req.body;

    const existingStore = await Store.findOne({ where: { email } });
    if (existingStore) {
      return res.status(409).json({ message: 'Store with this email already exists' });
    }

    if (ownerId) {
      const owner = await User.findByPk(ownerId);
      if (!owner || owner.role !== 'store_owner') {
        return res.status(400).json({ message: 'Invalid store owner' });
      }
    }

    const store = await Store.create({ name, email, address, ownerId });

    res.status(201).json({
      message: 'Store created successfully',
      store,
    });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors.map((e) => ({ field: e.path, message: e.message })),
      });
    }
    console.error('Create store error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

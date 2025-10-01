// routes/transactions.js
import express from 'express';
import { query } from 'express-validator';
import Transaction from '../models/Transaction.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get transaction history
router.get('/', auth, [
  query('type').optional().isIn(['all', 'income', 'expense', 'transfer', 'deposit', 'payment']).withMessage('Invalid transaction type'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be at least 1')
], async (req, res) => {
  try {
    const { type = 'all', limit = 50, page = 1, jarId } = req.query;
    const skip = (page - 1) * limit;

    const queryObj = { userId: req.user._id };
    if (type !== 'all') queryObj.type = type;
    if (jarId) queryObj.jarId = jarId;

    const transactions = await Transaction.find(queryObj)
      .populate('jarId', 'name icon')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const totalTransactions = await Transaction.countDocuments(queryObj);
    const totalPages = Math.ceil(totalTransactions / limit);

    const summary = await Transaction.aggregate([
      { $match: queryObj },
      { $group: { _id: '$type', totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      transactions,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalTransactions,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      summary
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get transaction by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('jarId', 'name icon');

    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });

    res.json({ success: true, transaction });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get spending insights
router.get('/insights/summary', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = '30' } = req.query; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const spendingByCategory = await Transaction.aggregate([
      { $match: { userId, type: { $in: ['expense', 'payment'] }, createdAt: { $gte: startDate } } },
      { $group: { _id: '$category', totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { totalAmount: -1 } }
    ]);

    const dailySpending = await Transaction.aggregate([
      { $match: { userId, type: { $in: ['expense', 'payment'] }, createdAt: { $gte: startDate } } },
      { $group: { _id: { date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } }, totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { '_id.date': 1 } }
    ]);

    const savingsVsSpending = await Transaction.aggregate([
      { $match: { userId, createdAt: { $gte: startDate } } },
      { $group: { _id: '$type', totalAmount: { $sum: '$amount' } } }
    ]);

    res.json({
      success: true,
      insights: { spendingByCategory, dailySpending, savingsVsSpending },
      period: `${period} days`
    });
  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;

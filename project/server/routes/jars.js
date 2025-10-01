// routes/jars.js (ES Module)
import express from 'express';
import { body, validationResult } from 'express-validator';
import Jar from '../models/Jar.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Create new jar
router.post('/', auth, [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Jar name must be between 1 and 50 characters'),
  body('goalAmount')
    .isNumeric()
    .isFloat({ min: 1 })
    .withMessage('Goal amount must be at least ₹1'),
  body('icon')
    .optional()
    .isLength({ max: 10 })
    .withMessage('Icon cannot exceed 10 characters'),
  body('allocationPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Allocation percentage must be between 0 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, goalAmount, icon, allocationPercentage } = req.body;
    const userId = req.user._id;

    const jarCount = await Jar.countDocuments({ userId });
    if (jarCount >= 10) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 10 jars allowed per user'
      });
    }

    const jar = new Jar({
      userId,
      name,
      goalAmount,
      icon: icon || '🏺',
      allocationPercentage: allocationPercentage || 0
    });

    await jar.save();

    res.status(201).json({
      success: true,
      message: 'Jar created successfully',
      jar
    });
  } catch (error) {
    console.error('Create jar error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during jar creation'
    });
  }
});

// Get all user jars
router.get('/', auth, async (req, res) => {
  try {
    const jars = await Jar.find({ userId: req.user._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      jars
    });
  } catch (error) {
    console.error('Get jars error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get jar by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const jar = await Jar.findOne({ _id: req.params.id, userId: req.user._id });

    if (!jar) {
      return res.status(404).json({
        success: false,
        message: 'Jar not found'
      });
    }

    res.json({
      success: true,
      jar
    });
  } catch (error) {
    console.error('Get jar error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Deposit money to jar
router.post('/:id/deposit', auth, [
  body('amount')
    .isNumeric()
    .isFloat({ min: 1 })
    .withMessage('Deposit amount must be at least ₹1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { amount } = req.body;
    const jar = await Jar.findOne({ _id: req.params.id, userId: req.user._id });

    if (!jar) {
      return res.status(404).json({
        success: false,
        message: 'Jar not found'
      });
    }

    const user = req.user;

    if (user.income < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient income balance'
      });
    }

    user.income -= amount;
    user.totalSaved += amount;
    jar.currentAmount += amount;

    const goalAchieved = jar.checkGoalAchieved();

    await user.save();
    await jar.save();

    const transaction = new Transaction({
      userId: user._id,
      jarId: jar._id,
      type: 'deposit',
      amount,
      description: `Deposited to ${jar.name}`,
      status: 'completed'
    });
    await transaction.save();

    res.json({
      success: true,
      message: goalAchieved
        ? `₹${amount.toLocaleString()} deposited! 🎉 Goal achieved!`
        : `₹${amount.toLocaleString()} deposited successfully`,
      jar,
      user: {
        income: user.income,
        totalSaved: user.totalSaved
      },
      goalAchieved
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during deposit'
    });
  }
});

// Lock/unlock jar
router.patch('/:id/lock', auth, [
  body('locked').isBoolean().withMessage('Locked must be a boolean value'),
  body('pin').optional().isLength({ min: 4, max: 6 }).withMessage('PIN must be between 4 and 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { locked, pin } = req.body;
    const jar = await Jar.findOne({ _id: req.params.id, userId: req.user._id });

    if (!jar) {
      return res.status(404).json({ success: false, message: 'Jar not found' });
    }

    jar.locked = locked;

    if (locked && pin) {
      jar.lockPin = pin;
      jar.unlockDate = null;
    } else if (!locked) {
      jar.lockPin = null;
      jar.unlockDate = new Date();
    }

    await jar.save();

    res.json({
      success: true,
      message: `Jar ${locked ? 'locked' : 'unlocked'} successfully`,
      jar
    });
  } catch (error) {
    console.error('Lock jar error:', error);
    res.status(500).json({ success: false, message: 'Server error during lock operation' });
  }
});

// Update jar
router.patch('/:id', auth, [
  body('name').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Jar name must be between 1 and 50 characters'),
  body('goalAmount').optional().isNumeric().isFloat({ min: 1 }).withMessage('Goal amount must be at least ₹1'),
  body('icon').optional().isLength({ max: 10 }).withMessage('Icon cannot exceed 10 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { name, goalAmount, icon } = req.body;
    const jar = await Jar.findOne({ _id: req.params.id, userId: req.user._id });

    if (!jar) {
      return res.status(404).json({ success: false, message: 'Jar not found' });
    }

    if (name) jar.name = name;
    if (goalAmount) jar.goalAmount = goalAmount;
    if (icon) jar.icon = icon;

    await jar.save();

    res.json({
      success: true,
      message: 'Jar updated successfully',
      jar
    });
  } catch (error) {
    console.error('Update jar error:', error);
    res.status(500).json({ success: false, message: 'Server error during jar update' });
  }
});

// Delete jar
router.delete('/:id', auth, async (req, res) => {
  try {
    const jar = await Jar.findOne({ _id: req.params.id, userId: req.user._id });

    if (!jar) {
      return res.status(404).json({ success: false, message: 'Jar not found' });
    }

    if (jar.currentAmount > 0) {
      const user = req.user;
      user.income += jar.currentAmount;
      user.totalSaved -= jar.currentAmount;
      await user.save();

      const transaction = new Transaction({
        userId: user._id,
        jarId: jar._id,
        type: 'transfer',
        amount: jar.currentAmount,
        description: `Jar "${jar.name}" deleted - money returned to income`,
        status: 'completed'
      });
      await transaction.save();
    }

    await Jar.findByIdAndDelete(jar._id);

    res.json({
      success: true,
      message: jar.currentAmount > 0
        ? `Jar deleted and ₹${jar.currentAmount.toLocaleString()} returned to income`
        : 'Jar deleted successfully'
    });
  } catch (error) {
    console.error('Delete jar error:', error);
    res.status(500).json({ success: false, message: 'Server error during jar deletion' });
  }
});

export default router;

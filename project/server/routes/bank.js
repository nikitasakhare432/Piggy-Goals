// routes/bank.js (ES Module)
import express from 'express';
import { body, validationResult } from 'express-validator';
import BankAccount from '../models/BankAccount.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Link/Update bank account
router.post('/', auth, [
  body('bankName')
    .isIn(['SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak', 'PNB', 'BOI', 'Canara', 'Union', 'IDBI'])
    .withMessage('Please select a valid bank'),
  body('upiId')
    .matches(/^[\w.-]+@[\w.-]+$/)
    .withMessage('Please enter a valid UPI ID'),
  body('cardLast4')
    .isLength({ min: 4, max: 4 })
    .withMessage('Card number must be 4 digits'),
  body('cvv')
    .isLength({ min: 3, max: 4 })
    .withMessage('CVV must be 3 or 4 digits'),
  body('expiry')
    .matches(/^(0[1-9]|1[0-2])\/\d{2}$/)
    .withMessage('Please enter expiry in MM/YY format'),
  body('currentBalance')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Current balance must be a positive number')
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

    const { bankName, upiId, cardLast4, cvv, expiry, currentBalance } = req.body;
    const userId = req.user._id;

    // Check if bank account already exists
    let bankAccount = await BankAccount.findOne({ userId });

    if (bankAccount) {
      // Update existing bank account
      bankAccount.bankName = bankName;
      bankAccount.upiId = upiId;
      bankAccount.cardLast4 = cardLast4;
      bankAccount.cvv = cvv; // Will be hashed by pre-save middleware
      bankAccount.expiry = expiry;
      bankAccount.currentBalance = currentBalance;
      bankAccount.lastSynced = new Date();

      await bankAccount.save();

      res.json({
        success: true,
        message: 'Bank account updated successfully',
        bankAccount
      });
    } else {
      // Create new bank account
      bankAccount = new BankAccount({
        userId,
        bankName,
        upiId,
        cardLast4,
        cvv,
        expiry,
        currentBalance
      });

      await bankAccount.save();

      res.status(201).json({
        success: true,
        message: 'Bank account linked successfully',
        bankAccount
      });
    }
  } catch (error) {
    console.error('Bank account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during bank account operation'
    });
  }
});

// Get bank account details
router.get('/', auth, async (req, res) => {
  try {
    const bankAccount = await BankAccount.findOne({ userId: req.user._id });

    if (!bankAccount) {
      return res.status(404).json({
        success: false,
        message: 'No bank account linked'
      });
    }

    res.json({
      success: true,
      bankAccount
    });
  } catch (error) {
    console.error('Get bank account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Sync income from bank
router.post('/sync-income', auth, async (req, res) => {
  try {
    const bankAccount = await BankAccount.findOne({ userId: req.user._id });

    if (!bankAccount) {
      return res.status(404).json({
        success: false,
        message: 'No bank account linked'
      });
    }

    const { amount } = req.body;
    const syncAmount = amount || 25000; // Default salary amount

    // Update user income
    const user = req.user;
    user.income += syncAmount;
    await user.save();

    // Update bank balance
    bankAccount.currentBalance -= syncAmount;
    bankAccount.lastSynced = new Date();
    await bankAccount.save();

    // Create transaction record
    const transaction = new Transaction({
      userId: user._id,
      type: 'income',
      amount: syncAmount,
      description: `Income synced from ${bankAccount.bankName}`,
      paymentMethod: 'bank',
      status: 'completed'
    });
    await transaction.save();

    res.json({
      success: true,
      message: `₹${syncAmount.toLocaleString()} synced successfully`,
      user: {
        income: user.income
      },
      bankAccount: {
        currentBalance: bankAccount.currentBalance
      }
    });
  } catch (error) {
    console.error('Sync income error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during income sync'
    });
  }
});

// Remove bank account
router.delete('/', auth, async (req, res) => {
  try {
    const deleted = await BankAccount.findOneAndDelete({ userId: req.user._id });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'No bank account found to remove'
      });
    }

    res.json({
      success: true,
      message: 'Bank account removed successfully'
    });
  } catch (error) {
    console.error('Remove bank account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;

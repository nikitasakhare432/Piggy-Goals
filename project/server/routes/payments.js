// routes/payments.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import Stripe from 'stripe';
import Jar from '../models/Jar.js';
import Transaction from '../models/Transaction.js';
import auth from '../middleware/auth.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_...');

const router = express.Router();

// Create payment intent for jar payment
router.post('/create-intent', auth, [
  body('jarId').notEmpty().withMessage('Jar ID is required'),
  body('amount').isNumeric().isFloat({ min: 1 }).withMessage('Amount must be at least ₹1'),
  body('recipientUPI').matches(/^[\w.-]+@[\w.-]+$/).withMessage('Please enter a valid UPI ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { jarId, amount, recipientUPI, description } = req.body;

    const jar = await Jar.findOne({ _id: jarId, userId: req.user._id });
    if (!jar) return res.status(404).json({ success: false, message: 'Jar not found' });

    if (jar.locked) return res.status(400).json({ success: false, message: 'Cannot make payment from locked jar' });

    if (jar.currentAmount < amount) return res.status(400).json({ success: false, message: 'Insufficient balance in jar' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'inr',
      metadata: {
        jarId: jarId.toString(),
        userId: req.user._id.toString(),
        recipientUPI,
        description: description || 'Payment from jar'
      }
    });

    res.json({ success: true, clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ success: false, message: 'Server error during payment intent creation' });
  }
});

// Confirm payment and update jar balance
router.post('/confirm', auth, [
  body('paymentIntentId').notEmpty().withMessage('Payment intent ID is required'),
  body('jarId').notEmpty().withMessage('Jar ID is required'),
  body('amount').isNumeric().isFloat({ min: 1 }).withMessage('Amount must be at least ₹1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });

    const { paymentIntentId, jarId, amount, recipientUPI, description } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') return res.status(400).json({ success: false, message: 'Payment was not successful' });

    const jar = await Jar.findOne({ _id: jarId, userId: req.user._id });
    if (!jar) return res.status(404).json({ success: false, message: 'Jar not found' });

    jar.currentAmount -= amount;
    await jar.save();

    const user = req.user;
    user.totalSaved -= amount;
    await user.save();

    const transaction = new Transaction({
      userId: user._id,
      jarId: jar._id,
      type: 'payment',
      amount,
      description: description || `Payment to ${recipientUPI}`,
      recipientUPI,
      paymentId: paymentIntentId,
      paymentMethod: 'upi',
      status: 'completed'
    });
    await transaction.save();

    res.json({ success: true, message: `Payment of ₹${amount.toLocaleString()} completed successfully`, transaction, jar: { currentAmount: jar.currentAmount, progress: jar.progress } });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ success: false, message: 'Server error during payment confirmation' });
  }
});

// Simulate UPI payment (demo)
router.post('/simulate-upi', auth, [
  body('jarId').notEmpty().withMessage('Jar ID is required'),
  body('amount').isNumeric().isFloat({ min: 1 }).withMessage('Amount must be at least ₹1'),
  body('recipientUPI').matches(/^[\w.-]+@[\w.-]+$/).withMessage('Please enter a valid UPI ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });

    const { jarId, amount, recipientUPI, description } = req.body;

    const jar = await Jar.findOne({ _id: jarId, userId: req.user._id });
    if (!jar) return res.status(404).json({ success: false, message: 'Jar not found' });

    if (jar.locked) return res.status(400).json({ success: false, message: 'Cannot make payment from locked jar' });

    if (jar.currentAmount < amount) return res.status(400).json({ success: false, message: 'Insufficient balance in jar' });

    await new Promise(resolve => setTimeout(resolve, 1000)); // simulate delay

    jar.currentAmount -= amount;
    await jar.save();

    const user = req.user;
    user.totalSaved -= amount;
    await user.save();

    const transaction = new Transaction({
      userId: user._id,
      jarId: jar._id,
      type: 'payment',
      amount,
      description: description || `UPI payment to ${recipientUPI}`,
      recipientUPI,
      paymentId: `UPI${Date.now()}`,
      paymentMethod: 'upi',
      status: 'completed'
    });
    await transaction.save();

    res.json({ success: true, message: `UPI payment of ₹${amount.toLocaleString()} completed successfully`, transaction, jar: { currentAmount: jar.currentAmount, progress: jar.progress } });
  } catch (error) {
    console.error('Simulate UPI payment error:', error);
    res.status(500).json({ success: false, message: 'Server error during UPI payment' });
  }
});

export default router;

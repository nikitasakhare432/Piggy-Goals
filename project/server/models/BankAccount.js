// models/BankAccount.js (ES Module)
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const bankAccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  bankName: {
    type: String,
    required: [true, 'Bank name is required'],
    enum: ['SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak', 'PNB', 'BOI', 'Canara', 'Union', 'IDBI']
  },
  upiId: {
    type: String,
    required: [true, 'UPI ID is required'],
    match: [/^[\w.-]+@[\w.-]+$/, 'Please enter a valid UPI ID']
  },
  cardLast4: {
    type: String,
    required: [true, 'Card number is required'],
    minlength: [4, 'Card number must be 4 digits'],
    maxlength: [4, 'Card number must be 4 digits']
  },
  cvv: {
    type: String,
    required: [true, 'CVV is required']
  },
  expiry: {
    type: String,
    required: [true, 'Expiry date is required'],
    match: [/^(0[1-9]|1[0-2])\/\d{2}$/, 'Please enter expiry in MM/YY format']
  },
  currentBalance: {
    type: Number,
    required: [true, 'Current balance is required'],
    min: [0, 'Balance cannot be negative']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastSynced: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash CVV before saving
bankAccountSchema.pre('save', async function (next) {
  if (!this.isModified('cvv')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.cvv = await bcrypt.hash(this.cvv, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Remove sensitive data from JSON output
bankAccountSchema.methods.toJSON = function () {
  const bankAccount = this.toObject();
  delete bankAccount.cvv;
  return bankAccount;
};

export default mongoose.model('BankAccount', bankAccountSchema);

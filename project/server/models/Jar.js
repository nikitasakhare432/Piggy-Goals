import mongoose from 'mongoose';

const jarSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Jar name is required'],
    trim: true,
    maxlength: [50, 'Jar name cannot exceed 50 characters']
  },
  icon: {
    type: String,
    default: '🏺',
    maxlength: [10, 'Icon cannot exceed 10 characters']
  },
  goalAmount: {
    type: Number,
    required: [true, 'Goal amount is required'],
    min: [1, 'Goal amount must be at least ₹1']
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: [0, 'Current amount cannot be negative']
  },
  locked: {
    type: Boolean,
    default: false
  },
  lockPin: {
    type: String,
    default: null
  },
  unlockDate: {
    type: Date,
    default: null
  },
  allocationPercentage: {
    type: Number,
    min: [0, 'Allocation cannot be negative'],
    max: [100, 'Allocation cannot exceed 100%'],
    default: 0
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Calculate progress percentage
jarSchema.virtual('progress').get(function () {
  return Math.min((this.currentAmount / this.goalAmount) * 100, 100);
});

// Check if goal is achieved
jarSchema.methods.checkGoalAchieved = function () {
  if (this.currentAmount >= this.goalAmount && !this.isCompleted) {
    this.isCompleted = true;
    this.completedAt = new Date();
    return true;
  }
  return false;
};

// Include virtuals in JSON
jarSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Jar', jarSchema);
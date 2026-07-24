const mongoose = require('mongoose');

const CATEGORIES = [
  'Food',
  'Transport',
  'Books',
  'Entertainment',
  'Shopping',
  'Health',
  'Education',
  'Other',
];

const TransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 100,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true,
    },
    category: {
      type: String,
      enum: CATEGORIES,
      default: 'Other',
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
  },
  { timestamps: true }
);

TransactionSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Transaction', TransactionSchema);
module.exports.CATEGORIES = CATEGORIES;

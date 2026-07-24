const mongoose = require('mongoose');

const FocusSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    duration: {
      type: Number, // minutes
      required: true,
      min: 1,
    },
    sessionType: {
      type: String,
      enum: ['focus', 'short_break', 'long_break'],
      default: 'focus',
    },
    completed: {
      type: Boolean,
      default: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

FocusSessionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('FocusSession', FocusSessionSchema);

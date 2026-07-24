const mongoose = require('mongoose');

const ACTIVITY_TYPES = [
  'Workshop',
  'Hackathon',
  'Certification',
  'Sports',
  'Volunteering',
  'Competition',
  'Other',
];

const ActivitySchema = new mongoose.Schema(
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
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    activityType: {
      type: String,
      enum: ACTIVITY_TYPES,
      default: 'Other',
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['planned', 'ongoing', 'completed'],
      default: 'planned',
    },
    certificatePath: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
  },
  { timestamps: true }
);

ActivitySchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Activity', ActivitySchema);
module.exports.ACTIVITY_TYPES = ACTIVITY_TYPES;

const mongoose = require('mongoose');

const aiSummarySchema = new mongoose.Schema({
  meetingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting',
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ['PROCESSING', 'DRAFT', 'PUBLISHED', 'FAILED'],
    default: 'PROCESSING',
  },
  overview: String,
  keyDecisions: [String],
  blockers: [String],
  openQuestions: [String],
  followUps: [String],
  sentiment: String,
  editHistory: [{
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    editedAt: Date,
    snapshot: mongoose.Schema.Types.Mixed,
  }],
  publishedAt: Date,
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

module.exports = mongoose.model('AiSummary', aiSummarySchema);

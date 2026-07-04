const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
    index: true,
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  scheduledAt: {
    type: Date,
  },
  startedAt: {
    type: Date,
  },
  endedAt: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED'],
    default: 'SCHEDULED',
  },
  joinLink: {
    type: String,
    unique: true,
    sparse: true,
  },
  participantIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  recordingUrl: {
    type: String,
  },
  transcriptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transcript',
  },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

module.exports = mongoose.model('Meeting', meetingSchema);

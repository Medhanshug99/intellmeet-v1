const mongoose = require('mongoose');

const transcriptSchema = new mongoose.Schema({
  meetingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting',
    required: true,
    index: true,
  },
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
  },
  segments: [{
    speakerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    text: String,
    startTime: Number,
    endTime: Number,
    confidence: Number,
  }],
}, { timestamps: true });

module.exports = mongoose.model('Transcript', transcriptSchema);

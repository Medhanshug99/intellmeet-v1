const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
    index: true,
  },
  meetingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting',
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  assigneeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  status: {
    type: String,
    enum: ['TODO', 'IN_PROGRESS', 'DONE'],
    default: 'TODO',
    index: true,
  },
  dueDate: {
    type: Date,
  },
  source: {
    type: String,
    enum: ['AI', 'MANUAL'],
    default: 'MANUAL',
  },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

module.exports = mongoose.model('Task', taskSchema);

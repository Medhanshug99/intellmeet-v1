const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  memberIds: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['MEMBER', 'HOST', 'ADMIN'],
      default: 'MEMBER',
    }
  }],
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

module.exports = mongoose.model('Workspace', workspaceSchema);

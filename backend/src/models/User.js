const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    index: true,
    lowercase: true,
    trim: true,
  },
  displayName: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    select: false,
  },
  name: {
    type: String,
  },
  avatarUrl: {
    type: String,
    default: null,
  },
  role: {
    type: String,
    enum: ['MEMBER', 'HOST', 'ADMIN', 'PRO'],
    default: 'MEMBER',
  },
  workspaceIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
  }],
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Virtual so name always reflects displayName if not set separately
userSchema.pre('save', function(next) {
  if (!this.name) this.name = this.displayName;
  next();
});

module.exports = mongoose.model('User', userSchema);

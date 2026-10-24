// models/Group.js
// Group schema – a named group of users sharing expenses
// Demonstrates: Array of ObjectId references, Mongoose population, pre-save hooks (Lecture 43-44)

const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      minlength: [2, 'Group name must be at least 2 characters'],
      maxlength: [100, 'Group name cannot exceed 100 characters'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: deduplicate members and guarantee creator is always included
GroupSchema.pre('save', function (next) {
  const createdByStr = this.createdBy.toString();
  const seen = new Set();
  const uniqueMembers = [];

  // Creator always first
  seen.add(createdByStr);
  uniqueMembers.push(this.createdBy);

  if (Array.isArray(this.members)) {
    this.members.forEach((m) => {
      const idStr = (m._id || m).toString();
      if (!seen.has(idStr)) {
        seen.add(idStr);
        uniqueMembers.push(m);
      }
    });
  }

  this.members = uniqueMembers;
  next();
});

module.exports = mongoose.model('Group', GroupSchema);

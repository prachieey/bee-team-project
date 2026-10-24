// controllers/groupController.js
// Group CRUD with membership-based authorization
// Demonstrates: Mongoose population, membership checks, cascade delete (Lecture 43-45)

const Group        = require('../models/Group');
const GroupExpense = require('../models/GroupExpense');
const User         = require('../models/User');

// ── GET /api/groups ──────────────────────────────────────────────────────────
// Returns only groups the authenticated user is a member of
const getGroups = async (req, res, next) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate('createdBy', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: groups.length, data: groups });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/groups ─────────────────────────────────────────────────────────
const createGroup = async (req, res, next) => {
  try {
    const { name, memberEmails = [] } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Group name must be at least 2 characters.' });
    }

    // Creator always included as initial member
    const memberIds = [req.user._id];

    if (Array.isArray(memberEmails) && memberEmails.length > 0) {
      const cleanEmails = memberEmails
        .map((e) => (typeof e === 'string' ? e.toLowerCase().trim() : ''))
        .filter(Boolean);

      if (cleanEmails.length > 0) {
        const foundUsers = await User.find({ email: { $in: cleanEmails } });
        foundUsers.forEach((u) => {
          const alreadyIn = memberIds.some((id) => id.toString() === u._id.toString());
          if (!alreadyIn) memberIds.push(u._id);
        });
      }
    }

    const group = await Group.create({
      name:      name.trim(),
      createdBy: req.user._id,
      members:   memberIds,
    });

    const populated = await Group.findById(group._id)
      .populate('createdBy', 'name email')
      .populate('members',   'name email');

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/groups/:id ──────────────────────────────────────────────────────
const getGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('members',   'name email');

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    // Only members can view
    const isMember = group.members.some((m) => (m._id || m).toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Not authorized. You are not a member of this group.' });
    }

    res.json({ success: true, data: group });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/groups/:id ──────────────────────────────────────────────────────
// Only the creator can update the group (rename, add/remove members)
const updateGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the group creator can update it.' });
    }

    const { name, memberEmails } = req.body;

    if (name) {
      if (name.trim().length < 2) {
        return res.status(400).json({ success: false, message: 'Group name must be at least 2 characters.' });
      }
      group.name = name.trim();
    }

    if (memberEmails && Array.isArray(memberEmails)) {
      const cleanEmails = memberEmails
        .map((e) => (typeof e === 'string' ? e.toLowerCase().trim() : ''))
        .filter(Boolean);

      const foundUsers = await User.find({ email: { $in: cleanEmails } });
      const newMemberIds = foundUsers.map((u) => u._id);

      // Always keep creator
      const merged = [group.createdBy];
      newMemberIds.forEach((id) => {
        if (!merged.some((m) => m.toString() === id.toString())) {
          merged.push(id);
        }
      });

      group.members = merged;
    }

    await group.save();

    const populated = await Group.findById(group._id)
      .populate('createdBy', 'name email')
      .populate('members',   'name email');

    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/groups/:id ───────────────────────────────────────────────────
// Only the creator can delete the group; cascades to all associated expenses
const deleteGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the group creator can delete it.' });
    }

    // Cascade delete: remove all associated group expenses
    await GroupExpense.deleteMany({ groupId: group._id });
    await group.deleteOne();

    res.json({ success: true, message: 'Group and all associated expenses deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getGroups, createGroup, getGroup, updateGroup, deleteGroup };

const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const config = require('../config');

// GET /api/announcements - Get all active notices
router.get('/', (req, res) => {
  try {
    const announcements = db.find('announcements', null, (a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return res.json({
      success: true,
      count: announcements.length,
      announcements
    });
  } catch (err) {
    console.error('Fetch announcements error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch announcements.' });
  }
});

// POST /api/announcements - Create notice (Staff or Admin only)
router.post('/', authenticateToken, requireRole(config.ROLES.ADMIN, config.ROLES.STAFF), (req, res) => {
  try {
    const { title, content, priority = 'Normal', pinned = false } = req.body;

    if (!title || title.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Title must be at least 5 characters.' });
    }
    if (!content || content.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Content must be at least 10 characters.' });
    }

    const newAnnouncement = db.create('announcements', {
      title: title.trim(),
      content: content.trim(),
      priority: ['Normal', 'Urgent'].includes(priority) ? priority : 'Normal',
      pinned: pinned === true || pinned === 'true',
      authorId: req.user.id,
      authorName: req.user.name,
      authorRole: req.user.role
    });

    return res.status(201).json({
      success: true,
      message: 'Announcement posted successfully!',
      announcement: newAnnouncement
    });
  } catch (err) {
    console.error('Create announcement error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create announcement.' });
  }
});

// DELETE /api/announcements/:id - Delete notice (Admin only)
router.delete('/:id', authenticateToken, requireRole(config.ROLES.ADMIN), (req, res) => {
  try {
    const item = db.findById('announcements', req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Announcement not found.' });
    }
    db.delete('announcements', item.id);
    return res.json({ success: true, message: 'Announcement deleted.' });
  } catch (err) {
    console.error('Delete announcement error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete announcement.' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { validateComment } = require('../middleware/validate');

// GET /api/reports/:id/comments
router.get('/', (req, res) => {
  try {
    const reportId = req.params.id;
    const report = db.findById('reports', reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    const comments = db.find('comments', c => c.reportId === reportId, (a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return res.json({ success: true, count: comments.length, comments });
  } catch (err) {
    console.error('Fetch comments error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch comments.' });
  }
});

// POST /api/reports/:id/comments
router.post('/', authenticateToken, validateComment, (req, res) => {
  try {
    const reportId = req.params.id;
    const report = db.findById('reports', reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    const { content } = req.body;

    const newComment = db.create('comments', {
      reportId,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      userDepartment: req.user.department || null,
      content: content.trim()
    });

    db.create('activity_logs', {
      reportId,
      userId: req.user.id,
      userName: req.user.name,
      action: 'Comment Added',
      details: `${req.user.name} commented on report #${report.id}`
    });

    return res.status(201).json({
      success: true,
      message: 'Comment added successfully!',
      comment: newComment
    });
  } catch (err) {
    console.error('Add comment error:', err);
    return res.status(500).json({ success: false, message: 'Failed to add comment.' });
  }
});

module.exports = router;

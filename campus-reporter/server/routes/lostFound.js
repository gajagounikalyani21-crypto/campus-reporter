const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET /api/lost-found - List all lost & found notices
router.get('/', optionalAuth, (req, res) => {
  try {
    const { type, category, status, search } = req.query;

    const items = db.find('lost_found', item => {
      if (type && item.type.toLowerCase() !== type.toLowerCase()) return false;
      if (category && item.category !== category) return false;
      if (status && item.status.toLowerCase() !== status.toLowerCase()) return false;

      if (search) {
        const query = search.toLowerCase();
        const inTitle = item.title && item.title.toLowerCase().includes(query);
        const inDesc = item.description && item.description.toLowerCase().includes(query);
        const inLoc = item.location && item.location.toLowerCase().includes(query);
        if (!inTitle && !inDesc && !inLoc) return false;
      }
      return true;
    }, (a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json({
      success: true,
      count: items.length,
      items
    });
  } catch (err) {
    console.error('Fetch lost & found error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch lost & found items.' });
  }
});

// POST /api/lost-found - Post new lost or found notice
router.post('/', authenticateToken, upload.single('image'), (req, res) => {
  try {
    const { type, title, category, location, date, description, contactInfo } = req.body;

    if (!type || !['Lost', 'Found'].includes(type)) {
      return res.status(400).json({ success: false, message: "Type must be either 'Lost' or 'Found'." });
    }
    if (!title || title.trim().length < 4) {
      return res.status(400).json({ success: false, message: 'Title must be at least 4 characters long.' });
    }
    if (!location || location.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Location is required.' });
    }

    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.imageUrl) {
      imageUrl = req.body.imageUrl;
    }

    const newItem = db.create('lost_found', {
      type,
      title: title.trim(),
      category: category || 'General',
      location: location.trim(),
      date: date || new Date().toISOString().split('T')[0],
      description: description ? description.trim() : '',
      contactInfo: contactInfo ? contactInfo.trim() : req.user.email,
      status: 'Active',
      imageUrl,
      reportedBy: req.user.id,
      reporterName: req.user.name
    });

    return res.status(201).json({
      success: true,
      message: `${type} item notice posted successfully!`,
      item: newItem
    });
  } catch (err) {
    console.error('Create lost & found error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create notice.' });
  }
});

// PUT /api/lost-found/:id/claim - Mark item as Claimed/Returned
router.put('/:id/claim', authenticateToken, (req, res) => {
  try {
    const item = db.findById('lost_found', req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    const isOwner = item.reportedBy === req.user.id;
    const isStaffOrAdmin = req.user.role === 'staff' || req.user.role === 'admin';

    if (!isOwner && !isStaffOrAdmin) {
      return res.status(403).json({ success: false, message: 'Only author, staff, or admin can update status.' });
    }

    const updated = db.update('lost_found', item.id, {
      status: item.status === 'Active' ? 'Claimed' : 'Active',
      claimedAt: new Date().toISOString()
    });

    return res.json({
      success: true,
      message: `Item marked as ${updated.status}.`,
      item: updated
    });
  } catch (err) {
    console.error('Update claim status error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update item.' });
  }
});

module.exports = router;

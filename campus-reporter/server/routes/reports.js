const express = require('express');
const router = express.Router();
const config = require('../config');
const db = require('../db/database');
const { authenticateToken, optionalAuth, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Helper to sanitize report view based on anonymous setting
function formatReport(report, currentUserId = null) {
  const isUpvotedByMe = currentUserId && Array.isArray(report.upvotedBy)
    ? report.upvotedBy.includes(currentUserId)
    : false;

  let displayReporter = report.reporterName;
  if (report.isAnonymous) {
    displayReporter = currentUserId === report.reportedBy ? 'You (Reported Anonymously)' : 'Anonymous Student';
  }

  return {
    ...report,
    reporterName: displayReporter,
    reporterEmail: report.isAnonymous && currentUserId !== report.reportedBy ? null : report.reporterEmail,
    isUpvotedByMe
  };
}

// GET /api/reports - Fetch all reports with filters & search
router.get('/', optionalAuth, (req, res) => {
  try {
    const { status, category, building, priority, search, myReports, assignedToMe, sort } = req.query;
    const currentUserId = req.user ? req.user.id : null;

    let reports = db.find('reports', report => {
      if (status && report.status !== status) return false;
      if (category && report.category !== category) return false;
      if (building && report.building !== building) return false;
      if (priority && report.priority !== priority) return false;

      if (myReports === 'true') {
        if (!currentUserId || report.reportedBy !== currentUserId) return false;
      }

      if (assignedToMe === 'true') {
        if (!currentUserId || report.assignedTo !== currentUserId) return false;
      }

      if (search) {
        const query = search.toLowerCase();
        const inTitle = report.title && report.title.toLowerCase().includes(query);
        const inDesc = report.description && report.description.toLowerCase().includes(query);
        const inLoc = report.locationDetails && report.locationDetails.toLowerCase().includes(query);
        const inBldg = report.building && report.building.toLowerCase().includes(query);
        if (!inTitle && !inDesc && !inLoc && !inBldg) return false;
      }

      return true;
    });

    // Sorting
    if (sort === 'upvotes') {
      reports.sort((a, b) => (b.upvotesCount || 0) - (a.upvotesCount || 0));
    } else if (sort === 'oldest') {
      reports.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sort === 'priority') {
      const priorityWeights = { 'Emergency/Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
      reports.sort((a, b) => (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0));
    } else {
      // default: newest first
      reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    const formatted = reports.map(r => formatReport(r, currentUserId));

    return res.json({
      success: true,
      count: formatted.length,
      reports: formatted
    });
  } catch (err) {
    console.error('Fetch reports error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve reports.' });
  }
});

// GET /api/reports/:id - Fetch single report details with comments
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const report = db.findById('reports', req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    const currentUserId = req.user ? req.user.id : null;
    const comments = db.find('comments', c => c.reportId === report.id, (a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    return res.json({
      success: true,
      report: formatReport(report, currentUserId),
      comments
    });
  } catch (err) {
    console.error('Fetch single report error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve report details.' });
  }
});

// POST /api/reports - Create new incident / facility report
router.post('/', authenticateToken, upload.single('image'), (req, res) => {
  try {
    const {
      title,
      description,
      category,
      building,
      locationDetails,
      priority = 'Medium',
      isAnonymous = 'false'
    } = req.body;

    // Basic validation
    if (!title || title.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Title must be at least 5 characters.' });
    }
    if (!description || description.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Description must be at least 10 characters.' });
    }
    if (!config.CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: 'Invalid category specified.' });
    }
    if (!config.BUILDINGS.includes(building)) {
      return res.status(400).json({ success: false, message: 'Invalid campus building specified.' });
    }

    const anonymousBool = isAnonymous === 'true' || isAnonymous === true;
    let imageUrl = null;

    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.imageUrl) {
      imageUrl = req.body.imageUrl;
    }

    const newReport = db.create('reports', {
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      status: 'Submitted',
      building,
      locationDetails: locationDetails ? locationDetails.trim() : '',
      isAnonymous: anonymousBool,
      reportedBy: req.user.id,
      reporterName: req.user.name,
      reporterEmail: req.user.email,
      assignedTo: null,
      assignedToName: null,
      upvotesCount: 1,
      upvotedBy: [req.user.id], // auto-upvote by reporter
      imageUrl,
      etaHours: null,
      resolutionNotes: null
    });

    // Record activity log
    db.create('activity_logs', {
      reportId: newReport.id,
      userId: req.user.id,
      userName: req.user.name,
      action: 'Report Submitted',
      details: `New issue "${newReport.title}" logged in ${newReport.building}`
    });

    return res.status(201).json({
      success: true,
      message: 'Report submitted successfully!',
      report: formatReport(newReport, req.user.id)
    });
  } catch (err) {
    console.error('Create report error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit report.' });
  }
});

// PUT /api/reports/:id/status - Update ticket status & resolution details
router.put('/:id/status', authenticateToken, (req, res) => {
  try {
    const report = db.findById('reports', req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    const { status, resolutionNotes, etaHours } = req.body;

    if (!config.STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${config.STATUSES.join(', ')}`
      });
    }

    // Role check: Only Staff, Admin, or the original reporter (if resolving/withdrawing) can change status
    const isStaffOrAdmin = req.user.role === config.ROLES.STAFF || req.user.role === config.ROLES.ADMIN;
    const isOwner = report.reportedBy === req.user.id;

    if (!isStaffOrAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'You are not authorized to update this report status.' });
    }

    const updates = { status };
    if (resolutionNotes !== undefined) updates.resolutionNotes = resolutionNotes;
    if (etaHours !== undefined) updates.etaHours = etaHours ? parseInt(etaHours, 10) : null;

    if (status === 'Resolved') {
      updates.resolvedAt = new Date().toISOString();
    }

    // If staff changes status to In Progress and ticket is unassigned, auto-assign to them
    if (req.user.role === config.ROLES.STAFF && !report.assignedTo && status === 'In Progress') {
      updates.assignedTo = req.user.id;
      updates.assignedToName = req.user.name;
    }

    const updatedReport = db.update('reports', report.id, updates);

    // Record activity log
    db.create('activity_logs', {
      reportId: report.id,
      userId: req.user.id,
      userName: req.user.name,
      action: `Status changed to ${status}`,
      details: resolutionNotes ? `Resolution Notes: ${resolutionNotes}` : `Status updated to ${status}`
    });

    return res.json({
      success: true,
      message: `Status updated to '${status}' successfully!`,
      report: formatReport(updatedReport, req.user.id)
    });
  } catch (err) {
    console.error('Update status error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update report status.' });
  }
});

// POST /api/reports/:id/assign - Assign ticket to maintenance staff (Admin or Staff self-assign)
router.post('/:id/assign', authenticateToken, (req, res) => {
  try {
    const report = db.findById('reports', req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    const isStaffOrAdmin = req.user.role === config.ROLES.STAFF || req.user.role === config.ROLES.ADMIN;
    if (!isStaffOrAdmin) {
      return res.status(403).json({ success: false, message: 'Only staff or administrators can assign tickets.' });
    }

    const { staffId } = req.body;
    let targetStaff;

    if (staffId) {
      targetStaff = db.findById('users', staffId);
      if (!targetStaff) {
        return res.status(404).json({ success: false, message: 'Selected staff member was not found.' });
      }
    } else {
      // Self-assign
      targetStaff = req.user;
    }

    const updated = db.update('reports', report.id, {
      assignedTo: targetStaff.id,
      assignedToName: targetStaff.name,
      status: report.status === 'Submitted' ? 'Assigned' : report.status
    });

    db.create('activity_logs', {
      reportId: report.id,
      userId: req.user.id,
      userName: req.user.name,
      action: 'Ticket Assigned',
      details: `Assigned to ${targetStaff.name} (${targetStaff.department || targetStaff.role})`
    });

    return res.json({
      success: true,
      message: `Ticket successfully assigned to ${targetStaff.name}!`,
      report: formatReport(updated, req.user.id)
    });
  } catch (err) {
    console.error('Assign report error:', err);
    return res.status(500).json({ success: false, message: 'Failed to assign report.' });
  }
});

// POST /api/reports/:id/upvote - Upvote / "Me Too" toggle
router.post('/:id/upvote', authenticateToken, (req, res) => {
  try {
    const report = db.findById('reports', req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    const upvotedBy = Array.isArray(report.upvotedBy) ? [...report.upvotedBy] : [];
    const index = upvotedBy.indexOf(req.user.id);
    let isUpvoted = false;

    if (index > -1) {
      // Remove upvote
      upvotedBy.splice(index, 1);
      isUpvoted = false;
    } else {
      // Add upvote
      upvotedBy.push(req.user.id);
      isUpvoted = true;
    }

    const updated = db.update('reports', report.id, {
      upvotedBy,
      upvotesCount: upvotedBy.length
    });

    return res.json({
      success: true,
      message: isUpvoted ? 'Upvoted! Priority escalated.' : 'Upvote removed.',
      upvotesCount: updated.upvotesCount,
      isUpvotedByMe: isUpvoted
    });
  } catch (err) {
    console.error('Upvote error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process upvote.' });
  }
});

// DELETE /api/reports/:id - Remove report (Owner if submitted, or Admin)
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const report = db.findById('reports', req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    const isAdmin = req.user.role === config.ROLES.ADMIN;
    const isOwner = report.reportedBy === req.user.id && report.status === 'Submitted';

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators or the author (before processing starts) can delete a report.'
      });
    }

    db.delete('reports', report.id);

    // Delete associated comments
    const comments = db.find('comments', c => c.reportId === report.id);
    comments.forEach(c => db.delete('comments', c.id));

    return res.json({
      success: true,
      message: 'Report deleted successfully.'
    });
  } catch (err) {
    console.error('Delete report error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete report.' });
  }
});

module.exports = router;

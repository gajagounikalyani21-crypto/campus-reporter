const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const seedDatabase = require('./db/seed');

// Initialize database with realistic seed data if empty
seedDatabase(false);

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

// Public system metadata endpoint (for dropdowns, forms, filter options)
app.get('/api/config', (req, res) => {
  res.json({
    success: true,
    categories: config.CATEGORIES,
    buildings: config.BUILDINGS,
    priorities: config.PRIORITIES,
    statuses: config.STATUSES,
    roles: Object.values(config.ROLES)
  });
});

// Mount API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/reports/:id/comments', require('./routes/comments'));
app.use('/api/lost-found', require('./routes/lostFound'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/stats', require('./routes/stats'));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'An unexpected server error occurred.'
  });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.PORT, () => {
    console.log(`=======================================================`);
    console.log(` Campus Reporter Server running at http://localhost:${config.PORT}`);
    console.log(` API available at http://localhost:${config.PORT}/api`);
    console.log(` Demo Accounts:`);
    console.log(`   - Student: student@campus.edu  / student123`);
    console.log(`   - Staff:   itstaff@campus.edu  / staff123`);
    console.log(`   - Admin:   admin@campus.edu    / admin123`);
    console.log(`=======================================================`);
  });
}

module.exports = app;

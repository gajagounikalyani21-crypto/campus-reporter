const config = require('../config');

function validateRegister(req, res, next) {
  const { name, email, password, role } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push('Full name must be at least 2 characters long.');
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('A valid email address is required.');
  }
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long.');
  }
  if (role && !Object.values(config.ROLES).includes(role)) {
    errors.push(`Role must be one of: ${Object.values(config.ROLES).join(', ')}.`);
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }
  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }
  next();
}

function validateReport(req, res, next) {
  const { title, description, category, building, priority } = req.body;
  const errors = [];

  if (!title || title.trim().length < 5) {
    errors.push('Title must be at least 5 characters long.');
  }
  if (!description || description.trim().length < 10) {
    errors.push('Description must be at least 10 characters long.');
  }
  if (!category || !config.CATEGORIES.includes(category)) {
    errors.push(`Category must be one of: ${config.CATEGORIES.join(', ')}`);
  }
  if (!building || !config.BUILDINGS.includes(building)) {
    errors.push(`Building must be one of: ${config.BUILDINGS.join(', ')}`);
  }
  if (priority && !config.PRIORITIES.includes(priority)) {
    errors.push(`Priority must be one of: ${config.PRIORITIES.join(', ')}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }
  next();
}

function validateComment(req, res, next) {
  const { content } = req.body;
  if (!content || content.trim().length < 2) {
    return res.status(400).json({ success: false, message: 'Comment content cannot be empty.' });
  }
  next();
}

module.exports = {
  validateRegister,
  validateLogin,
  validateReport,
  validateComment
};

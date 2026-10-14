const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validate');

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );
}

// POST /api/auth/register
router.post('/register', validateRegister, (req, res) => {
  try {
    const { name, email, password, role = config.ROLES.STUDENT, department, studentId, phone } = req.body;

    const existingUser = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const newUser = db.create('users', {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      department: department || 'General Campus',
      studentId: studentId || null,
      phone: phone || null,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
    });

    const token = generateToken(newUser);
    const { password: _, ...safeUser } = newUser;

    return res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', validateLogin, (req, res) => {
  try {
    const { email, password } = req.body;
    const user = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase().trim());

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    const { password: _, ...safeUser } = user;

    return res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
});

// POST /api/auth/demo-login (Quick 1-click test credentials for student, staff, admin)
router.post('/demo-login', (req, res) => {
  try {
    const { role } = req.body;
    let targetEmail;

    if (role === 'admin') {
      targetEmail = 'admin@campus.edu';
    } else if (role === 'staff') {
      targetEmail = 'itstaff@campus.edu';
    } else {
      targetEmail = 'student@campus.edu';
    }

    const user = db.findOne('users', u => u.email.toLowerCase() === targetEmail.toLowerCase());
    if (!user) {
      return res.status(404).json({ success: false, message: `Demo user for role ${role} not found.` });
    }

    const token = generateToken(user);
    const { password: _, ...safeUser } = user;

    return res.json({
      success: true,
      message: `Signed in as Demo ${user.role.toUpperCase()}`,
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('Demo login error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during demo login.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  return res.json({
    success: true,
    user: req.user
  });
});

// GET /api/auth/staff (List maintenance staff & administrators for ticket assignment)
router.get('/staff', authenticateToken, (req, res) => {
  const staffUsers = db.find('users', u => u.role === config.ROLES.STAFF || u.role === config.ROLES.ADMIN)
    .map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department,
      phone: u.phone
    }));

  return res.json({
    success: true,
    staff: staffUsers
  });
});

module.exports = router;

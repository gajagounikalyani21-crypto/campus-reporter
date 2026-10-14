const path = require('path');
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'campus-reporter-super-secret-jwt-key-2026',
  JWT_EXPIRES_IN: '7d',
  DATA_DIR: path.join(__dirname, 'db', 'data'),
  UPLOADS_DIR: path.join(__dirname, '..', 'public', 'uploads'),
  ROLES: {
    STUDENT: 'student',
    STAFF: 'staff',
    ADMIN: 'admin'
  },
  CATEGORIES: [
    'Electrical & Power',
    'Plumbing & Water',
    'IT, Wi-Fi & Labs',
    'Classroom & Furniture',
    'Sanitation & Hygiene',
    'Campus Security & Safety',
    'Hostel & Mess',
    'Sports & Grounds',
    'Other Facility'
  ],
  STATUSES: [
    'Submitted',
    'Under Review',
    'Assigned',
    'In Progress',
    'Resolved',
    'Rejected'
  ],
  PRIORITIES: [
    'Low',
    'Medium',
    'High',
    'Emergency/Critical'
  ],
  BUILDINGS: [
    'Academic Block A (Engineering)',
    'Academic Block B (Sciences)',
    'Academic Block C (Humanities & Management)',
    'Central Library & Learning Hub',
    'Main Computer Science & AI Labs',
    'Boys Hostel 1 & 2',
    'Girls Hostel 1 & 2',
    'Central Dining Hall / Cafeteria',
    'Campus Health & Medical Centre',
    'Indoor Sports Complex & Gymnasium',
    'Administrative Block & Dean Office',
    'Campus Grounds & Parking Lots'
  ]
};

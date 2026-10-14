const bcrypt = require('bcryptjs');
const db = require('./database');
const config = require('../config');

function seedDatabase(force = false) {
  const existingUsers = db.find('users');
  if (existingUsers.length > 0 && !force) {
    console.log('[Seed] Database already populated with', existingUsers.length, 'users. Skipping seed.');
    return;
  }

  console.log('[Seed] Seeding database with realistic campus data...');

  // 1. Seed Users
  const salt = bcrypt.genSaltSync(10);
  const studentPassword = bcrypt.hashSync('student123', salt);
  const staffPassword = bcrypt.hashSync('staff123', salt);
  const adminPassword = bcrypt.hashSync('admin123', salt);

  const student1 = db.create('users', {
    id: 'usr-student-001',
    name: 'Sarah Jenkins',
    email: 'student@campus.edu',
    password: studentPassword,
    role: config.ROLES.STUDENT,
    department: 'Computer Science & Engineering',
    studentId: 'CS-2023-042',
    phone: '+1 (555) 234-5678',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
  });

  const student2 = db.create('users', {
    id: 'usr-student-002',
    name: 'Alex Rivera',
    email: 'alex@campus.edu',
    password: studentPassword,
    role: config.ROLES.STUDENT,
    department: 'Electrical Engineering',
    studentId: 'EE-2024-118',
    phone: '+1 (555) 345-6789',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
  });

  const staff1 = db.create('users', {
    id: 'usr-staff-001',
    name: 'David Kim',
    email: 'itstaff@campus.edu',
    password: staffPassword,
    role: config.ROLES.STAFF,
    department: 'IT, Wi-Fi & Labs',
    staffCode: 'STAFF-IT-09',
    phone: '+1 (555) 876-5432',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
  });

  const staff2 = db.create('users', {
    id: 'usr-staff-002',
    name: 'Marcus Vance',
    email: 'civilstaff@campus.edu',
    password: staffPassword,
    role: config.ROLES.STAFF,
    department: 'Plumbing & Water',
    staffCode: 'STAFF-PLUMB-04',
    phone: '+1 (555) 987-6543',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
  });

  const admin1 = db.create('users', {
    id: 'usr-admin-001',
    name: 'Dr. Eleanor Hayes',
    email: 'admin@campus.edu',
    password: adminPassword,
    role: config.ROLES.ADMIN,
    department: 'Campus Infrastructure & Dean of Affairs',
    staffCode: 'DEAN-ADMIN-01',
    phone: '+1 (555) 999-0000',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
  });

  // 2. Seed Reports
  const report1 = db.create('reports', {
    id: 'rep-1001',
    title: 'Projector bulb blown and loose HDMI port in Lecture Hall B-204',
    description: 'During the 9 AM Distributed Systems lecture, the main overhead projector bulb made a popping noise and shut off. Furthermore, the wall-mounted HDMI cable is frayed and only transmits a green flickering signal. Faculty unable to deliver slides.',
    category: 'IT, Wi-Fi & Labs',
    priority: 'High',
    status: 'In Progress',
    building: 'Academic Block B (Sciences)',
    locationDetails: 'Room B-204, 2nd Floor, Main Lecture Amphitheater',
    isAnonymous: false,
    reportedBy: student1.id,
    reporterName: student1.name,
    reporterEmail: student1.email,
    assignedTo: staff1.id,
    assignedToName: staff1.name,
    upvotesCount: 8,
    upvotedBy: [student1.id, student2.id],
    imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600',
    etaHours: 4,
    resolutionNotes: null,
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
  });

  const report2 = db.create('reports', {
    id: 'rep-1002',
    title: 'Major water pipe burst near 2nd floor bathroom corridor',
    description: 'Water is gushing out from the main valve connection into the hallway carpet and flowing near the electrical riser. Water hazard and slipping risk for residents. Needs immediate shut-off and replacement gasket.',
    category: 'Plumbing & Water',
    priority: 'Emergency/Critical',
    status: 'Assigned',
    building: 'Boys Hostel 1 & 2',
    locationDetails: 'Block 1, 2nd Floor West Wing corridor, outside Room 218',
    isAnonymous: false,
    reportedBy: student2.id,
    reporterName: student2.name,
    reporterEmail: student2.email,
    assignedTo: staff2.id,
    assignedToName: staff2.name,
    upvotesCount: 23,
    upvotedBy: [student1.id, student2.id],
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600',
    etaHours: 2,
    resolutionNotes: null,
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString()
  });

  const report3 = db.create('reports', {
    id: 'rep-1003',
    title: 'Wi-Fi Access Point dead in Central Library 3rd floor study zone',
    description: 'The Cisco AP LED light is blinking red. None of the students on the 3rd floor quiet zone can connect to `eduroam` or `Campus-Student` Wi-Fi. Over 50 students are preparing for mid-terms with zero connection.',
    category: 'IT, Wi-Fi & Labs',
    priority: 'Medium',
    status: 'Under Review',
    building: 'Central Library & Learning Hub',
    locationDetails: '3rd Floor, Silent Study Cubicles Section D',
    isAnonymous: false,
    reportedBy: student1.id,
    reporterName: student1.name,
    reporterEmail: student1.email,
    assignedTo: null,
    assignedToName: null,
    upvotesCount: 31,
    upvotedBy: [student1.id],
    imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600',
    etaHours: null,
    resolutionNotes: null,
    createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString()
  });

  const report4 = db.create('reports', {
    id: 'rep-1004',
    title: 'Broken street lamps near East Gate pathway (Safety concern after 8 PM)',
    description: 'Three consecutive street lamps along the pathway connecting Girls Hostel to East Gate are broken or flickering severely. The walkway is completely dark at night, making it unsafe for students walking back from late evening lab sessions.',
    category: 'Campus Security & Safety',
    priority: 'High',
    status: 'Submitted',
    building: 'Campus Grounds & Parking Lots',
    locationDetails: 'Path between Girls Hostel 2 and East Security Gate',
    isAnonymous: true,
    reportedBy: student2.id,
    reporterName: 'Anonymous Student',
    reporterEmail: null,
    assignedTo: null,
    assignedToName: null,
    upvotesCount: 42,
    upvotedBy: [student1.id, student2.id],
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600',
    etaHours: null,
    resolutionNotes: null,
    createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString()
  });

  const report5 = db.create('reports', {
    id: 'rep-1005',
    title: 'AC unit condensation leaking directly above server rack in AI Lab 3',
    description: 'The split AC unit was dripping water onto the secondary edge compute rack. Immediate attention required to prevent circuit shortage and hardware damage.',
    category: 'Electrical & Power',
    priority: 'Emergency/Critical',
    status: 'Resolved',
    building: 'Main Computer Science & AI Labs',
    locationDetails: 'Ground Floor, Room Lab-03, Rack B',
    isAnonymous: false,
    reportedBy: student1.id,
    reporterName: student1.name,
    reporterEmail: student1.email,
    assignedTo: staff1.id,
    assignedToName: staff1.name,
    upvotesCount: 5,
    upvotedBy: [],
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600',
    etaHours: 1,
    resolutionNotes: 'Drainage pipe unblocked, insulation tape replaced, and drip tray sanitized. Rack inspect tested and dry. System restored.',
    resolvedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
  });

  // 3. Seed Comments
  db.create('comments', {
    id: 'cmt-2001',
    reportId: report1.id,
    userId: staff1.id,
    userName: staff1.name,
    userRole: staff1.role,
    content: 'Inspected the projector. Ordered a replacement 3200-lumen lamp from campus central stores. Will arrive by 2 PM and complete installation today.',
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
  });

  db.create('comments', {
    id: 'cmt-2002',
    reportId: report1.id,
    userId: student1.id,
    userName: student1.name,
    userRole: student1.role,
    content: 'Thank you David! Could you also check the audio 3.5mm jack while you are there? It had static last week.',
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
  });

  db.create('comments', {
    id: 'cmt-2003',
    reportId: report2.id,
    userId: staff2.id,
    userName: staff2.name,
    userRole: staff2.role,
    content: 'Emergency shut-off valve isolated. Plumbing crew on site with replacement PVC fittings and high-power wet vacs.',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString()
  });

  // 4. Seed Lost & Found
  db.create('lost_found', {
    id: 'lf-3001',
    type: 'Lost',
    title: 'Black Lenovo ThinkPad Laptop in Gray Inateck Sleeve',
    category: 'Electronics',
    location: 'Cafeteria South Wing, Table 14',
    date: new Date(Date.now() - 20 * 3600 * 1000).toISOString().split('T')[0],
    description: 'Left behind during lunch rush around 1:30 PM. Has stickers of React, GitHub Octocat, and Docker on the lid. Very important thesis work inside!',
    contactInfo: 'student@campus.edu or WhatsApp +1-555-234-5678',
    status: 'Active',
    reportedBy: student1.id,
    reporterName: student1.name
  });

  db.create('lost_found', {
    id: 'lf-3002',
    type: 'Found',
    title: 'Blue Hydro Flask Water Bottle with Campus Gym sticker',
    category: 'Personal Belongings',
    location: 'Indoor Sports Complex, Court 2 bleachers',
    date: new Date(Date.now() - 10 * 3600 * 1000).toISOString().split('T')[0],
    description: 'Found after the inter-batch badminton tournament. 32oz insulated bottle, navy blue color. Handed over to the Sports Center front desk.',
    contactInfo: 'Claim at Sports Center Reception (Mon-Fri 8 AM - 6 PM)',
    status: 'Active',
    reportedBy: staff1.id,
    reporterName: staff1.name
  });

  db.create('lost_found', {
    id: 'lf-3003',
    type: 'Found',
    title: 'Set of 3 Keys on a Red NASA Lanyard with Flash Drive',
    category: 'Keys & IDs',
    location: 'Central Library, 2nd floor photocopying station',
    date: new Date(Date.now() - 48 * 3600 * 1000).toISOString().split('T')[0],
    description: 'Two brass keys, one bike key, and a 64GB Kingston flash drive on red lanyard. Deposited at Library Security Desk.',
    contactInfo: 'Library Security Cabin (Ext: 4421)',
    status: 'Claimed',
    reportedBy: admin1.id,
    reporterName: admin1.name
  });

  // 5. Seed Announcements / Campus Alerts
  db.create('announcements', {
    id: 'ann-4001',
    title: 'Notice: Scheduled Electrical Substation Maintenance on Saturday',
    content: 'Power supply will be temporarily switched to backup generators in Academic Blocks A & B this Saturday between 6:00 AM and 10:00 AM for routine transformer maintenance. Please save your lab work beforehand.',
    priority: 'Normal',
    authorName: 'Dr. Eleanor Hayes (Infrastructure Dean)',
    pinned: true,
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
  });

  db.create('announcements', {
    id: 'ann-4002',
    title: 'Emergency Advisory: High-Wind Storm Warning - Keep Windows Closed',
    content: 'Severe thunderstorm expected tonight between 7 PM and 11 PM. All hostel residents and lab coordinators are strictly requested to latch all exterior windows and report any fallen branches or water ingress immediately via Campus Reporter.',
    priority: 'Urgent',
    authorName: 'Campus Safety & Disaster Cell',
    pinned: true,
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString()
  });

  console.log('[Seed] Database seeded successfully!');
}

module.exports = seedDatabase;

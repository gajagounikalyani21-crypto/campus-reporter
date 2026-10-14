# 🏫 Campus Reporter - Smart Campus Incident & Grievance System

[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-blue.svg)](https://expressjs.com/)
[![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen.svg)]()
[![License](https://img.shields.io/badge/License-MIT-purple.svg)]()

> A full-stack, enterprise-grade campus facility issue tracking, incident management, and grievance redressal system built for universities, colleges, and residential campuses.

---

## 🎯 The Campus Reporter Problem

### The Challenge
Across university campuses, hundreds of physical and facility issues occur every week:
- **Electrical failures**: Broken projectors in lecture amphitheatres, malfunctioning ACs in server/AI labs, flickering hallway lamps.
- **Plumbing hazards**: Water pipe leakages in student hostels, clogged drains, broken restroom fixtures.
- **IT & Connectivity**: Dead Wi-Fi access points in quiet library zones, faulty ethernet ports.
- **Campus Safety & Grievances**: Pitch-dark walkways at night, damaged doors/locks, sensitive complaints (ragging, harassment, code-of-conduct violations).
- **Lost & Found Items**: Laptops, ID cards, keys, and water bottles left behind in dining halls and athletic facilities.

### Why Traditional Methods Fail
1. **Scattered reporting**: Complaints are made through WhatsApp groups, sticky notes, paper logs in security booths, or verbal complaints that get lost.
2. **Issue Duplication**: 30 students report the exact same broken library Wi-Fi router, overwhelming staff.
3. **Zero Accountability & Transparency**: Students have no ticket number, no estimated resolution time, and no way to know if their issue was received or is being worked on.
4. **Retaliation Fears**: Students avoid reporting sensitive issues (e.g. harassment, ragging) because there is no trusted anonymous reporting pipeline.
5. **Administrative Blind Spots**: Deans and facility directors lack metrics on average turnaround time, repeat hardware failures, or department backlogs.

---

## 💡 The Solution: Campus Reporter

**Campus Reporter** provides a unified, role-based digital operating system for campus infrastructure:

- 🎓 **Student & Faculty Portal**:
  - **1-Click Issue Submission**: Title, department category, campus building/floor/room, priority, and photo evidence upload.
  - **Anonymous Reporting Mode**: Allows students to report sensitive safety/ragging incidents without public disclosure of their name or email.
  - **Community "Me Too" Upvoting**: Aggregates duplicate concerns and escalates priority for issues affecting dozens of students.
  - **Visual Ticket Lifecycle Tracker**: Track progress in real-time (`Submitted` ➔ `Under Review` ➔ `Assigned` ➔ `In Progress` ➔ `Resolved`).
  - **Interactive Discussion Thread**: Communicate directly with assigned maintenance staff.
  - **Lost & Found Exchange**: Post and claim lost personal belongings across campus.
  - **Campus SOS Emergency Hub**: 1-click speed dial directory for Campus Security, Ambulance, Anti-Ragging Cell, and Night Wardens.

- 🛠️ **Department Technician / Staff Portal**:
  - Filter ticket queues by assigned department (IT & Labs, Electrical, Plumbing, Sanitation, Security).
  - Update ticket status, provide estimated turnaround time (ETA hours), and add resolution proof and closing notes.

- 🏛️ **Dean & Campus Administrator Dashboard**:
  - **Executive KPI Metrics**: Active tickets, resolution rate (%), average time-to-fix (hours), critical unresolved alerts.
  - **Visual Interactive Analytics**: Charts powered by Chart.js displaying incident distribution by department and building hotspots.
  - **Staff Assignment Workflow**: Delegate tickets directly to maintenance technicians.
  - **Audit CSV Export**: Download complete campus maintenance histories for compliance and facility auditing.
  - **Campus-Wide Broadcast Alerts**: Publish emergency maintenance notices and severe weather alerts directly to student dashboard banners.

---

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js, RESTful API architecture
- **Authentication**: JWT (JSON Web Tokens), `bcryptjs` password hashing, Role-Based Access Control (RBAC)
- **Data Layer**: Persistent atomic JSON database engine with transaction-safe writes
- **File Uploads**: `multer` image processing with MIME validation (JPEG, PNG, WEBP)
- **Frontend**: Responsive Single-Page Application (SPA), Tailwind CSS, FontAwesome 6, Chart.js
- **Testing**: Node.js native test runner (`node --test`) covering Auth, Reports, and Admin analytics

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v20 / v24)
- **npm** v9+

### 2. Installation
```bash
# Clone or navigate to the project directory
cd campus-reporter

# Install dependencies
npm install
```

### 3. Run the Server
```bash
# Start server in production mode
npm start

# Or run with auto-reload (development mode)
npm run dev
```

The application will start at:
👉 **http://localhost:3000**

---

## 🔑 Preloaded Demo Accounts

The database comes pre-seeded with realistic campus users and issues. You can use the **1-Click Demo Bar** in the top navigation, or sign in manually with these credentials:

| Role | Name | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | Sarah Jenkins | `student@campus.edu` | `student123` | Submit issues, upvote, comment, report lost items |
| **Staff (IT)** | David Kim | `itstaff@campus.edu` | `staff123` | Update status, set ETA, add resolution proof, view admin tab |
| **Staff (Civil)** | Marcus Vance | `civilstaff@campus.edu` | `staff123` | Plumbing & structural maintenance queue |
| **Dean / Admin** | Dr. Eleanor Hayes | `admin@campus.edu` | `admin123` | Full dashboard, assign tickets, CSV export, broadcast alerts |

---

## 🧪 Running Automated Tests

Campus Reporter includes an automated test suite verifying authentication, ticket lifecycles, and administrator exports:

```bash
npm test
```

Expected output:
```
✔ Auth API - Demo Login for Student
✔ Auth API - Demo Login for Admin
✔ Auth API - User Registration and Profile Retrieval
✔ Auth API - Reject Invalid Login Credentials
✔ Reports API - Fetch all reports with filters
✔ Reports API - Submit a new incident report and upvote it
✔ Stats API - Metrics computation and counts
✔ Stats API - Admin CSV Report Export
✔ Announcements API - Fetch and create notice
ℹ tests 9 | pass 9 | fail 0
```

---

## 📁 Project Structure

```
campus-reporter/
├── package.json               # Node.js dependencies & scripts
├── README.md                  # Comprehensive project guide
├── ARCHITECTURE.md            # System architecture & data flow
├── API_DOCS.md                # Full REST API endpoint specification
│
├── server/
│   ├── index.js               # Express server entry point & route mounting
│   ├── config.js              # Campus metadata, buildings, categories, roles
│   ├── db/
│   │   ├── database.js        # Atomic file-backed JSON database engine
│   │   ├── seed.js            # Realistic seed data (users, tickets, announcements)
│   │   └── data/              # Persistent data store (.json files)
│   ├── middleware/
│   │   ├── auth.js            # JWT verification & role authorization (Student/Staff/Admin)
│   │   ├── upload.js          # Multer image evidence upload configuration
│   │   └── validate.js        # Request body input sanitization
│   └── routes/
│       ├── auth.js            # Register, login, current profile, staff directory
│       ├── reports.js         # Report CRUD, filtering, upvoting, status workflow
│       ├── comments.js        # Threaded discussion & work log updates
│       ├── lostFound.js       # Campus lost & found management
│       ├── announcements.js   # Campus-wide alert bulletins
│       └── stats.js           # Analytics computation & CSV report export
│
├── public/                    # Frontend Single Page Application
│   ├── index.html             # Main dashboard UI
│   ├── css/
│   │   └── styles.css         # Glassmorphism, pulses, lifecycle step indicators
│   ├── js/
│   │   ├── api.js             # Client-side API fetch wrapper
│   │   ├── auth.js            # User session & 1-click demo switcher
│   │   ├── app.js             # Tab navigation & global modal controllers
│   │   ├── reports.js         # Issue feed, filters, detail modal & workflow actions
│   │   ├── admin.js           # Chart.js analytics & CSV download controller
│   │   ├── lostfound.js       # Lost and found item cards & claim logic
│   │   └── utils.js           # Toast alerts, date formatting, security sanitization
│   └── uploads/               # Stored photo evidence files
│
└── tests/
    ├── auth.test.js           # Auth & JWT verification tests
    ├── reports.test.js        # Issue creation, upvotes, and status transition tests
    └── stats.test.js          # Analytics metrics and CSV export tests
```

---

## 🛡️ License

This project is licensed under the MIT License. Open for educational and campus deployment.

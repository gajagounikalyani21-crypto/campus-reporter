# 🏗️ Campus Reporter - System Architecture & Technical Design

This document details the software architecture, data models, state machines, and security protocols governing **Campus Reporter**.

---

## 1. High-Level System Architecture

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|                                                                                   |
|  +--------------------+  +--------------------+  +-----------------------------+  |
|  | Student / Reporter |  | Maintenance Staff  |  | Dean / Campus Administrator |  |
|  | - Issue Submission |  | - Assigned Queue   |  | - KPI Metrics & Analytics   |  |
|  | - Upvoting ("Me Too") - Resolution Proof   |  | - Staff Assignment          |  |
|  | - Lost & Found     |  | - ETA Updates      |  | - Audit CSV Export          |  |
|  | - Anonymous Alerts |  | - Work Logs        |  | - Broadcast Alerts          |  |
|  +--------------------+  +--------------------+  +-----------------------------+  |
|                            | (HTTP/JSON + JWT)                                    |
+----------------------------|------------------------------------------------------+
                             v
+-----------------------------------------------------------------------------------+
|                              EXPRESS APPLICATION LAYER                            |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                           Security & Middleware                             |  |
|  |   [JWT Auth Guard]  •  [RBAC Authorization]  •  [Multer File Upload Validator] |  |
|  +-----------------------------------------------------------------------------+  |
|                                    |                                              |
|  +---------------------------------+-------------------------------------------+  |
|  |                           REST API Controllers                              |  |
|  |   /api/auth         /api/reports      /api/comments     /api/lost-found     |  |
|  |   /api/announcements                  /api/stats                            |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------------------+
|                               PERSISTENCE & DATA LAYER                            |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |               Atomic Transaction-Safe JSON Database Engine                  |  |
|  |   users.json  •  reports.json  •  comments.json  •  announcements.json     |  |
|  |   lost_found.json  •  activity_logs.json                                   |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Issue Lifecycle State Machine

Each campus ticket progresses through a deterministic state machine:

```
                  +-------------------+
                  |     Submitted     |
                  +-------------------+
                            |
             [Admin/Staff Reviews Urgency]
                            v
                  +-------------------+
                  |   Under Review    |
                  +-------------------+
                            |
             [Assigned to Dept Technician]
                            v
                  +-------------------+
                  |     Assigned      |
                  +-------------------+
                            |
             [Technician Begins Repair & Sets ETA]
                            v
                  +-------------------+
                  |    In Progress    |
                  +-------------------+
                     /             \
       [Work Completed]         [Invalid / Spam]
                   /                 \
                  v                   v
        +-------------------+  +-------------------+
        |     Resolved      |  |     Rejected      |
        +-------------------+  +-------------------+
```

### State Definitions
- **Submitted**: The report has been created by a student or faculty member and is pending review.
- **Under Review**: Campus maintenance coordinator has acknowledged the ticket and is verifying location/parts.
- **Assigned**: The ticket has been assigned to a specific technician (e.g., Electrician, IT Technician, Plumber).
- **In Progress**: Active repair is underway. Estimated completion time (ETA hours) is published.
- **Resolved**: Repair is complete. Resolution proof and closing notes are recorded on the ticket.
- **Rejected**: Duplicate, invalid location, or out-of-scope report.

---

## 3. Data Models & Entity Relationships

### 1. `User` Model
```json
{
  "id": "usr-student-001",
  "name": "Sarah Jenkins",
  "email": "student@campus.edu",
  "password": "<bcrypt-hash>",
  "role": "student | staff | admin",
  "department": "Computer Science & Engineering",
  "studentId": "CS-2023-042",
  "phone": "+1 (555) 234-5678",
  "avatar": "https://...",
  "createdAt": "2026-10-14T10:00:00Z"
}
```

### 2. `Report` Model
```json
{
  "id": "rep-1001",
  "title": "Projector bulb blown in Lecture Hall B-204",
  "description": "Blown bulb during 9 AM lecture. HDMI cable also frayed.",
  "category": "IT, Wi-Fi & Labs",
  "priority": "Low | Medium | High | Emergency/Critical",
  "status": "Submitted | Under Review | Assigned | In Progress | Resolved | Rejected",
  "building": "Academic Block B (Sciences)",
  "locationDetails": "Room B-204, 2nd Floor",
  "isAnonymous": false,
  "reportedBy": "usr-student-001",
  "reporterName": "Sarah Jenkins",
  "reporterEmail": "student@campus.edu",
  "assignedTo": "usr-staff-001",
  "assignedToName": "David Kim",
  "upvotesCount": 18,
  "upvotedBy": ["usr-student-001", "usr-student-002"],
  "imageUrl": "/uploads/proof-123.jpg",
  "etaHours": 4,
  "resolutionNotes": "Replaced projector lamp with 3200-lumen unit.",
  "resolvedAt": "2026-10-14T14:00:00Z",
  "createdAt": "2026-10-14T09:15:00Z"
}
```

### 3. `Comment` Model
```json
{
  "id": "cmt-2001",
  "reportId": "rep-1001",
  "userId": "usr-staff-001",
  "userName": "David Kim",
  "userRole": "staff",
  "content": "Replacement lamp collected from central stores. Installing now.",
  "createdAt": "2026-10-14T11:00:00Z"
}
```

### 4. `LostFound` Model
```json
{
  "id": "lf-3001",
  "type": "Lost | Found",
  "title": "Black Lenovo ThinkPad Laptop in Gray Sleeve",
  "category": "Electronics",
  "location": "Cafeteria South Wing, Table 14",
  "date": "2026-10-14",
  "description": "Stickers of React and GitHub on lid.",
  "contactInfo": "student@campus.edu",
  "status": "Active | Claimed",
  "reportedBy": "usr-student-001",
  "reporterName": "Sarah Jenkins",
  "createdAt": "2026-10-14T12:00:00Z"
}
```

---

## 4. Security & Privacy Design

### Role-Based Access Control (RBAC)
| Capability | Student | Staff | Admin / Dean |
| :--- | :---: | :---: | :---: |
| Browse Public Reports & Upvote | ✅ | ✅ | ✅ |
| Submit New Incident Report | ✅ | ✅ | ✅ |
| Upload Photo Proof | ✅ | ✅ | ✅ |
| Comment on Tickets | ✅ | ✅ | ✅ |
| Update Ticket Status & ETA | ❌ | ✅ | ✅ |
| Assign Technician to Ticket | ❌ | Self-Assign | ✅ Full Delegation |
| View Dean Analytics Dashboard | ❌ | ✅ | ✅ |
| Export Audit CSV Spreadsheet | ❌ | ✅ | ✅ |
| Broadcast Campus Bulletins | ❌ | ✅ | ✅ |

### Anonymous Reporting Privacy
When `isAnonymous` is checked by a student:
- Public queries (`GET /api/reports`) automatically mask the reporter's name as `"Anonymous Student"` and strip their email address (`null`).
- Only the original submitter sees `"You (Reported Anonymously)"` to track their own ticket.
- Database records securely preserve the audit identifier for administrative safety checks in cases of emergency/vandalism.

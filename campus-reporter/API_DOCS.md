# 📡 Campus Reporter - REST API Reference

Base URL: `http://localhost:3000/api`

---

## 1. Authentication Endpoints

### Register Account
`POST /api/auth/register`
- **Body**:
  ```json
  {
    "name": "Alex Rivera",
    "email": "alex@campus.edu",
    "password": "password123",
    "role": "student",
    "department": "Electrical Engineering",
    "studentId": "EE-2024-118"
  }
  ```
- **Response** `201 Created`:
  ```json
  {
    "success": true,
    "message": "Registration successful!",
    "token": "eyJhbGciOi...",
    "user": { "id": "usr-...", "name": "Alex Rivera", "email": "alex@campus.edu", "role": "student" }
  }
  ```

### Login
`POST /api/auth/login`
- **Body**:
  ```json
  {
    "email": "student@campus.edu",
    "password": "student123"
  }
  ```
- **Response** `200 OK`:
  ```json
  {
    "success": true,
    "message": "Login successful!",
    "token": "eyJhbGciOi...",
    "user": { ... }
  }
  ```

### Demo Login (1-Click Switch)
`POST /api/auth/demo-login`
- **Body**: `{ "role": "student" | "staff" | "admin" }`

### Current User Profile
`GET /api/auth/me`
- **Headers**: `Authorization: Bearer <token>`

### List Campus Staff & Technicians
`GET /api/auth/staff`
- **Headers**: `Authorization: Bearer <token>`
- Returns list of staff and administrator profiles for ticket delegation.

---

## 2. Incident & Report Endpoints

### List Reports (With Filters)
`GET /api/reports`
- **Query Parameters**:
  - `status`: Filter by status (`Submitted`, `In Progress`, `Resolved`, etc.)
  - `category`: Filter by category
  - `building`: Filter by campus building
  - `priority`: Filter by priority (`Low`, `Medium`, `High`, `Emergency/Critical`)
  - `search`: Keyword search in title, description, and location
  - `sort`: `newest` | `upvotes` | `priority` | `oldest`
  - `myReports`: `true` | `false`
  - `assignedToMe`: `true` | `false`

### Get Single Report
`GET /api/reports/:id`
- Returns full report details, comments, and upvote state.

### Submit New Report
`POST /api/reports`
- **Headers**: `Authorization: Bearer <token>`
- **Content-Type**: `multipart/form-data` or `application/json`
- **Fields**:
  - `title` (string, required)
  - `description` (string, required)
  - `category` (string, required)
  - `building` (string, required)
  - `locationDetails` (string, optional)
  - `priority` (string: `Low`, `Medium`, `High`, `Emergency/Critical`)
  - `isAnonymous` (boolean string: `"true"` / `"false"`)
  - `image` (binary file upload, optional)

### Update Report Status & Resolution Proof
`PUT /api/reports/:id/status`
- **Headers**: `Authorization: Bearer <token>` (Staff or Admin)
- **Body**:
  ```json
  {
    "status": "Resolved",
    "resolutionNotes": "Replaced cracked gasket and dried floor.",
    "etaHours": 0
  }
  ```

### Assign Ticket to Staff
`POST /api/reports/:id/assign`
- **Headers**: `Authorization: Bearer <token>` (Staff or Admin)
- **Body**:
  ```json
  {
    "staffId": "usr-staff-001"
  }
  ```

### Upvote / "Me Too" Toggle
`POST /api/reports/:id/upvote`
- **Headers**: `Authorization: Bearer <token>`
- Toggles the current user's upvote. Increments or decrements `upvotesCount`.

---

## 3. Discussion & Comment Endpoints

### List Comments
`GET /api/reports/:id/comments`

### Post Comment
`POST /api/reports/:id/comments`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "content": "Replacement part ordered. ETA 2 PM."
  }
  ```

---

## 4. Lost & Found Endpoints

### List Notices
`GET /api/lost-found`
- **Query Parameters**:
  - `type`: `Lost` | `Found`
  - `search`: Search title or location

### Post Notice
`POST /api/lost-found`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ "type": "Lost", "title": "Blue Hydroflask", "location": "Library 2nd Floor", "contactInfo": "555-0123" }`

### Mark as Claimed
`PUT /api/lost-found/:id/claim`
- **Headers**: `Authorization: Bearer <token>`

---

## 5. Analytics & Export Endpoints

### Dashboard Metrics
`GET /api/stats`
- Returns total counts, open/resolved ratio, resolution rate %, average turnaround time in hours, and breakdown distributions.

### Export Reports to CSV
`GET /api/stats/export`
- **Headers**: `Authorization: Bearer <token>` (Staff or Admin)
- Returns downloadable `.csv` spreadsheet containing complete campus audit logs.

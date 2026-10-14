process.env.NODE_ENV = 'test';
const test = require('node:test');
const assert = require('node:assert');
const app = require('../server/index');
const http = require('http');

let server;
let baseUrl;
let studentToken;
let staffToken;

test.before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/api`;
      resolve();
    });
  });

  // Get student token
  const sRes = await fetch(`${baseUrl}/auth/demo-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'student' })
  });
  const sData = await sRes.json();
  studentToken = sData.token;

  // Get staff token
  const stRes = await fetch(`${baseUrl}/auth/demo-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'staff' })
  });
  const stData = await stRes.json();
  staffToken = stData.token;
});

test.after(async () => {
  await new Promise((resolve) => {
    server.close(resolve);
  });
});

test('Reports API - Fetch all reports with filters', async () => {
  const res = await fetch(`${baseUrl}/reports`);
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(Array.isArray(data.reports));
  assert.ok(data.reports.length > 0, 'Should return seeded reports');
});

test('Reports API - Submit a new incident report and upvote it', async () => {
  const reportPayload = {
    title: 'Ceiling Fan Making Squeaking Noise in Physics Lab',
    description: 'The ceiling fan directly above bench 3 is vibrating heavily and making a loud screeching noise during lectures.',
    category: 'Electrical & Power',
    building: 'Academic Block B (Sciences)',
    locationDetails: 'Physics Lab 101, 1st floor',
    priority: 'Low',
    isAnonymous: false
  };

  const createRes = await fetch(`${baseUrl}/reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify(reportPayload)
  });
  const createData = await createRes.json();
  assert.strictEqual(createRes.status, 201);
  assert.strictEqual(createData.success, true);
  assert.strictEqual(createData.report.status, 'Submitted');
  const reportId = createData.report.id;

  // Toggle upvote
  const upvoteRes = await fetch(`${baseUrl}/reports/${reportId}/upvote`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  const upvoteData = await upvoteRes.json();
  assert.strictEqual(upvoteRes.status, 200);
  assert.strictEqual(upvoteData.success, true);

  // Staff updates status to In Progress
  const statusRes = await fetch(`${baseUrl}/reports/${reportId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`
    },
    body: JSON.stringify({
      status: 'In Progress',
      etaHours: 3
    })
  });
  const statusData = await statusRes.json();
  assert.strictEqual(statusRes.status, 200);
  assert.strictEqual(statusData.report.status, 'In Progress');

  // Add comment
  const commentRes = await fetch(`${baseUrl}/reports/${reportId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`
    },
    body: JSON.stringify({
      content: 'Scheduled maintenance bearing lubrication for this afternoon.'
    })
  });
  const commentData = await commentRes.json();
  assert.strictEqual(commentRes.status, 201);
  assert.strictEqual(commentData.success, true);
});

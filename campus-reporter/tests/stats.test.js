process.env.NODE_ENV = 'test';
const test = require('node:test');
const assert = require('node:assert');
const app = require('../server/index');
const http = require('http');

let server;
let baseUrl;
let adminToken;

test.before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/api`;
      resolve();
    });
  });

  const res = await fetch(`${baseUrl}/auth/demo-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'admin' })
  });
  const data = await res.json();
  adminToken = data.token;
});

test.after(async () => {
  await new Promise((resolve) => {
    server.close(resolve);
  });
});

test('Stats API - Metrics computation and counts', async () => {
  const res = await fetch(`${baseUrl}/stats`);
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(data.stats.totalReports >= 5);
  assert.ok(typeof data.stats.resolutionRate === 'number');
  assert.ok(data.stats.categoryCounts);
  assert.ok(data.stats.buildingCounts);
});

test('Stats API - Admin CSV Report Export', async () => {
  const res = await fetch(`${baseUrl}/stats/export`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.headers.get('content-type'), 'text/csv; charset=utf-8');
  const text = await res.text();
  assert.ok(text.includes('Ticket ID,Title,Category'));
});

test('Announcements API - Fetch and create notice', async () => {
  const listRes = await fetch(`${baseUrl}/announcements`);
  const listData = await listRes.json();
  assert.strictEqual(listRes.status, 200);
  assert.ok(Array.isArray(listData.announcements));

  const createRes = await fetch(`${baseUrl}/announcements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      title: 'Water Supply Shutdown for Maintenance',
      content: 'Water supply to West Block will be suspended between 2 PM and 5 PM today for valve checks.',
      priority: 'Normal',
      pinned: true
    })
  });
  const createData = await createRes.json();
  assert.strictEqual(createRes.status, 201);
  assert.strictEqual(createData.success, true);
});

process.env.NODE_ENV = 'test';
const test = require('node:test');
const assert = require('node:assert');
const app = require('../server/index');
const http = require('http');

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/api`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => {
    server.close(resolve);
  });
});

test('Auth API - Demo Login for Student', async () => {
  const res = await fetch(`${baseUrl}/auth/demo-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'student' })
  });
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.user.role, 'student');
  assert.ok(data.token, 'Token should be returned');
});

test('Auth API - Demo Login for Admin', async () => {
  const res = await fetch(`${baseUrl}/auth/demo-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'admin' })
  });
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.user.role, 'admin');
  assert.ok(data.token);
});

test('Auth API - User Registration and Profile Retrieval', async () => {
  const randomEmail = `testuser_${Date.now()}@campus.edu`;
  const registerRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Engineer',
      email: randomEmail,
      password: 'password123',
      role: 'student',
      department: 'Robotics Engineering',
      studentId: 'ROB-2025-01'
    })
  });
  const registerData = await registerRes.json();
  assert.strictEqual(registerRes.status, 201);
  assert.strictEqual(registerData.success, true);
  assert.strictEqual(registerData.user.email, randomEmail);

  // Profile retrieval via GET /api/auth/me
  const meRes = await fetch(`${baseUrl}/auth/me`, {
    headers: { 'Authorization': `Bearer ${registerData.token}` }
  });
  const meData = await meRes.json();
  assert.strictEqual(meRes.status, 200);
  assert.strictEqual(meData.user.name, 'Test Engineer');
});

test('Auth API - Reject Invalid Login Credentials', async () => {
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'nonexistent@campus.edu',
      password: 'wrongpassword'
    })
  });
  const data = await res.json();
  assert.strictEqual(res.status, 401);
  assert.strictEqual(data.success, false);
});

# 🚀 Deployment Guide - Campus Reporter

This guide covers deploying **Campus Reporter** to production cloud platforms.

---

## 1. Instant Free Deployment (Render)

1. Push this repository to GitHub or GitLab.
2. Sign up / Log in to [Render.com](https://render.com).
3. Click **New +** ➔ **Web Service**.
4. Connect your `campus-reporter` repository.
5. Configure settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server/index.js`
   - **Plan**: `Free`
6. Click **Deploy Web Service**.
7. Render will provide a permanent public URL: `https://your-app.onrender.com`.

---

## 2. Deploy on Railway

1. Sign up at [Railway.app](https://railway.app).
2. Click **New Project** ➔ **Deploy from GitHub repo**.
3. Select `campus-reporter`.
4. Railway will automatically detect Node.js, run `npm install`, and launch `npm start`.
5. Under service **Settings** ➔ **Networking**, click **Generate Domain**.

---

## 3. Deploy on Vercel / Cyclic / Fly.io

- **Fly.io**:
  ```bash
  fly launch
  fly deploy
  ```
- **DigitalOcean App Platform**: Select Node.js, set Run Command to `npm start`.

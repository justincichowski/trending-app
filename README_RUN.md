# Trending App — Run & Deploy Instructions

This project is now wired to run consistently in three modes:
- Local all-in-one (`npm run start`)
- Local build + preview (`npm run build && npm run preview`)
- Vercel deployment (`npm run buildv` with output set to `client/dist`)

---

## 🚀 Local Development

### 1. Run everything together (API + frontend)
```bash
npm run start
```
- Fastify local API → http://localhost:3000/api/health  
- Vite frontend → http://localhost:5173 (proxies `/api/*` → `:3000`)  

This uses the same code as Vercel Functions but wrapped in a local Fastify server.

### 2. Build + preview (SPA only)
```bash
npm run build
npm run preview
```
- Builds static frontend → `client/dist`
- Serves it locally on http://localhost:5174
- To preview with live local API, also run:
```bash
npm run api:start
```

### 3. API only
```bash
npm run api:start
```
- Starts the Fastify API alone on http://localhost:3000

### 4. Client only (no API)
```bash
npm run client:dev
```
- Starts only Vite frontend (http://localhost:5173).  
- Requires an API base (`/api`) to be available (either via `api:start` or deployed).

---

## 🌐 Vercel Deployment

### Vercel Settings
In your Vercel Project Settings → Build & Output:

- **Framework Preset:** Vite
- **Build Command:** `npm run buildv`
- **Output Directory:** `client/dist`
- **Root Directory:** project root (where this README lives)

### Environment Variables
- Add `YOUTUBE_API_KEY` under Vercel → Project → Settings → Environment Variables.  
  (Add it in both *Preview* and *Production*.)

### Do I need a custom Node install?
No — you do **not** need to install Node manually.  
- Vercel detects your `package.json` in the root.  
- It installs dependencies with `npm install`.  
- It runs your configured **Build Command** (`npm run buildv`).  
- Functions under `/api/*.ts` are automatically built into Node serverless functions by Vercel.

You do **not** need to use the `server/` or `server_local.ts` for Vercel — those are only for running locally.  
On Vercel, everything under `/api/*` becomes a serverless endpoint.

---

## 📜 Available Scripts (root `package.json`)

- `start` → Run local API + client (parity with prod)
- `api:start` → Run local API only
- `client:dev` → Run client only
- `build` → Build frontend locally (`client/dist`)
- `preview` → Serve built frontend locally
- `buildv` → Build frontend for Vercel

---

## ✅ Smoke Tests

After deploying to Vercel, verify:

- https://your-app.vercel.app/api/health → `{ status: "ok" }`
- https://your-app.vercel.app/api/presets → list of presets
- https://your-app.vercel.app/api/toptrends → needs YOUTUBE_API_KEY
- https://your-app.vercel.app/api/trending → aggregated feed
- https://your-app.vercel.app → SPA loads (dark theme by default)

### Ports quick reference
- Fastify local API: http://localhost:3000
- Vite dev server: http://localhost:5173
- Vite preview: http://localhost:5174

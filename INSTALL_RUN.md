
# Quick Install & Run Guide

This file explains **the simplest way** to get the app running locally, build it, and preview the build.

---

## 1. One-command install + dev + build

Run this from the **root** of the repo:

#  Linux / macOS (bash/zsh)
npm install && cd client && npm install && cd .. && npm run dev && npm run build

# Windows PowerShell
npm install; cd client; npm install; cd ..; npm run dev; npm run build
"start": "npm install && cd client && npm install && cd .. && npm run dev && npm run build",


### What this does:
1. Installs root dependencies (serverless functions).
2. Installs client dependencies (frontend).
3. Starts both local API (`vercel dev` on :3000) **and** client dev server (`vite` on :5173).
4. Runs a production build (`client/dist`).

> ⚠️ **Note:** When `npm run dev` is running, your browser shows the live dev server at http://localhost:5173.  
> The build files are generated at `client/dist`, but you won’t see them until you stop dev and run preview (see below).

---

## 2. Previewing the build separately

After you’ve built with `npm run build`, you can preview the static production build with:


- **Day-to-day dev:** use `npm run dev` (or the one-liner above) → hot reload at http://localhost:5173.  
- **Test production build locally:** stop dev, run `npm run build && npm run preview` → http://localhost:5174.  
- **Deploy:** push to GitHub → Vercel runs `npm run buildv` and deploys `client/dist` + `/api` functions.


# Linux / macOS (bash/zsh)

VITE_API_URL="https://your-app.vercel.app/api" npm run build
npm run preview

# Windows PowerShell
$env:VITE_API_URL="https://your-app.vercel.app/api"; npm run build
npm run preview

Windows CMD (Command Prompt)
set VITE_API_URL=https://your-app.vercel.app/api
npm run build
npm run preview

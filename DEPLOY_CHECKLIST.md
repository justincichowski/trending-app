# Deploy & Run — Quick Checklist

- [ ] `npm run dev` (Terminal A: Vite; Terminal B: `npm run dev:api` automatically via concurrently)
- [ ] Visit http://localhost:5173 — app loads in dark theme
- [ ] API smoke tests:
    - [ ] http://localhost:3000/api/health (ok)
    - [ ] http://localhost:3000/api/presets (list)
    - [ ] http://localhost:3000/api/toptrends (needs YOUTUBE_API_KEY)
    - [ ] http://localhost:3000/api/trending
- [ ] `npm run build`
- [ ] `npm run preview` → http://localhost:5174
- [ ] Push to GitHub → Vercel project
- [ ] Vercel settings: Framework = Vite; Build = `npm run build`; Output = `client/dist`
- [ ] Add `YOUTUBE_API_KEY` in Vercel env
- [ ] Deploy → verify endpoints and UI
 
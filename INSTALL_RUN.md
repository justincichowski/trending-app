# Install & Run

## Prereqs

- Node 18+
- Vercel CLI (`npm i -g vercel`)

## First-time setup & demo

```bash
npm run start
```

This will:

1. Install root + client dependencies
2. Launch local dev:
    - `vercel dev` at http://localhost:3000 (serverless API)
    - Vite at http://localhost:5173 (proxying `/api` → 3000)
3. Build a demo preview for the client

## Day-to-day development

```bash
npm run dev
```

Runs both `vercel dev` and the Vite dev server.

### Production build

```bash
npm run build
```

- Builds API TypeScript
- Builds client assets

### Preview built client

```bash
npm run preview
```

### Formatting is automatic

- `npm run start` now runs **`npm run format`** after installing dependencies (root + client) and **before** launching dev/build.
- `npm run build` also formats via the **`prebuild`** hook.
- Prettier is configured for **tabs=4** (see `.prettierrc`, `.editorconfig`, and `.vscode/settings.json`).

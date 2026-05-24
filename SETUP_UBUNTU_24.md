# Ubuntu 24 Setup — Trending App

This setup is for a fresh Ubuntu 24 machine using Node 20, npm, GitHub, and Vercel.

## 0. Login order

Do this first before cloning or running local dev.

### Vercel login

Use the Vercel account:

```text
justincichowski@gmail.com
```

Login with:

```bash
npx vercel login
```

Verify:

```bash
npx vercel whoami
```

### GitHub browser login

Open GitHub and confirm the browser is logged in:

```bash
xdg-open https://github.com
```

## 1. Install GitHub CLI and authenticate Git

```bash
sudo apt update
sudo apt install gh
```

Authenticate:

```bash
gh auth login
```

Choose:

```text
GitHub.com
HTTPS
Yes, authenticate Git with GitHub credentials
Login with browser
```

Then:

```bash
gh auth setup-git
gh auth status
```

## 2. Set Git identity

```bash
git config --global --replace-all user.name "justincichowski"
git config --global --replace-all user.email "justincichowski@gmail.com"
git config --global --replace-all init.defaultBranch main
```

Verify:

```bash
git config --global --get-all user.name
git config --global --get-all user.email
git config --global --get-all init.defaultBranch
```

Expected:

```text
justincichowski
justincichowski@gmail.com
main
```

## 3. Clone repo

```bash
mkdir -p ~/docker
cd ~/docker
git clone https://github.com/justincichowski/trending-app.git trending_app
cd ~/docker/trending_app
```

Verify:

```bash
git status
git --no-pager log --oneline -5
git remote -v
```

Expected remote:

```text
https://github.com/justincichowski/trending-app.git
```

## 4. Open in VS Code

```bash
code ~/docker/trending_app
```

Trust/allow the folder when prompted.

## 5. Install dependencies

```bash
cd ~/docker/trending_app
npm install
npm install --prefix client
```

There is no `server/` folder in the current repo. Do not run:

```bash
npm install --prefix server
```

## 6. Local env file

Server/API secrets belong in the root `.env` file.

```bash
cd ~/docker/trending_app
cp .env.example .env
code .env
```

Do not commit `.env`.

Root `.env` should contain values like:

```env
YOUTUBE_API_KEY=
COOKIE_SECRET=
ENABLE_KV=
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

Cookie secret helper:

```env
# Cookie Secret
# This is used to sign the theme cookie.
# ubuntu terminal : openssl rand -hex 32
COOKIE_SECRET=
```

Generate the value with:

```bash
openssl rand -hex 32
```

Client `.env` is not used for this current setup. Server secrets must not use `VITE_`.

## 7. Link Vercel project

After clone and install:

```bash
cd ~/docker/trending_app
npx vercel link
```

Use the existing Vercel project for `trending-app`.

Then pull Vercel project settings/env metadata:

```bash
npx vercel pull
```

This may create/update:

```text
.vercel/
.env.local
```

Do not commit `.vercel/` or `.env.local`.

## 8. Check app

```bash
cd ~/docker/trending_app
npm run format:check
npm run typecheck
npm run build
npm audit
```

Expected:

```text
found 0 vulnerabilities
```

## 9. Run local dev

```bash
cd ~/docker/trending_app
npm run dev
```

Expected services:

```text
Vercel local app/API: http://localhost:3000
Vite client:           http://localhost:5173 or http://localhost:5174
```

Vite may use `5174` when `5173` is already busy.

## 10. Test local app

Keep `npm run dev` running.

Open a second terminal:

```bash
curl -i http://localhost:3000/api/health
curl -i http://localhost:3000/api/presets
curl -i http://localhost:3000/api/toptrends
curl -i http://localhost:3000/api/trending
```

Test Vite with whichever port it prints:

```bash
curl -I http://localhost:5173
curl -I http://localhost:5174
```

Browser:

```bash
xdg-open http://localhost:3000
xdg-open http://localhost:5173
```

Use `5174` instead if Vite prints `5174`.

## 11. Stop dev

```text
Ctrl+C
```

## 12. Useful no-pager commands

Use these to avoid getting stuck in Git pager:

```bash
git --no-pager log --oneline -10
git --no-pager diff --stat
git --no-pager diff -- package.json
git --no-pager show --stat HEAD
```

## 13. Final local verification before push

```bash
cd ~/docker/trending_app
git status
npm run format:check
npm run typecheck
npm run build
npm audit
```

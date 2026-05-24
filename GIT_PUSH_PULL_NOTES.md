# Git Push/Pull Notes — Trending App

## Important warning

Do not use orphan-branch initialize resets for this GitHub repo.

Do not run this as a normal workflow:

```bash
git checkout --orphan fresh-main
git add .
git commit -m "initialize"
git branch -D main
git branch -m main
git push origin main --force-with-lease
```

That rewrites GitHub history and removes old commits from the visible branch history.

Use normal pull/add/commit/push instead.

## Normal workflow

```bash
cd ~/docker/trending_app

git status
git pull origin main
git add .
git commit -m "message"
git push origin main
```

## Review before commit

```bash
git status
git --no-pager diff --stat
git --no-pager diff
```

For a specific file:

```bash
git --no-pager diff -- package.json
```

## Review history

```bash
git --no-pager log --oneline -10
```

## Safe push

Use normal push:

```bash
git push origin main
```

## When Git says remote is stale

First fetch:

```bash
git fetch origin
```

Then inspect:

```bash
git status
git --no-pager log --oneline --decorate --graph --all -20
```

Prefer resolving normally with pull/rebase or merge.

## Force pushes

Avoid force pushes for normal work.

If a recovery requires rewriting remote history, use:

```bash
git push origin main --force-with-lease
```

Do not use plain `--force` unless intentionally destroying remote history.

## Check ignored secrets

```bash
git status --ignored
```

Ignored files should include:

```text
.env
.env.local
.vercel/
node_modules/
client/node_modules/
client/dist/
```

Real secrets must stay out of GitHub.

## Recover old commits with reflog

If history is accidentally rewritten locally, inspect reflog:

```bash
git --no-pager reflog --date=local -20
```

Inspect an old commit:

```bash
git --no-pager show --stat <commit_hash>
```

Restore only when you know exactly what commit should become the branch head.

## Current safe commit/push sequence for notes

After adding or editing notes:

```bash
cd ~/docker/trending_app

git status
git --no-pager diff --stat
git --no-pager diff -- SETUP_UBUNTU_24.md GIT_PUSH_PULL_NOTES.md

npm run format:check
npm run typecheck
npm run build
npm audit

git add SETUP_UBUNTU_24.md GIT_PUSH_PULL_NOTES.md
git commit -m "Add Ubuntu setup and Git workflow notes"
git push origin main
```

Verify:

```bash
git status
git --no-pager log --oneline -5
git remote -v
```

Expected final status:

```text
On branch main
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean
```

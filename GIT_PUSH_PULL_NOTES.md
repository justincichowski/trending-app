# Git Push/Pull Notes — Trending App

**Do not reset GitHub to `initialize`. Only push new commits. Reset/orphan history rewrites can erase visible GitHub history.**

## 1. Build and verify before committing

Run this first before pushing changes to GitHub:

[ bash ]
cd ~/docker/trending_app && \
npm run format:check && \
npm run typecheck && \
npm run build && \
npm audit

Expected audit result:
found 0 vulnerabilities

If any command fails, fix that problem before committing.

## 2. Review what changed

Check the repo status:

[ bash ]
cd ~/docker/trending_app && \
git status

Show a clean summary of changed files:

[ bash ]
cd ~/docker/trending_app && \
git --no-pager diff --stat

Review the actual changes:

[ bash ]
cd ~/docker/trending_app && \
git --no-pager diff

For only the setup notes:

[ bash ]
cd ~/docker/trending_app && \
git --no-pager diff -- SETUP_UBUNTU_24.md GIT_PUSH_PULL_NOTES.md

## 3. Commit and push notes

For the setup/push-pull notes update:

[ bash ]
cd ~/docker/trending_app && \
git add SETUP_UBUNTU_24.md GIT_PUSH_PULL_NOTES.md && \
git commit -m "Add Ubuntu setup and Git workflow notes" && \
git push origin main

## 4. Verify after push

[ bash ]
cd ~/docker/trending_app && \
git status && \
git --no-pager log --oneline -5 && \
git remote -v

Expected final status:

On branch main
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean

Expected remote should point to:

https://github.com/justincichowski/trending-app.git

## 5. Normal daily workflow

Use this when editing regular project files:

[ bash ]
cd ~/docker/trending_app && \
git status && \
git pull origin main

Then make edits.

After edits:

[ bash ]
cd ~/docker/trending_app && \
npm run format:check && \
npm run typecheck && \
npm run build && \
npm audit

Then commit and push:

[ bash ]
cd ~/docker/trending_app && \
git add . && \
git commit -m "Describe the change" && \
git push origin main

Verify:

[ bash ]
cd ~/docker/trending_app && \
git status && \
git --no-pager log --oneline -5

## 6. Pull before starting work

Before starting a new change, pull the latest GitHub version:

[ bash ]
cd ~/docker/trending_app && \
git status && \
git pull origin main

If `git status` shows local changes, review them before pulling:

[ bash ]
git --no-pager diff --stat
git --no-pager diff

## 7. Useful no-pager commands

Use `--no-pager` so Git prints the result and exits instead of opening an interactive pager.

Recent commits:

[ bash ]
git --no-pager log --oneline -10

Changed file summary:

[ bash ]
git --no-pager diff --stat

Actual changes:

[ bash ]
git --no-pager diff

Changes for one file:

[ bash ]
git --no-pager diff -- package.json

Last commit summary:

[ bash ]
git --no-pager show --stat HEAD

## 8. Secrets and ignored files

Never commit real secrets.

Check ignored files:

[ bash ]
cd ~/docker/trending_app && \
git status --ignored

These should stay ignored:

.env
.env.local
.vercel/
node_modules/
client/node_modules/
client/dist/

Root `.env` is for local server/API secrets only.

Do not commit:

YOUTUBE_API_KEY
COOKIE_SECRET
KV_REST_API_URL
KV_REST_API_TOKEN

## 9. If Git says remote changed

Fetch latest remote state:

[ bash ]
cd ~/docker/trending_app && \
git fetch origin

Inspect local and remote history:

[ bash ]
git --no-pager log --oneline --decorate --graph --all -20

Then use normal pull/merge/rebase as needed.

Do not jump to reset or force-push.

## 10. Force push warning

Avoid force pushes for normal work.

If a true recovery requires rewriting remote history, use:

[ bash ]
git push origin main --force-with-lease

Do not use plain `--force`.

Only use `--force-with-lease` when you intentionally need to rewrite GitHub history and you already verified the exact branch state.

## 11. Destructive command to avoid

Do not use this workflow for GitHub setup:

[ bash ]
git checkout --orphan fresh-main
git add .
git commit -m "initialize"
git branch -D main
git branch -m main
git push origin main --force-with-lease

That is a destructive history reset workflow. It is not a normal setup step.

## 12. Recovery hint

If history ever gets changed accidentally, inspect reflog:

[ bash ]
git --no-pager reflog --date=local -20

Inspect an old commit:

[ bash ]
git --no-pager show --stat <commit_hash>

Only restore a commit when you know exactly which commit should become the branch head.

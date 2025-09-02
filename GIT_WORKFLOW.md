# Git Workflow — Solo vs Safe (Windows + macOS/Linux)

This project is usually worked on **solo**, so you can safely use `--force` to overwrite
the remote branch with your local one.  
But here are both workflows spelled out (safe vs solo), with commands for **Windows PowerShell** and **macOS/Linux**.

---

## 1) Normal add + commit (same everywhere)

```bash
git add .
git commit -m "Your message here"
```

---

## 2) Push — Solo workflow (overwrite allowed)

### Windows PowerShell

```powershell
git push origin main --force
```

### macOS/Linux (bash/zsh)

```bash
git push origin main --force
```

This ignores the remote state and replaces it with your local branch.

---

## 3) Push — Safe workflow (checks remote before overwriting)

### Windows PowerShell

```powershell
git fetch origin
git push origin main --force-with-lease
```

### macOS/Linux (bash/zsh)

```bash
git fetch origin
git push origin main --force-with-lease
```

This will refuse to push if the remote has moved forward since you last fetched.

---

## 4) Which should I use?

- **Solo dev (this repo)** → Use `--force`. Simple and clean.
- **Teamwork / shared repo** → Use `--force-with-lease` to avoid wiping others’ work.

---

✅ Tip: If you ever see _“stale info”_, it means your local view of the remote is out of date. Run `git fetch origin` first, then push with `--force-with-lease`.

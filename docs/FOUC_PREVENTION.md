# First Paint Theme Bootstrap (FOUC Prevention)

We apply the theme **before CSS/JS** in `client/index.html` using an inline script:
- Reads `localStorage.theme` or `prefers-color-scheme`.
- Sets `.dark` and `data-theme` on `<html>`.
- Sets CSS vars `--bg`/`--fg` to color the initial paint.
- Base CSS in `client/src/style.css` consumes these vars.

**Do not remove** this bootstrap. Vercel (serverless) cannot SSR the theme, so this is required to prevent the white flash.
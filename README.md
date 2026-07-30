# Portfolio — Manoj Mareedu

Motion-driven static portfolio. No build step, no framework, no dependencies, no paid service.

| File | Purpose |
|------|---------|
| `index.html` | All content and markup |
| `styles.css` | Design tokens, layout, animation |
| `app.js` | Scroll reveals, counters, rotator, tilt/spotlight, theme toggle |
| `og.png` | Social share card shown when the link is posted anywhere |
| `Manoj_Mareedu_Resume.pdf` | Résumé served by the download buttons |
| `tools/check.py` | Validation gate — runs locally and in CI |
| `tools/og.html` | Source template the share card is rendered from |

## Run locally

Open `index.html` in a browser, or:

```bash
python3 -m http.server 8000   # http://localhost:8000
```

## Check before pushing

```bash
python3 tools/check.py
```

Fails if markup is unbalanced, an in-page link points nowhere, a CSS class is used but never
styled, a counter attribute is malformed, or the page starts pulling from a host other than
Google Fonts. That last rule is what keeps the site free to run.

## Deploy (GitHub Pages + Actions, free)

No setup needed — the workflow enables Pages itself on its first successful run.
Every push to `main` deploys itself:

```bash
git add -A
git commit -m "content: update"
git push
```

`.github/workflows/deploy.yml` runs `tools/check.py` first and refuses to deploy if it fails, then
copies **only** `index.html`, `styles.css`, `app.js`, `og.png`, and the résumé PDF into the
published site. Nothing else can reach the internet, even if it gets committed by mistake.

Live at `https://manojmareedu.github.io/portfolio/`.

### Updating the résumé

Replace `Manoj_Mareedu_Resume.pdf` (keep the filename), commit, push. The download link on the
site picks it up automatically — no HTML edit needed.

Custom domain is optional and costs only the domain: add a `CNAME` file with your domain,
point a DNS `CNAME` record at `manojmareedu.github.io`, enable HTTPS in Pages settings.
Hosting and the TLS certificate stay free.

## What is deliberately not committed

`.gitignore` keeps `Profile-context.md` (phone number, confidential client detail) and
`feedback.md` (internal audit) local. Do not commit them — the résumé PDF is the only file
here that carries personal contact details, and it is published on purpose.

## Regenerate the social card

Edit `tools/og.html`, then:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless \
  --window-size=1200,630 --virtual-time-budget=4000 --screenshot=og.png tools/og.html
```

## Design system

Motion-Driven style · violet `#8B5CF6` → indigo `#6366F1` → cyan `#22D3EE` on deep navy
`#0B0F1C` · Space Grotesk (display) / Archivo (body) / JetBrains Mono (numbers) · dark and
light, system-aware with a toggle.

Motion inventory: drifting aurora that follows the cursor, scroll-progress bar, masked
heading reveals, staggered section reveals, counters that animate the old metric into the
corrected one, animated conic-gradient card borders, pointer spotlight and 3D tilt,
two-direction tech marquee, scroll-drawn timeline, rotating hero phrase. All of it is
disabled under `prefers-reduced-motion`, and every effect degrades to plain readable content
with JavaScript off.

## Editing content

Content lives in `index.html` as plain HTML. Facts come from `Profile-context.md` — three of
its rules are baked into the markup and must survive any edit:

1. The fraud-detection metrics keep their **synthetic dataset** caveat beside them.
2. The pharmaceutical distribution client is never named.
3. No public API URL is claimed for the Credit Fraud or Healthcare FastAPI services — only
   the Streamlit dashboards are live.

# Laxman Sai — Portfolio

A responsive single-page portfolio. Plain HTML/CSS/JS, no build step.

## Files
- `index.html` — page content, SEO meta tags and structured data (JSON-LD)
- `style.css` — visual design and responsive layout
- `script.js` — navigation, image lightbox, project detail cards, copy-email
- `images/` — WebP images: full-size gallery images, `thumbs/` for the grid, the hero art, and the 1200×630 share card
- `_source-images/` — original JPEG/PNG files (keep for editing, don't upload)
- `robots.txt`, `sitemap.xml`, `llms.txt` — for search engines and AI answer engines
- `_headers` — caching rules (read by Cloudflare Pages / Netlify)

## Run locally
```
python -m http.server 8000
```
Then open http://localhost:8000

## Deploy (Cloudflare Pages)
1. Sign in at https://dash.cloudflare.com → Workers & Pages → Create → Pages → Upload assets.
2. Project name: `laxmansai` (gives https://laxmansai.pages.dev).
3. Upload the site files: `index.html`, `style.css`, `script.js`, `images/`, `robots.txt`,
   `sitemap.xml`, `llms.txt`, `_headers`. Leave out `.claude/`, `_source-images/` and `README.md`.
4. In the project's settings, keep "Block AI bots" / AI crawl control off so AI answer engines can read the site.

If the name `laxmansai` is taken, or you add a custom domain later, replace
`https://laxmansai.pages.dev` in `index.html`, `robots.txt`, `sitemap.xml` and `llms.txt`.

## After deploying
1. Google Search Console (https://search.google.com/search-console): add the site, submit `sitemap.xml`.
2. Bing Webmaster Tools (https://www.bing.com/webmasters): import from Search Console. Bing also feeds ChatGPT search and Copilot.
3. Check structured data at https://search.google.com/test/rich-results.
4. Put the portfolio link on your LinkedIn profile (Contact info → Website, and the Featured section).

## Still to do
- Add Instagram / YouTube links to the footer and to `sameAs` in the JSON-LD if you want them listed.

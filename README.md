# SortNote

A responsive notes website and installable Progressive Web App (PWA).

## Features
- Suggests a category while you type.
- Categories: Study, Work, Ideas, Personal, Tech, Finance and Unsorted.
- Search, sort, edit and delete notes.
- Saves notes in the browser using localStorage.
- Installable on supported desktop and mobile browsers.
- Basic offline support after the first load.

## Run locally
Open `index.html` in a browser. For PWA installation and offline caching, serve the folder over HTTPS or localhost.

For a quick local server:
```bash
python3 -m http.server 8000
```
Then visit `http://localhost:8000`.

## Publish online
Upload the contents of this folder to GitHub, then enable GitHub Pages:
Repository → Settings → Pages → Deploy from a branch → `main` → `/ (root)` → Save.

## How categorization works
This starter version uses a local keyword-scoring system. It does not send notes to an AI service. You can customize the keyword lists in `app.js`. Notes remain in the browser where they were created; this version does not sync across devices.

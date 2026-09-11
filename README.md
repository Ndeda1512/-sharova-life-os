# Sharova Life OS

**Sharova Life OS** is a mobile-friendly personal command center for organizing the practical parts of everyday life in one place.

## What is included

- **Dashboard** — quick view of tasks, deadlines, career items and documents.
- **Documents** — track important documents, expiry dates, categories and notes.
- **Money** — record income and expenses, set a current balance and savings goal.
- **Career** — track opportunities through To apply, Applied, Interview, Offer and Closed stages.
- **Deadlines** — manage due dates, priorities and notes.
- **Travel** — create trips with preparation checklists.
- **Home & Tasks** — everyday tasks, priorities, due dates and repeating tasks.
- **AI Assistant** — an in-app assistant area for priorities, summaries and planning.
- **Settings** — personalize the display name/currency and export or import a JSON backup.
- **PWA support** — includes a web app manifest and service worker for an app-like experience.

## Data and privacy

Core workspace data is stored locally in the browser using `localStorage`. Export a backup from **Settings → Backup & data** before clearing browser storage or moving to another device.

The repository does not contain a user database or hard-coded personal records.

## Project structure

```text
index.html      Main application UI
styles.css      Responsive visual system
app.js          Workspace state, forms, navigation and local data
ai.js           AI assistant client-side integration
api/            Server-side AI endpoint(s)
manifest.json   PWA metadata
sw.js           Service worker/cache
icon.svg        Application icon
```

## AI setup

The AI assistant is designed to work with the project's API endpoint. A deployed version should keep provider secrets on the server as environment variables rather than placing an API key in browser code.

If the AI service is not configured, the rest of the Life OS remains usable as a local workspace.

## Running locally

Because this is a browser application, serve the repository with any simple static web server rather than opening `index.html` directly. For example:

```bash
python -m http.server 8000
```

Then open the local server in a browser.

## Deployment

The project can be deployed as a static/PWA-style web app on a host such as Vercel or GitHub Pages. If the AI endpoint is enabled, configure its required environment variables in the deployment platform and keep secrets server-side.

## Product direction

Sharova is intended to feel like a calm, practical personal operating system rather than a collection of disconnected templates. The core experience is designed around quick capture, clear status, useful reminders, portable data and mobile-first navigation.

**Created by Sharon Ndeda.**

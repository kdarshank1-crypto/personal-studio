# Personal Studio

A private home for your projects, ideas, and the context you want to bring to Codex. Royal blue, light cream, and a little room to think.

## Open your app

Double-click **Start Personal Studio.cmd**. The app starts quietly and opens in your browser at http://127.0.0.1:3210.

Node.js 22 or newer is required (already available on this PC). No npm install, accounts, API keys, or internet connection are needed.

For a terminal session:

    cd "F:\personal development"
    npm start

Keep that terminal open while using the app. Press Ctrl+C to stop a server started in a terminal. If the launcher already started the app, opening the launcher again reuses it. Its background process stops when Windows shuts down.

## Your workspace

- **Overview:** current projects, a quick idea capture box, next steps, and recent activity.
- **My projects:** create, edit, archive, filter, and sort projects; save folder paths, website/repository links, tags, priorities, dates, notes, and checklists. Progress follows your checklist; completed projects show 100%.
- **Idea garden:** capture ideas, star favourites, track their stage, and convert an idea into a planning project. Conversion moves its title, description, and tags into the project.
- **My briefing:** a snapshot of your saved work, suggested next steps, and keyword-based lookup. This is a local briefing, without a connected language model.
- **My portfolio:** a private showcase of projects marked "Feature in my private portfolio." This page stays local.
- **Copy for Codex:** copy one project's context, or the whole workspace from My briefing, into your Codex session. Include your project folder and update notes after a coding session.
- **Settings:** edit your name/portfolio introduction and export or restore JSON backups.
- **Search:** Ctrl+K (or Cmd+K), including titles, descriptions, notes, tags, folders, and task names.

The initial "Personal development studio" project represents this app. Your other folders and Codex sessions are not scanned or imported automatically.

## Data and backups

Everything is saved under this folder:

    data/workspace.json
    data/workspace.previous.json

The previous file is the last saved revision, overwritten on each successful save. Export occasional backups from Workspace settings and keep them somewhere separate. Restore accepts a complete, valid Studio JSON backup and replaces the current workspace after confirmation. A failed restore leaves the saved workspace intact.

The app binds only to 127.0.0.1, uses no third-party fonts or scripts, and keeps the data directory out of the web server's static routes. It is a local personal app; cloud sync and public hosting are not configured.

If two tabs edit simultaneously, the older tab is asked to export and reload instead of overwriting the newer saved work. A failed save shows an error at the bottom; retry or export your current state before closing.

To move PCs, copy this entire folder and install Node.js, or export your backup and restore it in another copy of Personal Studio.

## Development

No dependencies. Node.js HTTP server plus plain HTML, CSS, and JavaScript.

    npm test

The tests use temporary workspaces and never edit your personal data.

An optional end-to-end browser check is available in tests/browser-smoke.cjs. It uses Playwright with Microsoft Edge, creates only a temporary test workspace, and writes screenshots under qa/. Set STUDIO_PLAYWRIGHT to the installed Playwright module path if it is not on Node's module lookup path.

You can set a different port before running the server:

    $env:PORT = '3211'
    npm start

The one-click launcher uses port 3210.


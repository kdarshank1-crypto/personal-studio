# Personal Studio

A private workspace for projects, ideas, checklists, and a personal portfolio. This repository includes the complete frontend and a Vercel cloud deployment.

## Online workspace

Vercel serves the static frontend from public/ and runs api/session.js and api/workspace.js as Node.js functions. Workspace data lives in a separate Turso database. Passwords and database credentials are environment variables and are never committed.

Open the deployed site and enter your Studio password. The same workspace is available across your devices. Concurrent edits return a conflict instead of overwriting newer work; export your changes before reloading. The preceding saved revision is retained in the database.

The online workspace starts fresh. To bring your existing projects online, use Workspace settings > Export backup in your local app, then Workspace settings > Restore backup in the online app. Do not commit backup files.

Required Vercel environment variables: TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, STUDIO_PASSWORD_HASH (scrypt salt:hash), and SESSION_SECRET. The hosting configuration uses Node.js 24 and the Mumbai region. Set a new password hash and session secret in Vercel to rotate access and invalidate existing sessions.

JSON requests are limited to 4 MB to fit Vercel Function request limits. Regularly export backups from Workspace settings. The site has no connected language model; Copy for Codex prepares context for you to paste into a session.

## Local desktop version

The original local server remains available with npm start or Start Personal Studio.cmd. Node.js 24 is required. It binds to 127.0.0.1:3210 and saves data/workspace.json on that PC. Local and cloud workspaces are separate; move data using JSON export/import.

## Verification

Run npm ci and npm test. The tests use temporary local databases and never change personal or production data.

GitHub pushes to main deploy automatically through the connected Vercel project. Keep .env files, data/, qa/, and .vercel/ out of Git.

'use strict';
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const ROOT = __dirname;
const MAX_BODY = 5 * 1024 * 1024;

function initialWorkspace() {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1, revision: 0, profile: { name: 'DK', intention: 'Make room for what matters.' },
    projects: [{
      id: randomUUID(), title: 'Personal development studio',
      description: 'My own space to keep projects, capture ideas, and bring the right context into every Codex session.',
      status: 'active', category: 'Personal', color: 'blue', priority: 'medium', tags: ['Codex', 'Personal growth'],
      folder: 'F:\\personal development', url: '', github: '', featured: true,
      nextStep: 'Add my current projects and capture my first idea.', dueDate: '',
      notes: 'This is the app you are using. Edit this project to make it yours. Use Copy for Codex to create a handoff with your project details, notes, tasks, and next step.',
      tasks: [], createdAt: now, updatedAt: now
    }],
    ideas: [], activity: [{ id: randomUUID(), text: 'Your personal studio is ready.', type: 'workspace', at: now }]
  };
}
function validateWorkspace(input) {
  const fail = (message) => { const e = new Error(message); e.status = 400; throw e; };
  const str = (value, field, limit = 20000) => {
    if (typeof value !== 'string' || value.length > limit) fail('Invalid ' + field + '.');
    return value;
  };
  const date = (value, field) => { str(value, field, 40); if (!Number.isFinite(Date.parse(value))) fail('Invalid ' + field + '.'); return value; };
  const choice = (value, values, field) => { if (!values.includes(value)) fail('Invalid ' + field + '.'); return value; };
  const list = (value, field, limit) => { if (!Array.isArray(value) || value.length > limit) fail('Invalid ' + field + '.'); return value; };
  if (!input || typeof input !== 'object' || input.schemaVersion !== 1) fail('This is not a supported Studio backup.');
  if (!Number.isSafeInteger(input.revision) || input.revision < 0) fail('Invalid revision.');
  const ids = new Set();
  const id = (value) => { str(value, 'record ID', 100); if (!/^[a-zA-Z0-9_-]+$/.test(value) || ids.has(value)) fail('Duplicate or invalid record ID.'); ids.add(value); return value; };
  const title = (value) => { str(value, 'title', 180); if (!value.trim()) fail('A title is required.'); return value.trim(); };
  if (!input.profile || typeof input.profile !== 'object') fail('Invalid profile.');
  return {
    schemaVersion: 1, revision: input.revision,
    profile: { name: str(input.profile.name, 'name', 80), intention: str(input.profile.intention, 'intention', 250) },
    projects: list(input.projects, 'projects', 2000).map(p => {
      if (!p || typeof p !== 'object') fail('Invalid project.');
      return {
        id: id(p.id), title: title(p.title), description: str(p.description, 'description'),
        status: choice(p.status, ['active','planning','paused','completed','archived'], 'status'),
        category: str(p.category, 'category', 80), color: choice(p.color, ['blue','sage','rose','amber'], 'color'),
        priority: choice(p.priority, ['low','medium','high'], 'priority'),
        tags: list(p.tags, 'tags', 20).map(t => str(t, 'tag', 60)),
        folder: str(p.folder, 'folder', 1000), url: str(p.url, 'URL', 2000), github: str(p.github, 'repository', 2000),
        featured: Boolean(p.featured), nextStep: str(p.nextStep, 'next step', 3000),
        dueDate: (() => { const d = str(p.dueDate, 'due date', 10); if (d && (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !Number.isFinite(Date.parse(d)))) fail('Invalid due date.'); return d; })(),
        notes: str(p.notes, 'notes', 100000),
        tasks: list(p.tasks, 'tasks', 500).map(t => ({ id: id(t.id), text: title(t.text), done: Boolean(t.done) })),
        createdAt: date(p.createdAt, 'created date'), updatedAt: date(p.updatedAt, 'updated date')
      };
    }),
    ideas: list(input.ideas, 'ideas', 4000).map(i => {
      if (!i || typeof i !== 'object') fail('Invalid idea.');
      return {
        id: id(i.id), title: title(i.title), description: str(i.description, 'idea description'),
        stage: choice(i.stage, ['spark','exploring','ready','parked'], 'idea stage'),
        tags: list(i.tags, 'idea tags', 20).map(t => str(t, 'tag', 60)),
        starred: Boolean(i.starred), createdAt: date(i.createdAt, 'created date'), updatedAt: date(i.updatedAt, 'updated date')
      };
    }),
    activity: list(input.activity, 'activity', 100).map(a => ({ id: id(a.id), text: str(a.text, 'activity', 400), type: str(a.type, 'activity type', 30), at: date(a.at, 'activity date') }))
  };
}
async function createApp({ dataDir = path.join(ROOT, 'data') } = {}) {
  await fs.mkdir(dataDir, { recursive: true });
  const dataFile = path.join(dataDir, 'workspace.json');
  let workspace;
  try { workspace = validateWorkspace(JSON.parse(await fs.readFile(dataFile, 'utf8'))); }
  catch (e) {
    if (e.code !== 'ENOENT') throw new Error('Cannot read workspace.json. Your file has been preserved. Restore a valid backup before restarting. ' + e.message);
    workspace = initialWorkspace();
    await fs.writeFile(dataFile, JSON.stringify(workspace, null, 2), { flag: 'wx' });
  }
  let writeQueue = Promise.resolve();
  const send = (res, status, value) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(value));
  };
  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    const allowedHosts = new Set(['127.0.0.1', 'localhost', '[::1]']);
    if (!allowedHosts.has((req.headers.host || '').split(':')[0]) && !(req.headers.host || '').startsWith('[::1]:')) return send(res, 403, { error: 'Local access only.' });
    if (req.headers.origin && req.headers.origin !== 'http://' + req.headers.host) return send(res, 403, { error: 'Cross-origin request rejected.' });
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { return send(res, 400, { error: 'Invalid URL.' }); }
    try {
      if (pathname === '/api/workspace' && req.method === 'GET') return send(res, 200, workspace);
      if (pathname === '/api/workspace' && req.method === 'PUT') {
        if (!(req.headers['content-type'] || '').startsWith('application/json')) return send(res, 415, { error: 'Send JSON data.' });
        const chunks = []; let length = 0;
        for await (const chunk of req) {
          length += chunk.length;
          if (length > MAX_BODY) { send(res, 413, { error: 'Backup is too large (maximum 5 MB).' }); req.resume(); return; }
          chunks.push(chunk);
        }
        let proposed;
        try { proposed = validateWorkspace(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
        catch (e) { return send(res, e.status || 400, { error: e.status ? e.message : 'Invalid JSON.' }); }
        const operation = writeQueue.then(async () => {
          if (proposed.revision !== workspace.revision) { const e = new Error('This workspace changed in another tab. Export your current work, then reload before saving.'); e.status = 409; throw e; }
          const updated = { ...proposed, revision: workspace.revision + 1 };
          const temp = path.join(dataDir, 'workspace.' + randomUUID() + '.tmp');
          await fs.writeFile(temp, JSON.stringify(updated, null, 2));
          try {
            await fs.copyFile(dataFile, path.join(dataDir, 'workspace.previous.json'));
            await fs.rename(temp, dataFile);
          } catch (e) { await fs.unlink(temp).catch(() => {}); throw e; }
          workspace = updated;
          return { revision: updated.revision };
        });
        writeQueue = operation.catch(() => {});
        return send(res, 200, await operation);
      }
      if (pathname.startsWith('/api/')) return send(res, 404, { error: 'Endpoint not found.' });
      if (!['GET','HEAD'].includes(req.method)) return send(res, 405, { error: 'Method not allowed.' });
      const assets = { '/': ['index.html','text/html'], '/index.html': ['index.html','text/html'], '/app.js': ['app.js','text/javascript'], '/styles.css': ['styles.css','text/css'], '/favicon.svg': ['favicon.svg','image/svg+xml'] };
      const asset = assets[pathname];
      if (!asset) return send(res, 404, { error: 'Page not found.' });
      const content = await fs.readFile(path.join(ROOT, 'public', asset[0]));
      res.writeHead(200, { 'Content-Type': asset[1] + '; charset=utf-8', 'Cache-Control': 'no-cache' });
      res.end(req.method === 'HEAD' ? undefined : content);
    } catch (e) { send(res, e.status || 500, { error: e.status ? e.message : 'Unable to save. Your last saved workspace is preserved. Check disk space and folder permissions.' }); }
  });
  return server;
}
if (require.main === module) {
  const port = Number(process.env.PORT) || 3210;
  createApp().then(server => {
    server.on('error', e => { console.error(e.code === 'EADDRINUSE' ? 'Port ' + port + ' is already in use. Open http://localhost:' + port + ' or set a different PORT.' : e.message); process.exitCode = 1; });
    server.listen(port, '127.0.0.1', () => console.log('Personal Studio is ready at http://localhost:' + port + '\nData stays in ' + path.join(ROOT, 'data', 'workspace.json') + '\nKeep this process running while using Studio.'));
  }).catch(e => { console.error(e.message); process.exitCode = 1; });
}
module.exports = { createApp, validateWorkspace, initialWorkspace };


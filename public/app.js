'use strict';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = (value = '') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons = {
  grid:'<rect x="3" y="3" width="7" height="7" rx="1.3"/><rect x="14" y="3" width="7" height="7" rx="1.3"/><rect x="3" y="14" width="7" height="7" rx="1.3"/><rect x="14" y="14" width="7" height="7" rx="1.3"/>',
  projects:'<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M3 10h18"/>',
  bulb:'<path d="M9 18h6m-5 3h4M8.5 14.5a6 6 0 1 1 7 0c-1 .8-1.5 1.5-1.5 3.5h-4c0-2-.5-2.7-1.5-3.5Z"/><path d="m10 10 2 2 2-2m-2 2v5"/>',
  spark:'<path d="m12 2 2.8 7.2L22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8Z"/>',
  portfolio:'<rect x="3" y="6" width="18" height="15" rx="2"/><path d="M8 6V3h8v3M3 12c6 3 12 3 18 0m-11 1h4v3h-4Z"/>',
  activity:'<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  settings:'<path d="m9.5 3-.8 2.4-2.2 1.3L4 6.3l-2 3.4 1.6 2v2.6L2 16.3l2 3.4 2.5-.4 2.2 1.3.8 2.4h4l.8-2.4 2.2-1.3 2.5.4 2-3.4-1.6-2v-2.6l1.6-2-2-3.4-2.5.4-2.2-1.3L13.5 3Z" transform="translate(1 -1) scale(.92)"/><circle cx="12" cy="12" r="3"/>',
  search:'<circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9.4 8.5a2.7 2.7 0 0 1 5.2 1c0 2-2.6 2.2-2.6 4m0 3h.01"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',
  northeast:'<path d="M6 18 18 6M6 6h12v12"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  circlecheck:'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  close:'<path d="m6 6 12 12M6 18 18 6"/>',
  copy:'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  star:'<path d="m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.3-5.7-3-5.7 3 1.1-6.3-4.6-4.5 6.4-.9Z"/>',
  list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  upload:'<path d="M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5"/>',
  trash:'<path d="M3 6h18M9 6V3h6v3m-10 0 1 15h12l1-15M10 10v7m4-7v7"/>',
  edit:'<path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14Z"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  folder:'<path d="M3 7V5h7l2 2h9v13H3Z"/><path d="M3 10h18"/>',
  heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>'
};
const icon = name => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (icons[name] || icons.grid) + '</svg>';
const hydrateIcons = () => $$('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
const labels = {active:'In progress',planning:'Planning',paused:'On hold',completed:'Completed',archived:'Archived',spark:'New spark',exploring:'Exploring',ready:'Ready to build',parked:'Parked'};
const routes = {overview:'Overview',projects:'My projects',ideas:'Idea garden',briefing:'My briefing',portfolio:'My portfolio',activity:'Activity'};
let cloudStorage = false;
let state, revision = 0, route = 'overview', projectFilter = 'all', ideaFilter = 'all', sortOrder = 'updated', projectView = 'grid';
let saveChain = Promise.resolve(), pendingSaves = 0, saveFailed = false, toastTimer, dialogKind = '', dialogId = '', dirtyForm = false;
let searchReturnFocus, editorReturnFocus, searchIndex = 0;
const now = () => new Date().toISOString();
const uid = () => crypto.randomUUID();
const projects = () => state.projects.filter(p => p.status !== 'archived');
const activeProjects = () => projects().filter(p => p.status === 'active');
const status = value => '<span class="status ' + value + '">' + esc(labels[value] || value) + '</span>';
const tagList = tags => tags.map(t => '<span class="tag">' + esc(t) + '</span>').join('');
const safeUrl = raw => { try { const url = new URL(raw); return ['http:','https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; } };
const dateLabel = date => new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric'}).format(new Date(date));
const relative = date => {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (days <= 0) return 'Today'; if (days === 1) return 'Yesterday'; if (days < 7) return days + ' days ago'; return dateLabel(date);
};
const fullDate = date => new Intl.DateTimeFormat(undefined,{weekday:'long',month:'long',day:'numeric'}).format(date);
const progress = p => p.status === 'completed' ? 100 : p.tasks.length ? Math.round(p.tasks.filter(t => t.done).length / p.tasks.length * 100) : 0;
const orderedProjects = list => [...list].sort((a,b) => sortOrder === 'title' ? a.title.localeCompare(b.title) : sortOrder === 'priority' ? ({high:0,medium:1,low:2}[a.priority] - {high:0,medium:1,low:2}[b.priority] || b.updatedAt.localeCompare(a.updatedAt)) : b.updatedAt.localeCompare(a.updatedAt));
const greeting = () => new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';
function toast(message) { clearTimeout(toastTimer); $('#toast').textContent = message; $('#toast').classList.add('visible'); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 4500); }
function addActivity(text, type = 'project') { state.activity.unshift({id:uid(),text,type,at:now()}); state.activity = state.activity.slice(0,100); }
function saveStatus() {
  $('#save-status').textContent = saveFailed ? 'Changes not saved · Export a backup or retry' : pendingSaves ? 'Saving your changes...' : cloudStorage ? 'All changes saved in your private cloud' : 'All changes saved on this PC';
  $('.save-dot').className = 'save-dot' + (saveFailed ? ' error' : pendingSaves ? ' saving' : '');
  $('#retry-save').classList.toggle('hidden', !saveFailed);
}
function persist() {
  const snapshot = structuredClone(state);
  pendingSaves++; saveStatus();
  const operation = saveChain.then(async () => {
    snapshot.revision = revision;
    const response = await fetch('/api/workspace', {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(snapshot)});
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Unable to save changes.');
    revision = result.revision; state.revision = revision; saveFailed = false;
  });
  saveChain = operation.catch(error => { saveFailed = true; toast(error.message); }).finally(() => { pendingSaves--; saveStatus(); });
  return operation;
}
function renderNavigation() {
  const items = [
    ['overview','grid','Overview'],['projects','projects','My projects',projects().length],['ideas','bulb','Idea garden',state.ideas.length],
    ['briefing','spark','My briefing'],['separator'],['portfolio','portfolio','My portfolio'],['activity','activity','Activity']
  ];
  $('#navigation').innerHTML = items.map(([key,symbol,label,count]) => key === 'separator' ? '<div class="nav-separator"></div>' : '<a href="#'+key+'" class="nav-item '+(route===key?'active':'')+'" '+(route===key?'aria-current="page"':'')+'>'+icon(symbol)+'<span>'+label+'</span>'+(count!==undefined?'<span class="nav-count">'+count+'</span>':'')+'</a>').join('');
  const name = state.profile.name || 'Your studio';
  const initials = name.split(/\s+/).slice(0,2).map(n => n[0]).join('').slice(0,2).toUpperCase();
  $('#profile-name').textContent = name; $('#avatar').textContent = initials; $('#topbar-avatar').textContent = initials;
}
function pageHeading(eyebrow,title,subtitle,actions = '') {
  return '<div class="page-heading"><div><div class="eyebrow">'+esc(eyebrow)+'</div><h1>'+title+'</h1><p>'+esc(subtitle)+'</p></div><div class="heading-actions">'+actions+'</div></div>';
}
const addProjectButton = '<button class="button" data-action="new-project">'+icon('plus')+'New project</button>';
const addIdeaButton = '<button class="button" data-action="new-idea">'+icon('plus')+'Capture an idea</button>';
function projectCard(p) {
  const pct = progress(p), done = p.tasks.filter(t => t.done).length;
  return '<article class="project-card" tabindex="0" role="button" aria-label="Open '+esc(p.title)+'" data-action="view-project" data-id="'+p.id+'"><div class="card-top"><span class="project-symbol '+p.color+'">'+esc(p.title[0].toUpperCase())+'</span>'+status(p.status)+'</div><div class="card-content"><h3>'+esc(p.title)+'</h3><p class="description">'+esc(p.description || 'Give this project a little context.')+'</p><div class="card-tags">'+tagList(p.tags.slice(0,3))+'</div></div><div class="progress-area"><div class="progress-row"><span>'+(p.tasks.length?done+' of '+p.tasks.length+' steps complete':p.status==='completed'?'Finished and filed':'Your next chapter awaits')+'</span><span>'+pct+'%</span></div><div class="progress-track" role="progressbar" aria-label="Task progress" aria-valuenow="'+pct+'" aria-valuemin="0" aria-valuemax="100"><div class="progress-fill" data-progress="'+pct+'"></div></div></div><div class="card-bottom"><span>'+icon('clock')+relative(p.updatedAt)+'</span><span>'+(p.priority==='high'?'High priority':esc(p.category || 'Personal'))+' '+icon('northeast')+'</span></div></article>';
}
const emptyProject = () => '<button class="empty-project" data-action="new-project"><span class="empty-plus">+</span><strong>Make room for something new</strong><p>Your next project could start right here.</p></button>';
function ideaPreview(i) { return '<button class="idea-preview" data-action="view-idea" data-id="'+i.id+'"><span class="idea-bulb">'+icon('bulb')+'</span><div><h3>'+esc(i.title)+'</h3><p>'+relative(i.createdAt)+(i.tags.length?' · '+esc(i.tags[0]):'')+'</p></div>'+status(i.stage)+'</button>'; }
function activityRows(list) { return list.map(a => '<div class="activity-row"><i></i><span>'+esc(a.text)+'</span><time datetime="'+a.at+'" title="'+esc(new Date(a.at).toLocaleString())+'">'+relative(a.at)+'</time></div>').join(''); }
function overviewPage() {
  const current = orderedProjects(projects()).slice(0,4), completed = state.projects.filter(p=>p.status==='completed').length;
  const focus = [...activeProjects()].sort((a,b) => ({high:0,medium:1,low:2}[a.priority]-{high:0,medium:1,low:2}[b.priority])).filter(p => p.nextStep || p.tasks.some(t=>!t.done)).slice(0,3);
  return pageHeading(fullDate(new Date()),greeting()+', '+esc(state.profile.name || 'friend')+'.','A home for everything you’re dreaming up and bringing to life.','<button class="button secondary" data-action="new-idea">'+icon('bulb')+'Capture idea</button>'+addProjectButton)+
  '<section class="hero" aria-label="Your creative workspace"><div class="hero-copy"><div class="eyebrow">SMALL STEPS. INFINITE POSSIBILITIES.</div><h2>Big ideas.<br><em>Real progress.</em></h2><p>Collect the sparks. Build what matters.<br>This is your space to connect the dots.</p><button class="button light" data-action="navigate" data-route="briefing">See my briefing '+icon('arrow')+'</button></div><div class="hero-art" aria-hidden="true"><svg viewBox="0 0 300 280" fill="none"><circle cx="161" cy="144" r="94" stroke="#e7ddba" stroke-opacity=".45"/><circle cx="161" cy="144" r="68" stroke="#e7ddba" stroke-opacity=".23"/><ellipse cx="161" cy="144" rx="128" ry="44" transform="rotate(-38 161 144)" stroke="#f4eed7" stroke-opacity=".6"/><ellipse cx="161" cy="144" rx="112" ry="56" transform="rotate(35 161 144)" stroke="#f4eed7" stroke-opacity=".35"/><path d="M161 94v100m-50-50h100M126 109l70 70m0-70-70 70" stroke="#f0e5ba" stroke-width="1.5"/><circle cx="161" cy="144" r="30" fill="#f3e9c9"/><path d="m161 121 6 17 17 6-17 6-6 17-6-17-17-6 17-6Z" fill="#2848d3"/><g class="floating"><rect x="60" y="62" width="39" height="39" rx="9" transform="rotate(-13 60 62)" fill="#f8f2d9"/><path d="m75 68 1 15m-8-7 15-1m-12-5 10 10m0-10-10 11" stroke="#2848d3" stroke-width="1.5"/><circle cx="236" cy="110" r="7" fill="#e8d99f"/></g><g class="floating second"><rect x="213" y="191" width="43" height="43" rx="10" transform="rotate(12 213 191)" fill="#9aacfb"/><path d="m224 208 7 8 14-13" stroke="#fff7dd" stroke-width="2"/><circle cx="71" cy="200" r="5" fill="#a9b8ff"/></g><path d="m234 52 2 7 7 2-7 2-2 7-2-7-7-2 7-2Z" fill="#f4e7b8"/><path d="m114 224 1.5 5 5 1.5-5 1.5-1.5 5-1.5-5-5-1.5 5-1.5Z" fill="#a9b8ff"/><circle cx="181" cy="43" r="2" fill="#e6dcae"/><circle cx="267" cy="169" r="2" fill="#e6dcae"/></svg></div></section>'+
  '<div class="stats"><div class="stat"><div><span class="stat-label">Projects in motion</span><div class="stat-number">'+String(activeProjects().length).padStart(2,'0')+'</div><span class="stat-note">'+projects().length+' projects in your workspace</span></div><span class="stat-icon">'+icon('projects')+'</span></div><div class="stat"><div><span class="stat-label">Ideas to explore</span><div class="stat-number">'+String(state.ideas.filter(i=>i.stage!=='parked').length).padStart(2,'0')+'</div><span class="stat-note">A little possibility, saved</span></div><span class="stat-icon">'+icon('bulb')+'</span></div><div class="stat"><div><span class="stat-label">Brought to life</span><div class="stat-number">'+String(completed).padStart(2,'0')+'</div><span class="stat-note">Every finish deserves a moment</span></div><span class="stat-icon">'+icon('circlecheck')+'</span></div></div>'+
  '<div class="dashboard-columns"><div><section><div class="section-title"><div><h2>On my workbench <span>'+projects().length+'</span></h2><div class="section-kicker">A little closer to the things you want to make.</div></div><a class="text-button" href="#projects">All projects '+icon('arrow')+'</a></div><div class="project-grid">'+current.map(projectCard).join('')+(current.length<2?emptyProject():'')+'</div></section><section class="recent-section"><div class="section-title"><h2>Fresh from the idea garden</h2><a class="text-button" href="#ideas">Explore '+icon('arrow')+'</a></div>'+([...state.ideas].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,3).map(ideaPreview).join('') || '<div class="ideas-empty">'+icon('bulb')+'<div><p>Leave a little room for possibility.</p><small>Your next idea will feel right at home here.</small></div></div>')+'</section></div><aside class="dashboard-aside"><section class="quick-capture"><div class="section-title"><h2>A little spark?</h2><span class="little-star">✧</span></div><p>Catch it before it slips away. You can figure out the rest later.</p><form id="capture-form"><textarea class="capture-input" id="quick-idea" aria-label="Quick idea" maxlength="20000" placeholder="What if I built something that..."></textarea><div class="capture-bottom"><span>No perfect words needed.</span><button class="button" type="submit">'+icon('plus')+'Save idea</button></div></form></section><section class="focus-box"><div class="focus-title">'+icon('target')+'A little focus</div>'+(focus.map(p=>'<button class="focus-item" data-action="view-project" data-id="'+p.id+'"><span class="focus-circle"></span><span><strong>'+esc(p.nextStep || p.tasks.find(t=>!t.done).text)+'</strong><small>'+esc(p.title)+'</small></span></button>').join('') || '<p class="small-empty">Add a next step to an active project and it will find its way here.</p>')+'</section></aside></div><section class="activity-section"><div class="section-title"><h2>Your studio, lately</h2><a class="text-button" href="#activity">All activity '+icon('arrow')+'</a></div><div class="activity-list">'+activityRows(state.activity.slice(0,3))+'</div></section>';
}
function projectsPage() {
  const filtered = state.projects.filter(p => projectFilter==='all'?p.status!=='archived':p.status===projectFilter);
  const tabs = [['all','All projects'],['active','In progress'],['planning','Planning'],['paused','On hold'],['completed','Completed'],['archived','Archived']];
  return pageHeading('THE WORKBENCH','A place for your projects.','Keep the big picture and the next little step in the same place.',addProjectButton)+
    '<div class="filter-bar"><div class="tabs" aria-label="Project filters">'+tabs.map(([key,label])=>'<button class="tab '+(projectFilter===key?'active':'')+'" aria-pressed="'+(projectFilter===key)+'" data-action="project-filter" data-value="'+key+'">'+label+'</button>').join('')+'</div><div class="filter-right"><select id="project-sort" aria-label="Sort projects"><option value="updated" '+(sortOrder==='updated'?'selected':'')+'>Recently updated</option><option value="title" '+(sortOrder==='title'?'selected':'')+'>Alphabetical</option><option value="priority" '+(sortOrder==='priority'?'selected':'')+'>Priority</option></select><div class="view-toggle"><button class="'+(projectView==='grid'?'active':'')+'" data-action="project-view" data-value="grid" aria-label="Grid view" aria-pressed="'+(projectView==='grid')+'">'+icon('grid')+'</button><button class="'+(projectView==='list'?'active':'')+'" data-action="project-view" data-value="list" aria-label="List view" aria-pressed="'+(projectView==='list')+'">'+icon('list')+'</button></div></div></div>'+
    (filtered.length?'<div class="project-grid full-grid '+(projectView==='list'?'list-view':'')+'">'+orderedProjects(filtered).map(projectCard).join('')+'</div>':emptyState('projects','A fresh bit of space.','No projects in this view yet. Start something you’re excited about.',addProjectButton));
}
function emptyState(symbol,title,message,action='') { return '<div class="empty-state"><span class="empty-icon">'+icon(symbol)+'</span><h2>'+title+'</h2><p>'+message+'</p>'+action+'</div>'; }
function ideaCard(i) {
  return '<article class="idea-card"><div class="card-top">'+status(i.stage)+'<button class="star-button '+(i.starred?'starred':'')+'" data-action="star-idea" data-id="'+i.id+'" aria-label="'+(i.starred?'Unstar':'Star')+' '+esc(i.title)+'" aria-pressed="'+i.starred+'">'+icon('star')+'</button></div><h3>'+esc(i.title)+'</h3><div class="description">'+esc(i.description || 'A small beginning with plenty of possibility.')+'</div><div class="card-tags">'+tagList(i.tags)+'</div><div class="idea-action-row"><button class="text-button" data-action="view-idea" data-id="'+i.id+'">Open idea '+icon('arrow')+'</button><span class="idea-date">'+dateLabel(i.createdAt)+'</span></div></article>';
}
function ideasPage() {
  const filtered = state.ideas.filter(i => ideaFilter==='all'||(ideaFilter==='starred'?i.starred:i.stage===ideaFilter)).sort((a,b)=>Number(b.starred)-Number(a.starred)||b.updatedAt.localeCompare(a.updatedAt));
  return pageHeading('SAVE THE SPARK','Your idea garden.','Some things are ready to grow. Some just need a little time.',addIdeaButton)+
    '<div class="filter-bar"><div class="tabs" aria-label="Idea filters">'+[['all','All ideas'],['starred','Starred'],['spark','New sparks'],['exploring','Exploring'],['ready','Ready to build'],['parked','Parked']].map(([key,label])=>'<button class="tab '+(ideaFilter===key?'active':'')+'" aria-pressed="'+(ideaFilter===key)+'" data-action="idea-filter" data-value="'+key+'">'+label+'</button>').join('')+'</div><span class="section-kicker">'+filtered.length+' little possibilit'+(filtered.length===1?'y':'ies')+'</span></div>'+
    (filtered.length?'<div class="idea-grid">'+filtered.map(ideaCard).join('')+'</div>':emptyState('bulb','Good ideas need a place to land.','An app, a business, a wild “what if.” Save it here and come back when you’re ready.',addIdeaButton));
}
function getFocusProjects() { return activeProjects().sort((a,b)=>({high:0,medium:1,low:2}[a.priority]-{high:0,medium:1,low:2}[b.priority] || (a.dueDate || '9999').localeCompare(b.dueDate || '9999'))); }
function briefingPage() {
  const active = getFocusProjects(), incomplete = projects().flatMap(p=>p.tasks).filter(t=>!t.done).length;
  return pageHeading('A LITTLE CLARITY','Your workspace, in perspective.','A briefing drawn from the projects, ideas, and next steps you’ve saved.','<button class="button" data-action="copy-workspace">'+icon('copy')+'Copy for Codex</button>')+
    '<section class="briefing-hero"><span class="briefing-symbol">✳</span><div><h2>'+active.length+' project'+(active.length!==1?'s':'')+' in motion. Plenty of possibility.</h2><p>You have '+incomplete+' open step'+(incomplete!==1?'s':'')+' across your projects and '+state.ideas.filter(i=>i.stage==='ready').length+' idea'+(state.ideas.filter(i=>i.stage==='ready').length!==1?'s':'')+' ready to build. '+(active[0]?'A good place to start: '+esc(active[0].title)+'.':'Choose a project or let a new idea take shape.')+'</p></div></section>'+
    '<div class="briefing-layout"><div><section class="panel"><h2>Where your attention can go</h2>'+(active.map(p=>'<div class="briefing-project"><div class="briefing-project-top"><h3>'+esc(p.title)+'</h3>'+status(p.status)+'</div><p><strong>Next step:</strong> '+esc(p.nextStep || p.tasks.find(t=>!t.done)?.text || 'Set a small, concrete next step.')+'</p>'+(p.dueDate?'<p>Target date: '+esc(dateLabel(p.dueDate+'T12:00:00'))+'</p>':'')+'<button class="text-button" data-action="view-project" data-id="'+p.id+'">Open project '+icon('arrow')+'</button></div>').join('')||'<p class="small-empty">Your active projects and next steps will appear here.</p>')+'</section><section class="panel"><h2>Find a thread in your workspace</h2><form id="query-form" class="query-form"><input id="workspace-query" required maxlength="250" aria-label="Ask about your workspace" placeholder="What should I work on next?"><button class="button small" type="submit">Find it '+icon('arrow')+'</button></form><div class="suggested-questions"><button data-action="query" data-value="What should I work on next?">What’s next?</button><button data-action="query" data-value="What is on hold?">What’s on hold?</button><button data-action="query" data-value="Which ideas are ready to build?">Ready to build?</button></div><div id="query-answer" class="answer-box hidden" role="status"></div><p class="panel-note">This briefing uses your saved details and keyword matching. For a conversation with Codex, copy your workspace context above and paste it into your session.</p></section></div><aside><section class="panel"><h2>The bigger picture</h2>'+[['Active projects',active.length],['Planning',state.projects.filter(p=>p.status==='planning').length],['On hold',state.projects.filter(p=>p.status==='paused').length],['Ideas saved',state.ideas.length],['Open checklist steps',incomplete],['Completed projects',state.projects.filter(p=>p.status==='completed').length]].map(([title,value])=>'<div class="briefing-metric"><span>'+title+'</span><strong>'+value+'</strong></div>').join('')+'</section><section class="panel"><h2>Ideas with a little momentum</h2>'+(state.ideas.filter(i=>i.stage==='ready'||i.starred).slice(0,4).map(ideaPreview).join('')||'<p class="small-empty">Star an idea or mark it “Ready to build” to give it a spot here.</p>')+'</section></aside></div>';
}
function portfolioPage() {
  const featured = projects().filter(p=>p.featured);
  return pageHeading('A COLLECTION OF YOUR MAKING','Your work, all together.','A private portfolio of the projects you choose to feature.','<button class="button secondary" data-action="navigate" data-route="projects">'+icon('projects')+'Manage projects</button>')+
    '<div class="portfolio-intro"><div class="eyebrow">THE PERSONAL COLLECTION OF '+esc((state.profile.name||'YOUR STUDIO').toUpperCase())+'</div><h2>Always curious.<br>Always making.</h2><p>'+esc(state.profile.intention || 'A collection of ideas brought to life, and things still taking shape.')+'</p></div>'+
    (featured.length?'<div class="project-grid full-grid">'+featured.map(p=>'<article class="portfolio-card"><div class="portfolio-cover '+p.color+'"><span class="project-symbol '+p.color+'">'+esc(p.title[0].toUpperCase())+'</span></div><div class="portfolio-body"><div class="detail-meta">'+status(p.status)+'</div><h3>'+esc(p.title)+'</h3><p>'+esc(p.description)+'</p><div class="card-tags">'+tagList(p.tags)+'</div><div class="portfolio-links"><button data-action="view-project" data-id="'+p.id+'">Explore project ↗</button>'+(safeUrl(p.url)?'<a href="'+esc(safeUrl(p.url))+'" target="_blank" rel="noopener noreferrer">Visit website ↗</a>':'')+(safeUrl(p.github)?'<a href="'+esc(safeUrl(p.github))+'" target="_blank" rel="noopener noreferrer">Repository ↗</a>':'')+'</div></div></article>').join('')+'</div>':emptyState('portfolio','A collection waiting to happen.','Edit a project and turn on “Feature in my portfolio” to add it here.',addProjectButton));
}
function activityPage() { return pageHeading('THE SMALL STEPS ADD UP','A little history of progress.','Your latest 100 workspace moments, from first sparks to finished projects.')+'<div class="panel activity-full">'+activityRows(state.activity)+'</div>'; }
function applyProgress() { $$('[data-progress]').forEach(el => { el.style.width = el.dataset.progress + '%'; }); }
function render() {
  if (!state) return;
  route = location.hash.slice(1).split('?')[0] || 'overview'; if (!routes[route]) route = 'overview';
  renderNavigation(); $('#breadcrumb').textContent = routes[route];
  const pages = {overview:overviewPage,projects:projectsPage,ideas:ideasPage,briefing:briefingPage,portfolio:portfolioPage,activity:activityPage};
  $('#main').innerHTML = pages[route](); applyProgress(); $('#sidebar').classList.remove('open');
  document.title = routes[route] + ' — Personal Studio';
}
function openEditor(content,kind,id='') {
  const dialog = $('#editor');
  if (!dialog.open) editorReturnFocus = document.activeElement;
  $('#editor-content').innerHTML = content; dialogKind = kind; dialogId = id; dirtyForm = false;
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0; applyProgress();
}
function dialogHead(kicker,title,description='') { return '<div class="dialog-head"><div><div class="eyebrow">'+esc(kicker)+'</div><h2>'+esc(title)+'</h2>'+(description?'<p>'+esc(description)+'</p>':'')+'</div><button class="icon-button" type="button" data-action="close-editor" aria-label="Close dialog">'+icon('close')+'</button></div>'; }
function closeEditor(force=false) { if (!force && dirtyForm && !confirm('Discard the changes in this form?')) return; $('#editor').close(); dirtyForm=false; if(editorReturnFocus?.isConnected) editorReturnFocus.focus(); }
function inputField(label,name,value='',type='text',extra='',hint='') { return '<div class="field '+extra+'"><label for="field-'+name+'">'+label+'</label><input id="field-'+name+'" name="'+name+'" type="'+type+'" value="'+esc(value)+'" '+(name==='title'?'required maxlength="180"':name==='name'?'maxlength="80"':name==='tags'?'maxlength="1000"':name==='folder'?'maxlength="1000"':name==='nextStep'?'maxlength="3000"':name==='intention'?'maxlength="250"':name==='url'||name==='github'?'maxlength="2000"':'')+'>'+(hint?'<span class="hint">'+hint+'</span>':'')+'</div>'; }
function textareaField(label,name,value='',extra='',hint='') { return '<div class="field '+extra+'"><label for="field-'+name+'">'+label+'</label><textarea id="field-'+name+'" name="'+name+'" maxlength="'+(name==='notes'?'100000':'20000')+'" rows="'+(name==='notes'?'5':'3')+'">'+esc(value)+'</textarea>'+(hint?'<span class="hint">'+hint+'</span>':'')+'</div>'; }
function selectField(label,name,value,options) { return '<div class="field"><label for="field-'+name+'">'+label+'</label><select id="field-'+name+'" name="'+name+'">'+options.map(([v,l])=>'<option value="'+v+'" '+(v===value?'selected':'')+'>'+l+'</option>').join('')+'</select></div>'; }
const projectDefaults = {title:'',description:'',status:'planning',category:'Personal',color:'blue',priority:'medium',tags:[],folder:'',url:'',github:'',featured:false,nextStep:'',dueDate:'',notes:'',tasks:[]};
function projectForm(id='',prefill=null) {
  const existing = state.projects.find(p=>p.id===id);
  const p = existing || {...projectDefaults,...prefill};
  openEditor('<form id="project-form">'+dialogHead(existing?'ON THE WORKBENCH':'A NEW CHAPTER',existing?'Make a little room to grow.':'What are you working on?','Save the big picture. Give yourself a next step.')+
    '<div class="dialog-body"><div class="field-grid">'+inputField('Project name *','title',p.title,'text','full')+textareaField('The big idea','description',p.description,'full')+
    selectField('Status','status',p.status,['planning','active','paused','completed','archived'].map(x=>[x,labels[x]]))+selectField('Priority','priority',p.priority,[['low','Low · whenever there’s room'],['medium','Medium · steady progress'],['high','High · make it a focus']])+
    inputField('Category','category',p.category)+selectField('Project colour','color',p.color,[['blue','Royal blue'],['sage','Garden sage'],['rose','Soft terracotta'],['amber','Warm honey']])+
    inputField('Tags','tags',p.tags.join(', '),'text','full','Separate tags with commas, e.g. Codex, Web app, Business.')+
    inputField('The next small step','nextStep',p.nextStep,'text','full')+inputField('Target date','dueDate',p.dueDate,'date')+inputField('Project folder','folder',p.folder,'text','','e.g. F:&#92;my-project — included in your Codex handoff.')+
    inputField('Website or demo URL','url',p.url,'url')+inputField('Repository URL','github',p.github,'url')+
    textareaField('Notes & Codex context','notes',p.notes,'full','Decisions, technical details, prompts, and where you left off.')+
    '</div><label class="field-checkbox"><input type="checkbox" name="featured" '+(p.featured?'checked':'')+'>Feature in my private portfolio</label></div>'+
    '<div class="dialog-footer">'+(existing?'<button class="delete-button" type="button" data-action="delete-project" data-id="'+id+'">Delete project</button>':'')+'<button class="button secondary" type="button" data-action="close-editor">Cancel</button><button class="button" type="submit">'+icon('check')+(existing?'Save changes':'Create project')+'</button></div></form>','project-form',id);
}
function projectDetail(id) {
  const p = state.projects.find(p=>p.id===id); if (!p) return;
  const pct = progress(p);
  openEditor(dialogHead('ON THE WORKBENCH',p.title)+
    '<div class="dialog-body"><div class="detail-meta">'+status(p.status)+'<span class="tag">'+esc(p.priority)+' priority</span>'+tagList(p.tags)+'</div><div class="detail-description">'+esc(p.description || 'This project is waiting for its story.')+'</div>'+
    '<section class="detail-section"><h3>The next small step</h3><div class="detail-next">'+esc(p.nextStep || 'Edit this project to choose what comes next.')+'</div></section>'+
    '<section class="detail-section"><div class="section-title"><h3>Small steps, real progress</h3><span class="section-kicker">'+pct+'% complete</span></div><div class="progress-track"><div class="progress-fill" data-progress="'+pct+'"></div></div><div class="task-list">'+p.tasks.map(t=>'<div class="task-row '+(t.done?'done':'')+'"><input type="checkbox" id="task-'+t.id+'" data-task-id="'+t.id+'" data-project-id="'+p.id+'" '+(t.done?'checked':'')+'><label for="task-'+t.id+'">'+esc(t.text)+'</label><button class="icon-button" data-action="delete-task" data-id="'+t.id+'" data-project="'+p.id+'" aria-label="Delete step '+esc(t.text)+'">'+icon('close')+'</button></div>').join('')+'</div><form id="task-form" class="task-form"><input name="task" aria-label="New checklist step" placeholder="Break it down into a small step..." required maxlength="180"><button class="button small" type="submit">'+icon('plus')+'Add</button></form></section>'+
    '<section class="detail-section"><h3>Notes & Codex context</h3><div class="detail-notes">'+esc(p.notes || 'No notes yet. Save decisions, technical details, and where you left off here.')+'</div></section>'+
    (p.folder?'<section class="detail-section"><h3>Project folder</h3><div class="detail-path">'+esc(p.folder)+'</div></section>':'')+
    (p.dueDate?'<p class="panel-note">Target date: '+esc(dateLabel(p.dueDate+'T12:00:00'))+'</p>':'')+
    '<div class="detail-links">'+(safeUrl(p.url)?'<a href="'+esc(safeUrl(p.url))+'" target="_blank" rel="noopener noreferrer">Open website ↗</a>':'')+(safeUrl(p.github)?'<a href="'+esc(safeUrl(p.github))+'" target="_blank" rel="noopener noreferrer">Open repository ↗</a>':'')+'</div></div>'+
    '<div class="dialog-footer"><button class="button secondary" data-action="copy-project" data-id="'+p.id+'">'+icon('copy')+'Copy for Codex</button><button class="button" data-action="edit-project" data-id="'+p.id+'">'+icon('edit')+'Edit project</button></div>','project-detail',id);
}
function ideaForm(id='') {
  const i = state.ideas.find(x=>x.id===id) || {title:'',description:'',tags:[],stage:'spark',starred:false};
  openEditor('<form id="idea-form">'+dialogHead(id?'LET IT GROW':'CATCH THE SPARK',id?'A little more possibility.':'What’s on your mind?','It doesn’t need a plan yet. Just a place to begin.')+
    '<div class="dialog-body"><div class="field-grid">'+inputField('Give your idea a name *','title',i.title,'text','full')+textareaField('Tell yourself a little more','description',i.description,'full')+
    selectField('Where is it at?','stage',i.stage,['spark','exploring','ready','parked'].map(x=>[x,labels[x]]))+inputField('Tags','tags',i.tags.join(', '),'text','','Separate with commas.')+'</div><label class="field-checkbox"><input type="checkbox" name="starred" '+(i.starred?'checked':'')+'>Star this idea — it’s got something</label></div>'+
    '<div class="dialog-footer">'+(id?'<button type="button" class="delete-button" data-action="delete-idea" data-id="'+id+'">Delete idea</button>':'')+'<button type="button" class="button secondary" data-action="close-editor">Cancel</button><button class="button" type="submit">'+icon('check')+(id?'Save changes':'Save idea')+'</button></div></form>','idea-form',id);
}
function ideaDetail(id) {
  const i = state.ideas.find(x=>x.id===id); if(!i)return;
  openEditor(dialogHead('FROM THE IDEA GARDEN',i.title)+
    '<div class="dialog-body"><div class="detail-meta">'+status(i.stage)+(i.starred?'<span class="tag">★ Starred</span>':'')+tagList(i.tags)+'</div><p class="detail-description">'+esc(i.description || 'A little spark with room to become something.')+'</p><p class="panel-note">First captured '+dateLabel(i.createdAt)+'. Last tended '+relative(i.updatedAt).toLowerCase()+'.</p><div class="detail-section"><h3>Ready for a next chapter?</h3><p class="panel-note">Turn this idea into a project. Your idea becomes a planning project with its description and tags, ready for next steps.</p></div></div>'+
    '<div class="dialog-footer"><button class="button secondary" data-action="edit-idea" data-id="'+i.id+'">'+icon('edit')+'Edit idea</button><button class="button" data-action="promote-idea" data-id="'+i.id+'">'+icon('northeast')+'Turn into project</button></div>','idea-detail',id);
}
function settings() {
  openEditor('<form id="settings-form">'+dialogHead('MAKE IT YOURS','Your little corner of the world.','A few details that make this space feel like you.')+
    '<div class="dialog-body">'+inputField('Your name','name',state.profile.name)+textareaField('Your portfolio introduction','intention',state.profile.intention)+
    '<section class="settings-group"><h3>Your workspace belongs to you.</h3><p>'+(cloudStorage?'Your projects, ideas, notes, and checklists are saved in your password-protected cloud workspace. The previous saved revision is retained. Export a backup to keep another copy, or restore a backup from your PC.':'Your projects, ideas, notes, and checklists are saved in data/workspace.json on this PC. Export a backup to keep another copy or move to another device.')+'</p><div class="settings-actions"><button type="button" class="button secondary" data-action="export">'+icon('download')+'Export backup</button><button type="button" class="button secondary" data-action="import">'+icon('upload')+'Restore backup</button></div></section>'+
    '<section class="settings-group"><h3>Working with Codex</h3><p>Add the project’s folder path and notes, then choose <strong>Copy for Codex</strong>. Paste the handoff into your Codex session to give it your current context. Update your notes when the session ends.</p><p>This app does not automatically read your Codex history or other folders.</p></section></div><div class="dialog-footer"><button type="button" class="button secondary" data-action="close-editor">Close</button><button type="submit" class="button">Save settings</button></div></form>','settings');
  $('#field-intention').maxLength=250;
}
function help() {
  openEditor(dialogHead('A SMALL FIELD GUIDE','Welcome to your studio.')+'<div class="dialog-body"><ul class="help-list"><li><strong>My projects:</strong> keep your current work, folder paths, next steps, and checklists in one place.</li><li><strong>Idea garden:</strong> capture rough sparks, star the good ones, and grow them into projects.</li><li><strong>My briefing:</strong> get a snapshot of your work and find details in your saved context.</li><li><strong>My portfolio:</strong> feature the projects you want to collect in a private showcase.</li><li><strong>Copy for Codex:</strong> paste a project or workspace handoff into your next coding session.</li><li><kbd>Ctrl K</kbd> / <kbd>⌘ K</kbd> opens search. <kbd>Esc</kbd> closes a dialog.</li></ul><p class="panel-note">'+(cloudStorage?'Your data is saved in your private cloud workspace.':'Your data is saved on this PC.')+' Use Workspace settings → Export backup to keep another copy.</p></div><div class="dialog-footer"><button class="button" data-action="close-editor">Make something good '+icon('arrow')+'</button></div>','help');
}
function projectContext(p) {
  return '# '+p.title+'\n\n'+p.description+'\n\nStatus: '+labels[p.status]+'\nPriority: '+p.priority+
    (p.folder?'\nLocal folder: '+p.folder:'')+(p.url?'\nWebsite: '+p.url:'')+(p.github?'\nRepository: '+p.github:'')+(p.dueDate?'\nTarget date: '+p.dueDate:'')+
    '\nTags: '+p.tags.join(', ')+'\n\n## Next step\n'+(p.nextStep||'Not set yet.')+'\n\n## Checklist\n'+(p.tasks.map(t=>'- ['+(t.done?'x':' ')+'] '+t.text).join('\n')||'No checklist yet.')+'\n\n## Notes and context\n'+(p.notes||'No notes yet.');
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast('Context copied. Paste it into your Codex session.'); }
  catch {
    const area=document.createElement('textarea'); area.value=text; area.style.position='fixed'; area.style.opacity='0';
    const parent=$('#editor').open?$('#editor'):document.body; parent.append(area); area.select(); const ok=document.execCommand('copy'); area.remove();
    if(ok)toast('Context copied. Paste it into your Codex session.'); else toast('Clipboard unavailable. Export your backup from settings instead.');
  }
}
function workspaceContext() {
  return '# Personal Studio — '+(state.profile.name||'My workspace')+'\nSnapshot: '+new Date().toLocaleString()+'\n\nTreat the following as my saved project context. Check the actual code and files before making changes.\n\n'+projects().map(projectContext).join('\n\n---\n\n')+'\n\n# Idea garden\n'+(state.ideas.map(i=>'## '+i.title+'\nStage: '+labels[i.stage]+'\n'+i.description).join('\n\n')||'No ideas captured yet.');
}
function answerQuery(query) {
  const q=query.toLowerCase(), result=$('#query-answer');
  let answer='';
  if(/next|focus|priorit|work on/.test(q)) {
    const list=getFocusProjects();
    answer=list.length?list.slice(0,5).map((p,index)=>(index+1)+'. '+p.title+(p.priority==='high'?' (high priority)':'')+'\n'+(p.nextStep||p.tasks.find(t=>!t.done)?.text||'Choose a small next step.')).join('\n\n'):'No projects are in progress yet. Start a planning project or turn a promising idea into a project.';
  } else if(/hold|paused|blocked/.test(q)) {
    const list=state.projects.filter(p=>p.status==='paused');
    answer=list.length?list.map(p=>p.title+'\n'+(p.nextStep||'No next step saved.')+(p.notes?'\nNotes: '+p.notes.slice(0,350):'')).join('\n\n'):'You have no projects marked “On hold.”';
  } else if(/ready|idea/.test(q)&&!/project/.test(q)) {
    const list=state.ideas.filter(i=>/ready|build/.test(q)?i.stage==='ready':true);
    answer=list.length?list.slice(0,8).map(i=>i.title+' · '+labels[i.stage]+'\n'+(i.description||'No extra notes yet.')).join('\n\n'):'No matching ideas yet. Capture a spark or mark an idea “Ready to build.”';
  } else if(/complete|finished|done/.test(q)) {
    const list=state.projects.filter(p=>p.status==='completed');
    answer=list.length?list.map(p=>p.title+'\n'+p.description).join('\n\n'):'No projects marked completed yet. Every small step counts.';
  } else {
    const words=q.split(/\s+/).filter(w=>w.length>2&&!['what','which','where','about','tell','have','with','the','and','for','are','can','you','show','find','does','how','that','this'].includes(w));
    const projectMatches=state.projects.filter(p=>words.some(w=>[p.title,p.description,p.notes,p.nextStep,p.folder,...p.tags,...p.tasks.map(t=>t.text)].join(' ').toLowerCase().includes(w)));
    const ideaMatches=state.ideas.filter(i=>words.some(w=>[i.title,i.description,...i.tags].join(' ').toLowerCase().includes(w)));
    answer=[...projectMatches.slice(0,5).map(p=>p.title+' · '+labels[p.status]+'\n'+(p.description||p.nextStep||'No description yet.')+(p.nextStep?'\nNext: '+p.nextStep:'')),...ideaMatches.slice(0,5).map(i=>i.title+' · Idea, '+labels[i.stage]+'\n'+i.description)].join('\n\n')||'I couldn’t find a matching detail in your saved workspace. Try a project name, a tag, or a word from your notes.';
  }
  result.textContent=answer; result.classList.remove('hidden');
}
function searchWorkspace(query='') {
  const q=query.trim().toLowerCase();
  const matches=[...state.projects.map(p=>({kind:'project',id:p.id,title:p.title,subtitle:labels[p.status]+' · '+(p.category||'Project'),text:[p.title,p.description,p.notes,p.nextStep,p.folder,...p.tags,...p.tasks.map(t=>t.text)].join(' ')})),...state.ideas.map(i=>({kind:'idea',id:i.id,title:i.title,subtitle:'Idea · '+labels[i.stage],text:[i.title,i.description,...i.tags].join(' ')}))].filter(item=>!q||item.text.toLowerCase().includes(q)).slice(0,30);
  $('#search-results').innerHTML = matches.length?matches.map(m=>'<button class="search-result" data-action="search-open" data-kind="'+m.kind+'" data-id="'+m.id+'">'+icon(m.kind==='project'?'projects':'bulb')+'<span><strong>'+esc(m.title)+'</strong><small>'+esc(m.subtitle)+'</small></span>'+icon('northeast')+'</button>').join(''):'<div class="search-empty">No matches yet. Try another word.</div>';
  searchIndex=0;
}
function openSearch() { if(!state)return; searchReturnFocus=document.activeElement; $('#global-search').value=''; searchWorkspace(); $('#search-dialog').showModal(); $('#global-search').focus(); }
function exportBackup() {
  const blob=new Blob([JSON.stringify({...state,revision},null,2)],{type:'application/json'});
  const link=document.createElement('a'); const url=URL.createObjectURL(blob); link.href=url; link.download='personal-studio-backup-'+new Date().toISOString().slice(0,10)+'.json'; link.click(); setTimeout(()=>URL.revokeObjectURL(url),1500); toast('Workspace backup exported.');
}
function parseTags(value) { const tags=[...new Set(value.split(',').map(t=>t.trim()).filter(Boolean))]; if(tags.length>20 || tags.some(t=>t.length>60))throw new Error('Use up to 20 tags, with 60 characters per tag.'); return tags; }
async function handleSubmit(event) {
  const form=event.target; if(!['project-form','idea-form','capture-form','task-form','settings-form','query-form'].includes(form.id))return;
  event.preventDefault();
  if(!form.reportValidity())return;
  const f=new FormData(form);
  try {
    if(form.id==='query-form') { answerQuery($('#workspace-query').value); return; }
    if(form.id==='capture-form') {
      const text=$('#quick-idea').value.trim(); if(!text){toast('Give your spark a few words first.');return;}
      const firstLine=text.split('\n')[0]; const title=firstLine.length<=180?firstLine:firstLine.slice(0,177)+'...';
      state.ideas.unshift({id:uid(),title,description:text===title?'':text,stage:'spark',tags:[],starred:false,createdAt:now(),updatedAt:now()});
      addActivity('Captured an idea: '+title,'idea'); render(); persist().catch(()=>{}); toast('A little spark, safely caught.'); return;
    }
    if(form.id==='project-form') {
      const existing=state.projects.find(p=>p.id===dialogId);
      const values={}; for(const key of ['title','description','status','priority','category','color','folder','url','github','nextStep','dueDate','notes'])values[key]=String(f.get(key)||'').trim();
      if(!values.title)throw new Error('Give your project a name.');
      if(values.category.length>80)throw new Error('Keep the category under 80 characters.');
      const p={...structuredClone(projectDefaults),...existing,...values,tags:parseTags(String(f.get('tags')||'')),featured:f.has('featured'),id:existing?.id||uid(),createdAt:existing?.createdAt||now(),updatedAt:now()};
      if(existing) state.projects=state.projects.map(x=>x.id===p.id?p:x); else state.projects.unshift(p);
      addActivity((existing?'Updated project: ':'Started a project: ')+p.title);
      closeEditor(true); render(); persist().catch(()=>{}); projectDetail(p.id); toast(existing?'Project updated. A little clearer.':'A new chapter, started.'); return;
    }
    if(form.id==='idea-form') {
      const existing=state.ideas.find(i=>i.id===dialogId), title=String(f.get('title')).trim(); if(!title)throw new Error('Give your idea a name.');
      const idea={id:existing?.id||uid(),title,description:String(f.get('description')||'').trim(),stage:f.get('stage'),tags:parseTags(String(f.get('tags')||'')),starred:f.has('starred'),createdAt:existing?.createdAt||now(),updatedAt:now()};
      if(existing)state.ideas=state.ideas.map(i=>i.id===idea.id?idea:i);else state.ideas.unshift(idea);
      addActivity((existing?'Tended an idea: ':'Captured an idea: ')+idea.title,'idea');
      closeEditor(true);render();persist().catch(()=>{});toast(existing?'A little more room to grow.':'Your idea has a home.');return;
    }
    if(form.id==='task-form') {
      const p=state.projects.find(p=>p.id===dialogId); const text=String(f.get('task')).trim(); if(!text)return;
      if(p.tasks.length>=500)throw new Error('This project already has 500 checklist steps.');
      p.tasks.push({id:uid(),text,done:false});p.updatedAt=now();addActivity('Added a step to '+p.title);render();projectDetail(p.id);persist().catch(()=>{});$('#task-form input').focus();return;
    }
    if(form.id==='settings-form') {
      state.profile={name:String(f.get('name')||'').trim(),intention:String(f.get('intention')||'').trim()};
      closeEditor(true);render();persist().catch(()=>{});toast('A little more you. Settings saved.');return;
    }
  } catch(e) { toast(e.message); }
}
const actions={
  'new-project':()=>projectForm(),
  'new-idea':()=>ideaForm(),
  'view-project':el=>projectDetail(el.dataset.id),
  'edit-project':el=>projectForm(el.dataset.id),
  'view-idea':el=>ideaDetail(el.dataset.id),
  'edit-idea':el=>ideaForm(el.dataset.id),
  'close-editor':()=>closeEditor(),
  'menu':()=>$('#sidebar').classList.toggle('open'),
  'settings':settings,'help':help,'search':openSearch,
  'close-search':()=>$('#search-dialog').close(),
  'navigate':el=>{location.hash=el.dataset.route;},
  'project-filter':el=>{projectFilter=el.dataset.value;render();},
  'idea-filter':el=>{ideaFilter=el.dataset.value;render();},
  'project-view':el=>{projectView=el.dataset.value;render();},
  'copy-project':el=>copyText(projectContext(state.projects.find(p=>p.id===el.dataset.id))),
  'copy-workspace':()=>copyText(workspaceContext()),
  'query':el=>{$('#workspace-query').value=el.dataset.value;answerQuery(el.dataset.value);},
  'retry':()=>persist().then(()=>toast('Your changes are saved.')).catch(()=>{}),
  'star-idea':el=>{const i=state.ideas.find(i=>i.id===el.dataset.id);i.starred=!i.starred;i.updatedAt=now();render();persist().catch(()=>{});},
  'delete-project':el=>{
    const p=state.projects.find(p=>p.id===el.dataset.id);
    if(!confirm('Delete “'+p.title+'” and its notes and checklist? Export a backup first if you want to keep a copy.'))return;
    state.projects=state.projects.filter(x=>x.id!==p.id);addActivity('Deleted project: '+p.title);closeEditor(true);render();persist().catch(()=>{});toast('Project deleted.');
  },
  'delete-idea':el=>{
    const idea=state.ideas.find(i=>i.id===el.dataset.id);if(!confirm('Delete the idea “'+idea.title+'”?'))return;
    state.ideas=state.ideas.filter(i=>i.id!==idea.id);addActivity('Let go of an idea: '+idea.title,'idea');closeEditor(true);render();persist().catch(()=>{});toast('Idea deleted.');
  },
  'delete-task':el=>{const p=state.projects.find(p=>p.id===el.dataset.project);p.tasks=p.tasks.filter(t=>t.id!==el.dataset.id);p.updatedAt=now();render();projectDetail(p.id);persist().catch(()=>{});},
  'promote-idea':el=>{
    const i=state.ideas.find(i=>i.id===el.dataset.id);const p={...structuredClone(projectDefaults),id:uid(),title:i.title,description:i.description,tags:[...i.tags],createdAt:now(),updatedAt:now()};
    state.projects.unshift(p);state.ideas=state.ideas.filter(x=>x.id!==i.id);addActivity('Grew an idea into a project: '+p.title,'idea');
    closeEditor(true);location.hash='projects';render();persist().catch(()=>{});projectDetail(p.id);toast('Your idea is now a project. Let’s give it a next step.');
  },
  'search-open':el=>{$('#search-dialog').close();(el.dataset.kind==='project'?projectDetail:ideaDetail)(el.dataset.id);},
  'export':exportBackup,
  'import':()=>{if(dirtyForm&&!confirm('Discard form changes and restore a backup?'))return;$('#import-file').click();}
};
document.addEventListener('click',event=>{
  const el=event.target.closest('[data-action]');if(!el||!state)return;
  if(el.tagName==='A')return;const action=actions[el.dataset.action];if(action)action(el);
});
document.addEventListener('submit',handleSubmit);
document.addEventListener('input',event=>{if(event.target.closest('#project-form,#idea-form,#settings-form'))dirtyForm=true;});
document.addEventListener('change',event=>{
  const el=event.target;
  if(el.id==='project-sort'){sortOrder=el.value;render();}
  if(el.closest('#project-form,#idea-form,#settings-form'))dirtyForm=true;
  if(el.dataset.taskId){
    const p=state.projects.find(p=>p.id===el.dataset.projectId), t=p.tasks.find(t=>t.id===el.dataset.taskId);
    t.done=el.checked;p.updatedAt=now();addActivity((t.done?'Completed a step in ':'Reopened a step in ')+p.title);render();projectDetail(p.id);persist().catch(()=>{});
  }
});
$('#global-search').addEventListener('input',e=>searchWorkspace(e.target.value));
$('#search-dialog').addEventListener('close',()=>{if(searchReturnFocus?.isConnected)searchReturnFocus.focus();});
$('#editor').addEventListener('cancel',event=>{event.preventDefault();closeEditor();});
$('#editor').addEventListener('click',event=>{if(event.target===$('#editor')){const rect=event.target.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeEditor();}});
document.addEventListener('keydown',event=>{
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();if($('#search-dialog').open)$('#search-dialog').close();else openSearch();return;}
  if($('#search-dialog').open&&['ArrowDown','ArrowUp','Enter'].includes(event.key)){
    const list=$$('.search-result');if(!list.length)return;
    if(event.key==='Enter'&&event.target.id==='global-search'){event.preventDefault();list[0].click();return;}
    if(event.key==='ArrowDown'||event.key==='ArrowUp'){
      event.preventDefault();const index=list.indexOf(document.activeElement);searchIndex=event.key==='ArrowDown'?(index+1)%list.length:(index<1?list.length-1:index-1);list[searchIndex].focus();
    }
  }
  if((event.key==='Enter'||event.key===' ')&&event.target.matches('.project-card')){event.preventDefault();projectDetail(event.target.dataset.id);}
});
$('#import-file').addEventListener('change',async event=>{
  const file=event.target.files[0];event.target.value='';if(!file)return;
  try {
    if(file.size>5*1024*1024)throw new Error('Choose a backup smaller than 5 MB.');
    const imported=JSON.parse(await file.text());
    if(imported.schemaVersion!==1||!Array.isArray(imported.projects)||!Array.isArray(imported.ideas)||!Array.isArray(imported.activity)||!imported.profile)throw new Error('This is not a supported Personal Studio backup.');
    if(!confirm('Replace your workspace with this backup ('+imported.projects.length+' projects, '+imported.ideas.length+' ideas)? Export your current workspace first if you need to keep it.'))return;
    await saveChain;if(saveFailed)throw new Error('Save or export your pending changes before restoring a backup.');
    const response=await fetch('/api/workspace',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({...imported,revision})});
    const result=await response.json();if(!response.ok)throw new Error(result.error||'Backup could not be restored.');
    const fresh=await fetch('/api/workspace');if(!fresh.ok)throw new Error('Backup saved. Reload to open it.');
    state=await fresh.json();revision=state.revision;closeEditor(true);render();saveStatus();toast('Your workspace has been restored.');
  } catch(e){toast(e instanceof SyntaxError?'This file does not contain valid JSON.':e.message);}
});
window.addEventListener('hashchange',()=>{render();window.scrollTo(0,0);});
window.addEventListener('beforeunload',event=>{if(pendingSaves||saveFailed||dirtyForm){event.preventDefault();event.returnValue='';}});
async function boot() {
  hydrateIcons();
  try {
    const response=await fetch('/api/workspace');if(response.status===401){location.replace('/login.html');return;}if(!response.ok)throw new Error('Your cloud workspace could not be reached.');
    cloudStorage=response.headers.get('X-Studio-Storage')==='cloud';document.getElementById('sign-out').classList.toggle('hidden',!cloudStorage);state=await response.json();revision=state.revision;render();saveStatus();
  } catch(e){$('#main').innerHTML='<div class="error-state"><h1>Your studio is taking a moment.</h1><p>'+esc(e.message)+'</p><p>Check your internet connection, then refresh this page.</p><button class="button" data-action="reload">Try again</button></div>';$('#save-status').textContent='Workspace unavailable';document.addEventListener('click',e=>{if(e.target.closest('[data-action="reload"]'))location.reload();});}
}
boot();


document.getElementById('sign-out')?.addEventListener('click',async event=>{event.preventDefault();if(pendingSaves||saveFailed){toast('Wait for your changes to save, or export a backup before signing out.');return;}await fetch('/api/session',{method:'DELETE'});location.assign('/login.html');});

'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const http = require('node:http');
const { createApp } = require('../server.cjs');
async function fixture(t) {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'personal-studio-test-'));
  const server = await createApp({ dataDir });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
    const resolved = path.resolve(dataDir);
    assert.ok(resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(resolved).startsWith('personal-studio-test-'));
    await fs.rm(resolved, {recursive:true,force:true});
  });
  const base = 'http://127.0.0.1:' + server.address().port;
  return { dataDir,server,base,get:async()=>{const r=await fetch(base+'/api/workspace');return r.json();},put:async data=>fetch(base+'/api/workspace',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}) };
}
test('saves a complete project and idea workspace, and reloads it from disk', async t => {
  const f = await fixture(t); const state = await f.get();
  assert.equal(state.schemaVersion,1);assert.equal(state.revision,0);
  state.profile.name = 'Test person';state.projects[0].notes='A decision with unicode: café ✧';
  state.projects[0].tasks.push({id:'task-1',text:'Validate persistence',done:true});
  state.ideas.push({id:'idea-1',title:'A new thing',description:'Some context',stage:'ready',tags:['Codex'],starred:true,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
  const saved=await f.put(state);assert.equal(saved.status,200);assert.equal((await saved.json()).revision,1);
  const data=JSON.parse(await fs.readFile(path.join(f.dataDir,'workspace.json'),'utf8'));
  assert.equal(data.projects[0].notes,state.projects[0].notes);assert.equal(data.ideas[0].title,'A new thing');
  assert.equal(data.projects[0].tasks[0].done,true);
  const second=await createApp({dataDir:f.dataDir});second.listen(0,'127.0.0.1');await once(second,'listening');
  try{const reloaded=await (await fetch('http://127.0.0.1:'+second.address().port+'/api/workspace')).json();assert.deepEqual(reloaded,data);}
  finally{await new Promise(resolve=>second.close(resolve));}
});
test('rejects stale tab edits and keeps the last saved revision as a backup',async t=>{
  const f=await fixture(t);const original=await f.get();const update=structuredClone(original);update.profile.name='Updated';
  assert.equal((await f.put(update)).status,200);
  const stale=await f.put(original);assert.equal(stale.status,409);assert.match((await stale.json()).error,/another tab/);
  const previous=JSON.parse(await fs.readFile(path.join(f.dataDir,'workspace.previous.json'),'utf8'));
  assert.deepEqual(previous,original);assert.equal((await f.get()).profile.name,'Updated');
});
test('serializes simultaneous writes so exactly one revision succeeds',async t=>{
  const f=await fixture(t);const state=await f.get();
  const responses=await Promise.all([f.put({...state,profile:{...state.profile,name:'First'}}),f.put({...state,profile:{...state.profile,name:'Second'}})]);
  assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);assert.equal((await f.get()).revision,1);
});
test('rejects malformed backups without changing data',async t=>{
  const f=await fixture(t);const original=await f.get();
  for(const invalid of [{...original,projects:null},{...original,profile:{name:123,intention:''}},{...original,projects:[{...original.projects[0],title:' '}]},{...original,ideas:[{}]},{...original,schemaVersion:99}]){
    const response=await f.put(invalid);assert.equal(response.status,400);assert.deepEqual(await f.get(),original);
  }
  const invalidJson=await fetch(f.base+'/api/workspace',{method:'PUT',headers:{'Content-Type':'application/json'},body:'{broken'});
  assert.equal(invalidJson.status,400);
});
test('blocks external origins, unexpected hosts, private files, and unsupported methods',async t=>{
  const f=await fixture(t);
  assert.equal((await fetch(f.base+'/api/workspace',{headers:{Origin:'https://example.com'}})).status,403);
  const hostStatus=await new Promise((resolve,reject)=>{const req=http.get(f.base+'/api/workspace',{headers:{Host:'evil.example'}},res=>{res.resume();resolve(res.statusCode);});req.on('error',reject);});
  assert.equal(hostStatus,403);
  for(const route of ['/data/workspace.json','/server.cjs','/../package.json','/%2e%2e/data/workspace.json'])assert.equal((await fetch(f.base+route)).status,404);
  assert.equal((await fetch(f.base+'/',{method:'POST'})).status,405);
  assert.equal((await fetch(f.base+'/api/workspace',{method:'PUT',body:'{}'})).status,415);
  const response=await fetch(f.base+'/');assert.equal(response.status,200);assert.match(response.headers.get('content-security-policy'),/frame-ancestors 'none'/);assert.match(await response.text(),/Personal Studio/);
});
test('refuses startup on a corrupt saved file and preserves it',async t=>{
  const f=await fixture(t);await fs.writeFile(path.join(f.dataDir,'workspace.json'),'not-json');
  await assert.rejects(createApp({dataDir:f.dataDir}),/preserved/);
  assert.equal(await fs.readFile(path.join(f.dataDir,'workspace.json'),'utf8'),'not-json');
});

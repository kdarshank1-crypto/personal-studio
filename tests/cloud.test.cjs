'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
test('cloud sign-in, private data, durable saves, conflicts and invalid backups',async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'studio-cloud-')),password='temporary-test-password',salt=crypto.randomBytes(16).toString('hex');
  process.env.TURSO_DATABASE_URL='file:'+path.join(dir,'workspace.db').replaceAll('\\','/');process.env.TURSO_AUTH_TOKEN='';process.env.SESSION_SECRET=crypto.randomBytes(32).toString('hex');process.env.STUDIO_PASSWORD_HASH=salt+':'+crypto.scryptSync(password,salt,64).toString('hex');delete process.env.VERCEL;
  const session=require('../api/session.js'),workspace=require('../api/workspace.js'),{database}=require('../cloud/storage.cjs');
  const server=http.createServer((req,res)=>(req.url==='/api/session'?session:workspace)(req,res));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
  const request=(route,method='GET',data,cookie,extra={})=>fetch(base+route,{method,headers:{...(data?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{}),...extra},body:data?JSON.stringify(data):undefined});
  try{
    assert.equal((await request('/api/workspace')).status,401);
    assert.equal((await request('/api/session','POST',{password:'incorrect-password'})).status,401);
    const signed=await request('/api/session','POST',{password});assert.equal(signed.status,200);const cookie=signed.headers.get('set-cookie').split(';')[0];assert.match(signed.headers.get('set-cookie'),/HttpOnly/);
    const original=await (await request('/api/workspace','GET',null,cookie)).json();assert.equal(original.projects.length,1);
    const update=structuredClone(original);update.profile.intention='Saved from another device';
    assert.equal((await request('/api/workspace','PUT',update,cookie,{Origin:'https://evil.example'})).status,403);
    const writes=await Promise.all([request('/api/workspace','PUT',update,cookie),request('/api/workspace','PUT',update,cookie)]);assert.deepEqual(writes.map(r=>r.status).sort(),[200,409]);
    const saved=await (await request('/api/workspace','GET',null,cookie)).json();assert.equal(saved.revision,1);assert.equal(saved.profile.intention,update.profile.intention);
    const persisted=await database().execute("SELECT payload,previous FROM workspace WHERE id='main'");assert.equal(JSON.parse(persisted.rows[0].payload).revision,1);assert.equal(JSON.parse(persisted.rows[0].previous).revision,0);
    assert.equal((await request('/api/workspace','PUT',{...saved,projects:'invalid'},cookie)).status,400);
    assert.equal((await request('/api/workspace','GET',null,cookie+'tampered')).status,401);
    const logout=await request('/api/session','DELETE',null,cookie);assert.match(logout.headers.get('set-cookie'),/Max-Age=0/);
    for(let i=0;i<10;i++)await request('/api/session','POST',{password:'incorrect-password'});
    assert.equal((await request('/api/session','POST',{password})).status,429);
  }finally{await new Promise(resolve=>server.close(resolve));database().close();await fs.rm(dir,{recursive:true,force:true,maxRetries:10,retryDelay:100});}
});

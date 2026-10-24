'use strict';
const {authenticated,json,checkOrigin,readBody}=require('../cloud/auth.cjs');
const {database,initialize}=require('../cloud/storage.cjs');
const {initialWorkspace,validateWorkspace}=require('../server.cjs');
module.exports=async function(req,res){
  try{
    res.setHeader('X-Studio-Storage','cloud');
    if(!authenticated(req))return json(res,401,{error:'Please sign in to your private studio.'});
    if(!['GET','PUT'].includes(req.method))return json(res,405,{error:'Method not allowed.'});
    checkOrigin(req);await initialize();const db=database();
    const fresh=initialWorkspace();fresh.projects[0].folder='';
    await db.execute({sql:"INSERT OR IGNORE INTO workspace(id,payload,revision) VALUES ('main',?,0)",args:[JSON.stringify(fresh)]});
    if(req.method==='GET'){const r=await db.execute("SELECT payload FROM workspace WHERE id='main'");return json(res,200,JSON.parse(r.rows[0].payload));}
    const proposed=validateWorkspace(await readBody(req,4*1024*1024)),updated={...proposed,revision:proposed.revision+1};
    const r=await db.execute({sql:"UPDATE workspace SET previous=payload,payload=?,revision=revision+1 WHERE id='main' AND revision=?",args:[JSON.stringify(updated),proposed.revision]});
    if(!r.rowsAffected)return json(res,409,{error:'This workspace changed in another tab or device. Export your current work, then reload before saving.'});
    return json(res,200,{revision:updated.revision});
  }catch(error){console.error('Studio workspace failed',error.message);return json(res,error.status||503,{error:error.status?error.message:'Unable to save. Your last saved workspace is preserved. Please try again.'});}
};

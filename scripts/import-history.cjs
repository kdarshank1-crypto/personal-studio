'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const {randomUUID}=require('node:crypto');
const {validateWorkspace}=require('../server.cjs');
const ROOT=path.resolve(__dirname,'..');
const API='http://127.0.0.1:3210/api/workspace';
const normalize=value=>String(value||'').replace(/\\/g,'/').replace(/\/$/,'').toLowerCase();
async function main(){
  const catalogFile=path.resolve(process.argv[2]||path.join(ROOT,'data','history-catalog-2026-10-24.json'));
  const catalog=JSON.parse(await fs.readFile(catalogFile,'utf8'));
  if(!Array.isArray(catalog.projects)||!Array.isArray(catalog.ideas))throw Error('Invalid reviewed catalog.');
  const response=await fetch(API);if(!response.ok)throw Error('Start Personal Studio before importing.');
  const current=await response.json();validateWorkspace(current);
  const state=structuredClone(current),stamp=new Date().toISOString(),added={projects:[],ideas:[],skipped:[]};
  for(const entry of catalog.projects){
    const id='history-project-'+entry.key;
    if(state.projects.some(p=>p.id===id||p.title.toLowerCase()===entry.title.toLowerCase()||(entry.folder&&normalize(p.folder)===normalize(entry.folder)))){added.skipped.push(entry.title);continue;}
    state.projects.push({
      id,title:entry.title,description:entry.description,status:entry.status,category:entry.category,color:entry.color,priority:entry.priority,
      tags:entry.tags,folder:entry.folder||'',url:entry.url||'',github:'',featured:Boolean(entry.featured),
      nextStep:entry.nextStep,dueDate:'',notes:entry.notes,
      tasks:entry.tasks.map((task,index)=>({id:id+'-task-'+index,text:task.text,done:Boolean(task.done)})),
      createdAt:entry.firstWorked||stamp,updatedAt:stamp
    });added.projects.push(entry.title);
  }
  for(const entry of catalog.ideas){
    const id='history-idea-'+entry.key;
    if(state.ideas.some(i=>i.id===id||i.title.toLowerCase()===entry.title.toLowerCase())){added.skipped.push(entry.title);continue;}
    state.ideas.push({id,title:entry.title,description:entry.description,stage:entry.stage,tags:entry.tags,starred:Boolean(entry.starred),createdAt:entry.firstWorked||stamp,updatedAt:stamp});added.ideas.push(entry.title);
  }
  if(!added.projects.length&&!added.ideas.length){console.log(JSON.stringify({message:'Catalog already imported; existing records preserved.',...added},null,2));return;}
  state.activity.unshift({id:randomUUID(),text:'Recovered '+added.projects.length+' projects and '+added.ideas.length+' ideas from previous work. University and study work excluded.',type:'workspace',at:stamp});
  state.activity=state.activity.slice(0,100);validateWorkspace(state);
  const backups=path.join(ROOT,'data','backups');await fs.mkdir(backups,{recursive:true});
  const backupFile=path.join(backups,'before-history-import-'+stamp.replace(/[:.]/g,'-')+'.json');
  await fs.writeFile(backupFile,JSON.stringify(current,null,2),{flag:'wx'});
  const saved=await fetch(API,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(state)});
  const result=await saved.json();if(!saved.ok)throw Error(result.error||'Import failed; no existing records were overwritten.');
  const checked=await (await fetch(API)).json();validateWorkspace(checked);
  for(const title of added.projects)if(!checked.projects.some(p=>p.title===title))throw Error('Project missing after import: '+title);
  for(const title of added.ideas)if(!checked.ideas.some(i=>i.title===title))throw Error('Idea missing after import: '+title);
  const report={importedAt:stamp,revision:result.revision,backupFile,...added,excluded:catalog.excluded,totals:{projects:checked.projects.length,visibleProjects:checked.projects.filter(p=>p.status!=='archived').length,ideas:checked.ideas.length},scope:'Available local conversation history and project documentation. Other account/cloud-only conversations may not be present locally.'};
  await fs.writeFile(path.join(ROOT,'data','history-import-report-2026-10-24.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});


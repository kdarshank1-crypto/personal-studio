'use strict';
const {createClient}=require('@libsql/client');
let client,ready;
function database(){
  if(!client){if(!process.env.TURSO_DATABASE_URL)throw new Error('Cloud storage is not configured.');client=createClient({url:process.env.TURSO_DATABASE_URL,authToken:process.env.TURSO_AUTH_TOKEN});}
  return client;
}
async function initialize(){
  if(!ready)ready=database().batch([
    'CREATE TABLE IF NOT EXISTS workspace (id TEXT PRIMARY KEY,payload TEXT NOT NULL,previous TEXT,revision INTEGER NOT NULL)',
    'CREATE TABLE IF NOT EXISTS login_attempts (key TEXT PRIMARY KEY,attempts INTEGER NOT NULL,expires INTEGER NOT NULL)',
  ],'write').catch(error=>{ready=undefined;throw error;});
  return ready;
}
module.exports={database,initialize};

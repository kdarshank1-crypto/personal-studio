'use strict';
const {createHmac,scrypt:derive,timingSafeEqual}=require('node:crypto');
const {promisify}=require('node:util');
const scrypt=promisify(derive);
const {database,initialize}=require('./storage.cjs');
const cookieName='studio_session';
function sign(payload){if(!process.env.SESSION_SECRET)throw new Error('Sign-in is not configured.');return createHmac('sha256',process.env.SESSION_SECRET).update(payload).digest('base64url');}
function createSession(){const payload=Buffer.from(JSON.stringify({role:'owner',expires:Date.now()+30*86400000})).toString('base64url');return payload+'.'+sign(payload);}
function authenticated(req){
  try{const cookie=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='));if(!cookie)return false;const [payload,signature]=cookie.slice(cookieName.length+1).split('.'),actual=Buffer.from(signature||'','base64url'),expected=Buffer.from(sign(payload),'base64url');if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return false;const data=JSON.parse(Buffer.from(payload,'base64url').toString());return data.role==='owner'&&data.expires>Date.now();}catch{return false;}
}
async function verify(password){const [salt,hash]=(process.env.STUDIO_PASSWORD_HASH||'').split(':');if(!salt||!hash)throw new Error('Password is not configured.');const actual=await scrypt(password,salt,64),expected=Buffer.from(hash,'hex');return actual.length===expected.length&&timingSafeEqual(actual,expected);}
async function allowLogin(req){await initialize();const key=createHmac('sha256',process.env.SESSION_SECRET).update(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||'local').digest('hex'),now=Date.now();const r=await database().execute({sql:'INSERT INTO login_attempts(key,attempts,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN expires<? THEN 1 ELSE attempts+1 END,expires=CASE WHEN expires<? THEN ? ELSE expires END RETURNING attempts',args:[key,now+300000,now,now,now+300000]});return Number(r.rows[0].attempts)<=10;}
function sessionHeader(value,maxAge=2592000){return `${cookieName}=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${process.env.VERCEL?'; Secure':''}`;}
function json(res,status,value){res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json; charset=utf-8');res.statusCode=status;res.end(JSON.stringify(value));}
function checkOrigin(req){const origin=req.headers.origin;if(origin&&origin!==`${process.env.VERCEL?'https':'http'}://${req.headers.host}`){const error=new Error('Cross-origin request rejected.');error.status=403;throw error;}}
async function readBody(req,limit){
  if(!(req.headers['content-type']||'').startsWith('application/json')){const e=new Error('Send JSON data.');e.status=415;throw e;}
  if(req.body!==undefined){const raw=typeof req.body==='string'?req.body:JSON.stringify(req.body);if(Buffer.byteLength(raw)>limit){const e=new Error('Backup is too large.');e.status=413;throw e;}try{return JSON.parse(raw);}catch{const e=new Error('Invalid JSON.');e.status=400;throw e;}}
  let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>limit){const e=new Error('Backup is too large.');e.status=413;throw e;}}
  try{return JSON.parse(raw);}catch{const e=new Error('Invalid JSON.');e.status=400;throw e;}
}
module.exports={authenticated,createSession,verify,allowLogin,sessionHeader,json,checkOrigin,readBody};

'use strict';
const {authenticated,createSession,verify,allowLogin,sessionHeader,json,checkOrigin,readBody}=require('../cloud/auth.cjs');
module.exports=async function(req,res){
  try{
    if(req.method==='GET')return json(res,200,{authenticated:authenticated(req)});
    checkOrigin(req);
    if(req.method==='DELETE'){res.setHeader('Set-Cookie',sessionHeader('',0));return json(res,200,{ok:true});}
    if(req.method!=='POST')return json(res,405,{error:'Method not allowed.'});
    const input=await readBody(req,2000);
    if(typeof input.password!=='string'||input.password.length>200)return json(res,400,{error:'Enter your Studio password.'});
    if(!(await allowLogin(req)))return json(res,429,{error:'Too many attempts. Please try again in five minutes.'});
    if(!(await verify(input.password)))return json(res,401,{error:'That password is incorrect.'});
    res.setHeader('Set-Cookie',sessionHeader(createSession()));return json(res,200,{ok:true});
  }catch(error){console.error('Studio sign-in failed',error.message);return json(res,error.status||503,{error:error.status?error.message:'Sign-in is unavailable. Please try again shortly.'});}
};

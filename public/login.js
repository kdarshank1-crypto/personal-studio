'use strict';
document.getElementById('login-form').addEventListener('submit',async event=>{
  event.preventDefault();const button=event.target.querySelector('button'),error=document.getElementById('login-error');button.disabled=true;error.textContent='';
  try{const response=await fetch('/api/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:document.getElementById('password').value})}),result=await response.json();if(!response.ok)throw new Error(result.error);location.assign('/');}catch(e){error.textContent=e.message;}finally{button.disabled=false;}
});

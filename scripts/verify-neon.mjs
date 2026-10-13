import pg from 'pg';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
const db=new pg.Client({connectionString:process.env.DATABASE_URL_UNPOOLED});await db.connect();
const base=process.env.NEON_AUTH_BASE_URL;const api=process.env.NEON_DATA_API_URL;
let cookie='';const ids=[];
async function auth(path,body){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',Origin:'http://localhost:5173',...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});const cookies=r.headers.getSetCookie();if(cookies.length)cookie=cookies.map(x=>x.split(';')[0]).join('; ');const data=await r.json();if(!r.ok)throw new Error(`Auth ${path}: ${r.status} ${data.message||data.code}`);return data;}
async function request(path,token,method='GET',body){const r=await fetch(api+'/'+path,{method,headers:{...(token?{Authorization:'Bearer '+token}:{}),'Content-Type':'application/json',Prefer:'return=representation'},body:body?JSON.stringify(body):undefined});const text=await r.text();return {status:r.status,data:text?JSON.parse(text):null};}
try{
 const password='Test!'+randomBytes(20).toString('hex');const email='fluxo-test-'+Date.now()+'@example.com';
 const signup=await auth('/sign-up/email',{email,password,name:'Fluxo Test'});assert(signup.user?.id);ids.push(signup.user.id);console.log('PASS signup Neon Auth');
 await db.query('UPDATE neon_auth."user" SET "emailVerified"=true WHERE id=$1',[signup.user.id]);
 await auth('/sign-in/email',{email,password});console.log('PASS sign-in Neon Auth');
 const session=await auth('/get-session');assert.equal(session.user.id,signup.user.id);console.log('PASS session restoration');
 const {token}=await auth('/token');assert(token);
 const anon=await request('transactions',null);assert(anon.status>=400);console.log('PASS anonymous access denied');
 const foreign=await request('transactions',token);assert.equal(foreign.status,200);assert.equal(foreign.data.length,0);console.log('PASS imported data isolated from another user');
 const profile=await request('financial_profile?on_conflict=id',token,'POST',{id:signup.user.id,monthly_income:1000,pay_day:5});assert(profile.status<300,JSON.stringify(profile));
 const budget=await request('budgets',token,'POST',{user_id:signup.user.id,category:'Test',limit_amount:100});assert(budget.status<300,JSON.stringify(budget));
 const tx=await request('transactions',token,'POST',{user_id:signup.user.id,title:'Test',category:'Test',amount:-20,date:'2026-10-13',payment_method:'Pix'});assert(tx.status<300,JSON.stringify(tx));
 const read=await request('transactions',token);assert.equal(read.data.length,1);
 const changed=await request('transactions?id=eq.'+tx.data[0].id,token,'PATCH',{amount:-25});assert(changed.status<300);
 const removed=await request('transactions?id=eq.'+tx.data[0].id,token,'DELETE');assert(removed.status<300);console.log('PASS profile, budget and transaction CRUD');
 const elevate=await request('financial_profile?id=eq.'+signup.user.id,token,'PATCH',{is_admin:true});assert(elevate.status>=400);console.log('PASS admin privilege escalation denied');
 const admin=await request('rpc/admin_get_users',token,'POST',{});assert(admin.status>=400);console.log('PASS non-admin RPC denied');
 const file=await request('files',token,'POST',{user_id:signup.user.id,kind:'attachment',name:'test.txt',content_type:'text/plain',content_base64:Buffer.from('Neon file test').toString('base64')});assert(file.status<300,JSON.stringify(file));
 const fileRead=await request('files?id=eq.'+file.data[0].id,token);assert.equal(Buffer.from(fileRead.data[0].content_base64,'base64').toString(),'Neon file test');console.log('PASS file upload and download');
 await auth('/sign-out',{});cookie='';const signedOut=await auth('/get-session');assert(!signedOut?.user);console.log('PASS sign-out');
}catch(e){console.error(e.message);process.exitCode=1;}finally{for(const id of ids)await db.query('DELETE FROM neon_auth."user" WHERE id=$1',[id]);await db.end();console.log('Temporary test users removed.');}

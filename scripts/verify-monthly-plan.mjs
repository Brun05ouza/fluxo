import pg from 'pg';import assert from 'node:assert/strict';
const db=new pg.Client({connectionString:process.env.DATABASE_URL_UNPOOLED});await db.connect();let uid;let cookie='';let token;
async function auth(path,body){const r=await fetch(process.env.NEON_AUTH_BASE_URL+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',Origin:'http://localhost:5173',...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});if(r.headers.getSetCookie().length)cookie=r.headers.getSetCookie().map(x=>x.split(';')[0]).join('; ');const d=await r.json();if(!r.ok)throw Error(path+': '+d.message);return d;}
async function rpc(name,body){const r=await fetch(process.env.NEON_DATA_API_URL+'/rpc/'+name,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(body)});const text=await r.text();const d=text?JSON.parse(text):null;if(!r.ok)throw Error(name+': '+d.message);return d;}
try{
 const email='planning-test-'+Date.now()+'@example.com';const password='Plan!'+Date.now()+'Aa';uid=(await auth('/sign-up/email',{email,password,name:'Teste plano'})).user.id;
 await db.query('UPDATE neon_auth."user" SET "emailVerified"=true WHERE id=$1',[uid]);await auth('/sign-in/email',{email,password});token=(await auth('/token')).token;
 await db.query('INSERT INTO public.financial_profile(id,monthly_income,pay_day,onboarding_data) VALUES($1,3500,31,$2)',[uid,JSON.stringify({extraIncomes:[{label:'Freela',amount:500}]})]);
 await db.query('INSERT INTO public.fixed_expenses(user_id,title,amount,due_day,category) VALUES($1,$2,100,31,$3)',[uid,'Luz','Casa']);
 assert.equal(await rpc('prepare_financial_month',{target_month:'2027-02-01'}),3);console.log('PASS salário + extra + conta fixa geram 3 previsões');
 assert.equal(await rpc('prepare_financial_month',{target_month:'2027-02-01'}),0);console.log('PASS repetir preparação não duplica');
 const tx=(await db.query('SELECT * FROM public.transactions WHERE user_id=$1',[uid])).rows;assert.equal(tx.length,3);assert(tx.every(t=>t.is_paid===false&&t.settlement_status==='pending'&&(t.date instanceof Date ? t.date.toISOString().slice(0,10) : t.date)==='2027-02-28'));assert.equal(tx.filter(t=>t.amount>0).reduce((s,t)=>s+Number(t.amount),0),3500);console.log('PASS dia 31 em fevereiro e renda extra sem duplicação');
 const salary=tx.find(t=>Number(t.amount)===3000);
 const old=(await db.query("INSERT INTO public.transactions(user_id,title,category,amount,date,payment_method,is_paid,settlement_status) VALUES($1,'Salário recebido','Salário',2900,'2027-02-28','Pix',true,'settled') RETURNING id",[uid])).rows[0];
 await rpc('link_planned_transaction',{plan_id:salary.planning_item_id,existing_id:old.id});
 const linked=(await db.query('SELECT * FROM public.transactions WHERE id=$1',[old.id])).rows[0];assert.equal(Number(linked.amount),2900);assert(linked.is_paid);assert.equal(linked.planning_item_id,salary.planning_item_id);assert.equal((await db.query('SELECT count(*) FROM public.transactions WHERE user_id=$1',[uid])).rows[0].count,'3');console.log('PASS salário já recebido substitui previsão preservando valor real');
 assert.equal(await rpc('prepare_financial_month',{target_month:'2027-02-01'}),0);
 await db.query('DELETE FROM public.transactions WHERE id=$1',[tx.find(t=>t.amount<0).id]);assert.equal(await rpc('prepare_financial_month',{target_month:'2027-02-01'}),0);console.log('PASS previsão removida não reaparece');
 await rpc('restore_financial_data',{});assert.equal((await db.query('SELECT count(*) FROM public.monthly_plan_items WHERE user_id=$1',[uid])).rows[0].count,'0');console.log('PASS restaurar conta remove vínculos de planejamento');
}catch(e){console.error(e.message);process.exitCode=1;}finally{if(uid)await db.query('DELETE FROM neon_auth."user" WHERE id=$1',[uid]);await db.end();console.log('Conta temporária removida.');}

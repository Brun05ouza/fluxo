import pg from 'pg';
import { readFile } from 'node:fs/promises';
import { createHash, randomUUID, randomBytes } from 'node:crypto';
import { hashPassword } from 'better-auth/crypto';
const directory = process.argv[2];
if (!directory) throw new Error('Informe o diretório do backup concluído.');
const read = name => readFile(`${directory}/${name}.json`, 'utf8').then(JSON.parse);
const manifest = await read('manifest');
const importKey = createHash('sha256').update(JSON.stringify(manifest)).digest('hex');
const c = new pg.Client({ connectionString: process.env.DATABASE_URL_UNPOOLED });
await c.connect();
try {
  await c.query('BEGIN');
  await c.query("SELECT pg_advisory_xact_lock(hashtext('fluxo-source-import'))");
  await c.query('CREATE TABLE IF NOT EXISTS fluxo_internal.imports (id text PRIMARY KEY, imported_at timestamptz DEFAULT now(), manifest jsonb)');
  if ((await c.query('SELECT 1 FROM fluxo_internal.imports WHERE id=$1', [importKey])).rowCount) {
    console.log('Este backup já foi importado. Nenhum dado alterado.');
    await c.query('ROLLBACK');
    process.exitCode = 0;
  } else {
    const existing = await c.query('SELECT count(*) FROM neon_auth."user"');
    if (Number(existing.rows[0].count)) throw new Error('Importação inicial exige Neon Auth vazio; não sobrescreva usuários existentes.');
    const users = await read('auth-users');
    for (const u of users) {
      await c.query('INSERT INTO neon_auth."user"(id,name,email,"emailVerified","createdAt","updatedAt",banned) VALUES($1,$2,$3,$4,$5,$6,$7)',
        [u.id,u.user_metadata?.full_name || u.email,u.email.toLowerCase(),Boolean(u.email_confirmed_at),u.created_at,u.updated_at || u.created_at,Boolean(u.banned_until && new Date(u.banned_until) > new Date())]);
      // The source Admin API does not export password hashes. Set an unknowable
      // random password; the account owner chooses a new one using email OTP.
      const passwordHash = await hashPassword(randomBytes(64).toString('base64url'));
      await c.query('INSERT INTO neon_auth.account(id,"accountId","providerId","userId",password,"createdAt","updatedAt") VALUES($1,$2,$3,$4,$5,$6,now())',
        [randomUUID(),u.id,'credential',u.id,passwordHash,u.created_at]);
      for (const identity of u.identities ?? []) {
        if (identity.provider === 'email') continue;
        if (!['google','github','vercel'].includes(identity.provider)) throw new Error(`Provedor não suportado: ${identity.provider}`);
        await c.query('INSERT INTO neon_auth.account("accountId","providerId","userId","updatedAt") VALUES($1,$2,$3,now())', [identity.identity_data?.sub || identity.id,identity.provider,u.id]);
      }
      await c.query('UPDATE public.users SET cpf=$2,last_sign_in=$3 WHERE id=$1', [u.id,u.user_metadata?.cpf || '',u.last_sign_in_at]);
    }
    const objects = await read('objects');
    const replacements = new Map();
    for (const object of objects) {
      const bytes = await readFile(`${directory}/${object.file}`);
      const id = randomUUID();
      const owner = object.name.split('/')[0];
      if (!users.some(u=>u.id===owner)) throw new Error('Arquivo sem proprietário conhecido; importação interrompida.');
      await c.query('INSERT INTO public.files(id,user_id,kind,name,content_type,content_base64) VALUES($1,$2,$3,$4,$5,$6)',
        [id,owner,object.bucket === 'avatars' ? 'avatar' : 'attachment',object.name.split('/').pop(),object.contentType.split(';')[0],bytes.toString('base64')]);
      replacements.set(`/storage/v1/object/public/${object.bucket}/${object.name}`, `neon-file:${id}`);
      const saved = await c.query('SELECT content_base64 FROM public.files WHERE id=$1',[id]);
      if (!Buffer.from(saved.rows[0].content_base64,'base64').equals(bytes)) throw new Error('Verificação de arquivo falhou.');
    }
    const replaceUrl = url => {
      if (!url) return url;
      for (const [path, reference] of replacements) if (decodeURI(url).includes(path)) return reference;
      if (url.includes(new URL(process.env.SOURCE_API_URL).hostname)) throw new Error('Arquivo da origem não foi exportado.');
      return url;
    };
    for (const u of users) await c.query('UPDATE public.users SET avatar_url=$2 WHERE id=$1',[u.id,replaceUrl(u.user_metadata?.avatar_url) || null]);
    const order = ['financial_profile','accounts','budgets','fixed_expenses','credit_cards','credit_card_invoices','transactions','credit_card_invoice_items'];
    const deferred = [];
    for (const table of order) {
      const rows = await read(table);
      for (const source of rows) {
        const row = { ...source };
        if (row.attachment_url) row.attachment_url = replaceUrl(row.attachment_url);
        if (table === 'transactions' && row.invoice_item_id) { deferred.push([row.id,row.invoice_item_id]); row.invoice_item_id = null; }
        const keys = Object.keys(row);
        if (keys.some(k=>!/^\w+$/.test(k))) throw new Error('Coluna inválida no backup.');
        const values = keys.map(k=>row[k] && typeof row[k]==='object' && !Array.isArray(row[k]) ? JSON.stringify(row[k]) : row[k]);
        await c.query(`INSERT INTO public.${table} (${keys.map(k=>`"${k}"`).join(',')}) VALUES (${keys.map((_,i)=>`$${i+1}`).join(',')})`,values);
      }
      const count = Number((await c.query(`SELECT count(*) FROM public.${table}`)).rows[0].count);
      if (count !== rows.length) throw new Error(`Contagem divergente: ${table}`);
      console.log(`${table}: ${count} registros verificados.`);
    }
    for (const [id,item] of deferred) await c.query('UPDATE public.transactions SET invoice_item_id=$2 WHERE id=$1',[id,item]);
    // Preserve the source user profile timestamps/names as well as identity IDs.
    for (const u of await read('users')) await c.query('UPDATE public.users SET nome=$2,cpf=$3,created_at=$4,updated_at=$5 WHERE id=$1',[u.id,u.nome,u.cpf,u.created_at,u.updated_at]);
    await c.query('CREATE TABLE IF NOT EXISTS fluxo_internal.imported_identities (id uuid PRIMARY KEY, source_metadata jsonb NOT NULL)');
    for (const u of users) await c.query('INSERT INTO fluxo_internal.imported_identities VALUES($1,$2)',[u.id,JSON.stringify(u)]);
    await c.query('INSERT INTO fluxo_internal.imports(id,manifest) VALUES($1,$2)',[importKey,JSON.stringify(manifest)]);
    await c.query('COMMIT');
    console.log(`Importação concluída: ${users.length} usuários com IDs preservados; ${objects.length} arquivos verificados byte a byte. Senhas exigem redefinição.`);
  }
} catch(error) { await c.query('ROLLBACK'); throw error; }
finally { await c.end(); }

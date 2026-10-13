import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.SOURCE_API_URL;
const key = process.env.SOURCE_SERVICE_KEY;
if (!base || !key) throw new Error('Configure SOURCE_API_URL e SOURCE_SERVICE_KEY no arquivo local de migração.');
const headers = { apikey: key, Authorization: `Bearer ${key}` };
const directory = `.migration-backup/${new Date().toISOString().replace(/[:.]/g, '-')}`;
await mkdir(directory, { recursive: true });
async function request(path, options = {}) {
  const response = await fetch(`${base}${path}`, { ...options, headers: { ...headers, ...options.headers } });
  if (!response.ok) throw new Error(`Exportação interrompida: ${path.split('?')[0]} HTTP ${response.status}`);
  return response;
}
const users = [];
for (let page = 1; ; page++) {
  const data = await (await request(`/auth/v1/admin/users?page=${page}&per_page=100`)).json();
  users.push(...data.users);
  if (data.users.length < 100) break;
}
await writeFile(`${directory}/auth-users.json`, JSON.stringify(users, null, 2));
console.log(`Auth: ${users.length} usuários exportados (sem senhas).`);
const schema = await (await request('/rest/v1/')).json();
await writeFile(`${directory}/source-schema.json`, JSON.stringify(schema, null, 2));
const tables = Object.keys(schema.definitions ?? {}).filter(name => schema.paths?.[`/${name}`]?.get);
for (const table of tables) {
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    const page = await (await request(`/rest/v1/${encodeURIComponent(table)}?select=*&limit=500&offset=${offset}&order=id.asc`)).json();
    rows.push(...page);
    if (page.length < 500) break;
  }
  await writeFile(`${directory}/${table}.json`, JSON.stringify(rows, null, 2));
  console.log(`${table}: ${rows.length} registros.`);
}
const buckets = await (await request('/storage/v1/bucket')).json();
await writeFile(`${directory}/buckets.json`, JSON.stringify(buckets, null, 2));
const objects = [];
async function exportPrefix(bucket, prefix = '') {
  for (let offset = 0; ; offset += 100) {
    const entries = await (await request(`/storage/v1/object/list/${encodeURIComponent(bucket)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix, limit: 100, offset, sortBy: { column: 'name', order: 'asc' } }),
    })).json();
    for (const entry of entries) {
      const name = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (!entry.id) { await exportPrefix(bucket, name); continue; }
      const response = await request(`/storage/v1/object/${encodeURIComponent(bucket)}/${name.split('/').map(encodeURIComponent).join('/')}`);
      const file = `${objects.length}.bin`;
      await writeFile(`${directory}/${file}`, Buffer.from(await response.arrayBuffer()));
      objects.push({ bucket, name, file, contentType: response.headers.get('content-type'), metadata: entry.metadata });
    }
    if (entries.length < 100) break;
  }
}
for (const bucket of buckets) await exportPrefix(bucket.id);
await writeFile(`${directory}/objects.json`, JSON.stringify(objects, null, 2));
await writeFile(`${directory}/manifest.json`, JSON.stringify({ exportedAt: new Date().toISOString(), tables, users: users.length, files: objects.length }, null, 2));
console.log(`Backup concluído: ${directory}; ${objects.length} arquivos.`);

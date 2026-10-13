import pg from 'pg';
import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const url = process.env.DATABASE_URL_UNPOOLED;
if (!url || new URL(url).hostname.includes('-pooler')) throw new Error('Use DATABASE_URL_UNPOOLED (conexão direta).');
const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query('BEGIN');
  await client.query("SELECT pg_advisory_xact_lock(hashtext('fluxo-migrations'))");
  await client.query('CREATE SCHEMA IF NOT EXISTS fluxo_internal');
  await client.query('CREATE TABLE IF NOT EXISTS fluxo_internal.migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
  for (const name of (await readdir(new URL('../neon/migrations/', import.meta.url))).filter(n => n.endsWith('.sql')).sort()) {
    const sql = await readFile(new URL(`../neon/migrations/${name}`, import.meta.url), 'utf8');
    const checksum = createHash('sha256').update(sql).digest('hex');
    const previous = await client.query('SELECT checksum FROM fluxo_internal.migrations WHERE name=$1', [name]);
    if (previous.rowCount) {
      if (previous.rows[0].checksum !== checksum) throw new Error(`Migration já aplicada foi alterada: ${name}`);
      continue;
    }
    await client.query(sql);
    await client.query('INSERT INTO fluxo_internal.migrations(name,checksum) VALUES($1,$2)', [name, checksum]);
    console.log(`Aplicada: ${name}`);
  }
  await client.query('COMMIT');
} catch (error) { await client.query('ROLLBACK'); throw error; }
finally { await client.end(); }

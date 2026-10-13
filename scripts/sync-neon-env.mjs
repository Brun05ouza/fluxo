import { readFile, writeFile } from 'node:fs/promises';
const path = '.env.local';
let contents = await readFile(path, 'utf8');
for (const [source, target] of [['NEON_AUTH_BASE_URL','VITE_NEON_AUTH_URL'],['NEON_DATA_API_URL','VITE_NEON_DATA_API_URL']]) {
  const value = process.env[source];
  if (!value) throw new Error(`Missing ${source}; run neon deploy first.`);
  contents = contents.replace(new RegExp(`^${target}=.*\\r?\\n?`, 'gm'), '');
  contents += `\n${target}=${value}\n`;
}
await writeFile(path, contents);
console.log('URLs públicas do Neon configuradas.');

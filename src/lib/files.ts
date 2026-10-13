import { neon } from './neon';
export const FILE_PREFIX = 'neon-file:';
const TYPES = ['image/jpeg','image/png','image/gif','image/webp','application/pdf','text/plain','text/csv'];
export async function uploadFile(userId: string, file: File, kind: 'avatar' | 'attachment') {
  const limit = kind === 'avatar' ? 1024 * 1024 : 5 * 1024 * 1024;
  if (!file.size || file.size > limit) throw new Error(`O arquivo deve ter entre 1 byte e ${kind === 'avatar' ? 1 : 5} MB.`);
  if (!TYPES.includes(file.type) || (kind === 'avatar' && !file.type.startsWith('image/'))) throw new Error('Formato de arquivo não permitido.');
  const content = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.readAsDataURL(file);
  });
  const { data, error } = await neon.from('files').insert({ user_id: userId, kind, name: file.name.slice(0,255), content_type: file.type, content_base64: content }).select('id').single();
  if (error) throw new Error(error.message);
  return `${FILE_PREFIX}${data.id}`;
}
export async function readFileBlob(reference: string) {
  if (!reference.startsWith(FILE_PREFIX)) throw new Error('Referência de arquivo inválida.');
  const { data, error } = await neon.from('files').select('name,content_type,content_base64').eq('id', reference.slice(FILE_PREFIX.length)).single();
  if (error) throw new Error(error.message);
  const bytes = Uint8Array.from(atob(data.content_base64), char => char.charCodeAt(0));
  return { name: data.name as string, blob: new Blob([bytes], { type: data.content_type }) };
}
export async function downloadFile(reference: string) {
  const { name, blob } = await readFileBlob(reference);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

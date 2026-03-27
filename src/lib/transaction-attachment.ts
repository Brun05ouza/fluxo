import { supabase } from '@/lib/supabase';

const BUCKET = 'transaction-attachments';

export async function uploadTransactionAttachment(
  userId: string,
  file: File
): Promise<{ url: string | null; error: Error | null }> {
  const safeName = file.name.replace(/[^\w.\-() ]+/g, '_').slice(0, 120);
  const path = `${userId}/${crypto.randomUUID()}_${safeName}`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (upErr) {
    return { url: null, error: new Error(upErr.message) };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

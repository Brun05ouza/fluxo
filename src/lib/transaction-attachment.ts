import { uploadFile } from './files';
export async function uploadTransactionAttachment(userId: string, file: File): Promise<{ url: string | null; error: Error | null }> {
  try { return { url: await uploadFile(userId, file, 'attachment'), error: null }; }
  catch (error) { return { url: null, error: error instanceof Error ? error : new Error('Erro ao enviar anexo.') }; }
}

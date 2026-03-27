-- URL pública ou caminho do anexo (Storage: bucket transaction-attachments)
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS attachment_url TEXT;

COMMENT ON COLUMN transactions.attachment_url IS 'URL do arquivo no Storage (ex.: transaction-attachments)';

-- No Dashboard Supabase: Storage → criar bucket "transaction-attachments" (público recomendado para URLs simples).
-- Políticas abaixo (ajuste se o bucket for privado).

DROP POLICY IF EXISTS "Users upload transaction attachment" ON storage.objects;
CREATE POLICY "Users upload transaction attachment"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'transaction-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users update own transaction attachment" ON storage.objects;
CREATE POLICY "Users update own transaction attachment"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'transaction-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users delete own transaction attachment" ON storage.objects;
CREATE POLICY "Users delete own transaction attachment"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'transaction-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Transaction attachments public read" ON storage.objects;
CREATE POLICY "Transaction attachments public read"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'transaction-attachments');

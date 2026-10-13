import { useEffect, useState } from 'react';
import { FILE_PREFIX, readFileBlob } from '@/lib/files';
export function useFileUrl(reference?: string) {
  const [resolved, setResolved] = useState<{ reference: string; url: string } | null>(null);
  useEffect(() => {
    if (!reference?.startsWith(FILE_PREFIX)) return;
    let active = true;
    let url: string | undefined;
    void readFileBlob(reference).then(({ blob }) => {
      if (!active) return;
      url = URL.createObjectURL(blob);
      setResolved({ reference, url });
    }).catch(() => { if (active) setResolved(null); });
    return () => { active = false; if (url) URL.revokeObjectURL(url); };
  }, [reference]);
  if (reference?.startsWith(FILE_PREFIX)) return resolved?.reference === reference ? resolved.url : undefined;
  return reference?.startsWith('https://') ? reference : undefined;
}

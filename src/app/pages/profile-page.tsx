import React, { useState, useEffect } from 'react';
import { Camera } from 'lucide-react';
import { Card, Button, Input, cn } from '@/app/components/ui';
import { Avatar, AvatarImage, AvatarFallback } from '@/app/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { maskCpf } from '@/lib/validation';
import { toast } from 'sonner';

function getInitials(name: string | undefined, email: string) {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return '??';
}

export const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const email = user?.email ?? '';
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const cpf = user?.user_metadata?.cpf ? maskCpf(user.user_metadata.cpf) : '—';

  useEffect(() => {
    setFullName(user?.user_metadata?.full_name || '');
  }, [user?.user_metadata?.full_name]);

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFullName(e.target.value);
    setHasChanges(e.target.value !== (user?.user_metadata?.full_name || ''));
  };

  const handleSave = async () => {
    if (!hasChanges) return;
    setSaving(true);
    const { error } = await updateProfile({ fullName: fullName.trim() });
    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      setHasChanges(false);
      toast.success('Perfil atualizado!');
    }
  };

  const handleDiscard = () => {
    setFullName(user?.user_metadata?.full_name || '');
    setHasChanges(false);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Envie uma imagem (JPEG, PNG, GIF ou WebP).');
      return;
    }
    if (file.size > 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 1 MB.');
      return;
    }
    setUploadingPhoto(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const { error: profileError } = await updateProfile({ avatarUrl: data.publicUrl });
      if (profileError) throw profileError;
      toast.success('Foto atualizada!');
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar foto. Crie o bucket "avatars" no Supabase.');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  return (
    <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h2 className="text-2xl font-bold">Meu Perfil</h2>
        <p className="text-foreground/80 mt-1">Personalize suas informações e foto.</p>
      </div>
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
          <div className="relative group">
            <Avatar className="w-28 h-28 border-4 border-card ring-2 ring-border shadow-lg">
              <AvatarImage src={avatarUrl} alt="Foto de perfil" />
              <AvatarFallback className="text-2xl font-bold text-primary bg-primary/20">
                {getInitials(user?.user_metadata?.full_name, email)}
              </AvatarFallback>
            </Avatar>
            <label className={cn(
              'absolute bottom-0 right-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-md transition-colors',
              uploadingPhoto ? 'opacity-70 cursor-wait' : 'cursor-pointer hover:bg-primary/90'
            )}>
              {uploadingPhoto ? (
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <Camera size={18} />
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="sr-only"
                onChange={handlePhotoChange}
                disabled={uploadingPhoto}
              />
            </label>
          </div>
          <div className="space-y-1 flex-1">
            <p className="text-base font-medium">Personalize seu perfil</p>
            <p className="text-sm text-muted-foreground">
              Clique na câmera para alterar sua foto. Edite o nome abaixo e salve.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          <Input
            label="Nome completo"
            value={fullName}
            onChange={handleFullNameChange}
            placeholder="Seu nome completo"
          />
          <Input label="E-mail" value={email} disabled placeholder="—" />
          <Input label="CPF" value={cpf} disabled placeholder="—" />
        </div>
      </section>
      {hasChanges && (
        <div className="flex gap-4">
          <Button className="px-8" onClick={handleSave} loading={saving}>
            Salvar Alterações
          </Button>
          <Button variant="ghost" onClick={handleDiscard} disabled={saving}>
            Descartar
          </Button>
        </div>
      )}
    </div>
  );
};

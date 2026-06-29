'use client';

import { useState, useEffect } from 'react';
import { FolderOpen, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';

export default function FilesPage() {
  const t = useTranslations('portal');
  const [storageUrl, setStorageUrl] = useState<string | null>(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      supabase
        .from('clients')
        .select('storage_url')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          setStorageUrl(data?.storage_url ?? null);
          setLoading(false);
        });
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ color: '#0A0F1C' }} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-extrabold tracking-tight" style={{ color: '#0A0F1C' }}>{t('files.title')}</h1>
        <p className="text-sm mt-0.5 font-medium" style={{ color: '#5A6B80' }}>
          Accedé a todos los archivos que tu equipo Azu compartió con vos.
        </p>
      </div>

      {storageUrl ? (
        <div
          className="rounded-2xl p-6"
          style={{ background: 'linear-gradient(135deg, #0A0F1C 0%, #141C2E 100%)', boxShadow: '0 4px 16px rgba(10,15,28,0.2)' }}
        >
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <FolderOpen size={22} style={{ color: '#B8976C' }} />
            </div>
            <div>
              <p className="text-base font-bold text-white">Carpeta compartida</p>
              <p className="text-sm" style={{ color: 'rgba(215,224,231,0.6)' }}>Archivos, reels, reportes y más</p>
            </div>
          </div>
          <a
            href={storageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 hover:-translate-y-0.5"
            style={{ background: '#B8976C', color: '#ffffff' }}
          >
            <ExternalLink size={14} />
            Abrir archivos
          </a>
        </div>
      ) : (
        <div
          className="rounded-2xl p-12 text-center"
          style={{ background: '#ffffff', border: '1px solid rgba(10,15,28,0.08)' }}
        >
          <FolderOpen size={40} style={{ color: '#cbd5e1', margin: '0 auto 16px' }} />
          <h3 className="text-base font-bold mb-2" style={{ color: '#0A0F1C' }}>Sin archivos todavía</h3>
          <p className="text-sm" style={{ color: '#5A6B80' }}>
            Tu equipo Azu compartirá una carpeta con todos tus archivos próximamente.
          </p>
        </div>
      )}
    </div>
  );
}

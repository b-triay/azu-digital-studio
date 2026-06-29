'use client';

import { Download, Film, FileImage, FileText, File } from 'lucide-react';
import type { ClientFile, FileType } from '@/lib/types';

const FILE_ICONS: Record<FileType, React.ElementType> = {
  video: Film,
  image: FileImage,
  pdf: FileText,
  other: File,
};

const FILE_COLORS: Record<FileType, { bg: string; icon: string }> = {
  video: { bg: '#fff0f0', icon: '#dc2626' },
  image: { bg: '#fdf4ff', icon: '#c026d3' },
  pdf: { bg: '#fff7ed', icon: '#ea580c' },
  other: { bg: '#EDE9E1', icon: '#5A6B80' },
};

const MOCK_FILES: ClientFile[] = [
  { id: '1', client_id: 'c1', name: 'June_Reels_Pack.zip', drive_file_id: 'df1', file_url: '#', type: 'video', size_bytes: 245000000, created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: '2', client_id: 'c1', name: 'Brand_Assets_2025.zip', drive_file_id: 'df2', file_url: '#', type: 'image', size_bytes: 18500000, created_at: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: '3', client_id: 'c1', name: 'Monthly_Report_May.pdf', drive_file_id: 'df3', file_url: '#', type: 'pdf', size_bytes: 2400000, created_at: new Date(Date.now() - 86400000 * 10).toISOString() },
  { id: '4', client_id: 'c1', name: 'Email_Templates_Q2.zip', drive_file_id: 'df4', file_url: '#', type: 'other', size_bytes: 850000, created_at: new Date(Date.now() - 86400000 * 14).toISOString() },
  { id: '5', client_id: 'c1', name: 'Social_Captions_June.pdf', drive_file_id: 'df5', file_url: '#', type: 'pdf', size_bytes: 450000, created_at: new Date(Date.now() - 86400000 * 1).toISOString() },
];

function formatSize(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${(bytes / 1e3).toFixed(0)} KB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function FilesList() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid rgba(10,15,28,0.08)', background: '#ffffff' }}
    >
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(10,15,28,0.08)' }}
      >
        <h3 className="text-sm font-bold" style={{ color: '#0A0F1C' }}>Shared Files</h3>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: '#EDE9E1', color: '#5A6B80' }}>
          {MOCK_FILES.length} files
        </span>
      </div>

      <div className="divide-y" style={{ borderColor: 'rgba(10,15,28,0.05)' }}>
        {MOCK_FILES.map((file) => {
          const Icon = FILE_ICONS[file.type];
          const colors = FILE_COLORS[file.type];
          return (
            <div key={file.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[rgba(10,15,28,0.04)] transition-colors group">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: colors.bg, color: colors.icon }}
              >
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: '#0A0F1C' }}>{file.name}</p>
                <p className="text-xs mt-0.5" style={{ color: '#5A6B80' }}>
                  {file.size_bytes ? formatSize(file.size_bytes) : '—'} · {formatDate(file.created_at)}
                </p>
              </div>
              <a
                href={file.file_url || '#'}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:bg-[rgba(10,15,28,0.07)]"
                style={{ color: '#0A0F1C' }}
                aria-label={`Download ${file.name}`}
              >
                <Download size={14} />
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}

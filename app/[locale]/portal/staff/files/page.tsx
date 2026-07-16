'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, FileImage, Film, FileIcon, Download, Trash2, Loader2, CloudUpload, Filter, Folder, ArrowLeft, ChevronRight, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';

interface ClientFile {
  id: string;
  client_id: string;
  client_name?: string;
  name: string;
  drive_file_id: string;
  type: string;
  size_bytes?: number;
  created_at: string;
}

interface SimpleClient { id: string; name: string; color: string; }

function detectType(file: File): string {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type === 'application/pdf') return 'pdf';
  if (file.type.includes('word') || file.type.includes('document')) return 'document';
  return 'other';
}

function formatBytes(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  image: FileImage, video: Film, pdf: FileText, document: FileText, other: FileIcon,
};
const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  image:    { bg: 'rgba(37,99,235,0.08)',   color: '#2563eb' },
  video:    { bg: 'rgba(147,51,234,0.08)',  color: '#9333ea' },
  pdf:      { bg: 'rgba(220,38,38,0.08)',   color: '#dc2626' },
  document: { bg: 'rgba(234,88,12,0.08)',   color: '#ea580c' },
  other:    { bg: '#EDE9E1',                color: '#5A6B80' },
};
const CLIENT_COLORS = ['#6366f1','#ec4899','#f59e0b','#10b981','#8b5cf6','#06b6d4','#f43f5e','#5A6B80'];

export default function StaffFilesPage() {
  const t = useTranslations('portal');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles]               = useState<ClientFile[]>([]);
  const [clients, setClients]           = useState<SimpleClient[]>([]);
  const [loading, setLoading]           = useState(true);
  const [uploading, setUploading]       = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadClient, setUploadClient] = useState('');
  const [dragOver, setDragOver]         = useState(false);
  const [filterClient, setFilterClient] = useState('all');
  const [deleting, setDeleting]         = useState<string | null>(null);
  const [uploadError, setUploadError]   = useState('');

  // Virtual folders states
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [createdFolders, setCreatedFolders] = useState<string[]>([]);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('client_files')
      .select('*, clients(name)')
      .order('created_at', { ascending: false });
    if (data) {
      setFiles(data.map((f: Record<string, unknown>) => ({
        ...f,
        client_name: (f.clients as { name: string } | null)?.name ?? 'Unknown',
      })) as ClientFile[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      loadFiles(),
      supabase.from('clients').select('id, name').order('name'),
    ]).then(([, { data: c }]) => {
      if (c) setClients(c.map((cl: { id: string; name: string }, i: number) => ({
        ...cl,
        color: CLIENT_COLORS[i % CLIENT_COLORS.length],
      })));
    });
  }, [loadFiles]);

  const handleUpload = async (filesToUpload: FileList | null) => {
    if (!filesToUpload || filesToUpload.length === 0 || !uploadClient) return;
    setUploading(true);
    setUploadError('');

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      setUploadProgress(0);

      // Step 1: upload file through server proxy → Drive (avoids googleapis.com CORS)
      const driveFileId = await new Promise<string | null>((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/files/upload');
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.setRequestHeader('X-Filename', encodeURIComponent(file.name));

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 90));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText) as { driveFileId: string };
            resolve(data.driveFileId);
          } else {
            try {
              const { error } = JSON.parse(xhr.responseText) as { error: string };
              setUploadError(error ?? `Upload failed: ${xhr.status}`);
            } catch {
              setUploadError(`Upload failed: ${xhr.status}`);
            }
            resolve(null);
          }
        };

        xhr.onerror = () => {
          setUploadError('Network error during upload');
          resolve(null);
        };

        xhr.send(file);
      });

      if (!driveFileId) {
        setUploading(false);
        setUploadProgress(0);
        return;
      }

      // Step 2: register metadata in Supabase (with folder prefix in the name)
      const finalFileName = currentFolder ? `${currentFolder}/${file.name}` : file.name;

      const registerRes = await fetch('/api/files/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driveFileId,
          clientId: uploadClient,
          name: finalFileName,
          sizeBytes: file.size,
          type: detectType(file),
        }),
      });

      if (!registerRes.ok) {
        const { error } = await registerRes.json() as { error: string };
        await fetch(`/api/files/${driveFileId}`, { method: 'DELETE' });
        setUploadError(error ?? 'Failed to register file');
        setUploading(false);
        setUploadProgress(0);
        return;
      }

      setUploadProgress(Math.round(((i + 1) / filesToUpload.length) * 100));
    }

    setUploading(false);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
    loadFiles();
  };

  const handleDelete = async (file: ClientFile) => {
    if (!confirm(`Delete "${file.name}"?`)) return;
    setDeleting(file.id);

    const res = await fetch(`/api/files/${file.drive_file_id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const { error } = await res.json();
      setUploadError(error ?? 'Delete failed');
    }

    setDeleting(null);
    loadFiles();
  };

  const handleDownload = (file: ClientFile) => {
    const a = document.createElement('a');
    a.href = `/api/files/download/${file.drive_file_id}`;
    // Strip folder prefix for download name
    const displayName = file.name.includes('/') ? file.name.split('/').pop()! : file.name;
    a.download = displayName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const clientColor = (id: string) => clients.find(c => c.id === id)?.color ?? '#8A9BB0';

  // --- Virtual Folder Logic ---
  const parsedFolders = useMemo(() => {
    const folderNames = new Set<string>();
    
    // Parse folders from DB files
    for (const f of files) {
      if (filterClient !== 'all' && f.client_id !== filterClient) continue;

      if (f.name.includes('/')) {
        const parts = f.name.split('/');
        if (currentFolder === '') {
          folderNames.add(parts[0]);
        } else {
          if (f.name.startsWith(currentFolder + '/')) {
            const subPath = f.name.substring(currentFolder.length + 1);
            if (subPath.includes('/')) {
              folderNames.add(subPath.split('/')[0]);
            }
          }
        }
      }
    }

    // Merge with dynamically created empty folders
    for (const cf of createdFolders) {
      if (currentFolder === '') {
        if (!cf.includes('/')) folderNames.add(cf);
        else folderNames.add(cf.split('/')[0]);
      } else {
        if (cf.startsWith(currentFolder + '/')) {
          const subPath = cf.substring(currentFolder.length + 1);
          if (subPath.includes('/')) folderNames.add(subPath.split('/')[0]);
          else folderNames.add(subPath);
        }
      }
    }

    return Array.from(folderNames).sort();
  }, [files, currentFolder, createdFolders, filterClient]);

  const currentLevelFiles = useMemo(() => {
    return files.filter(f => {
      if (filterClient !== 'all' && f.client_id !== filterClient) return false;

      if (currentFolder === '') {
        return !f.name.includes('/');
      } else {
        if (!f.name.startsWith(currentFolder + '/')) return false;
        const subPath = f.name.substring(currentFolder.length + 1);
        return !subPath.includes('/');
      }
    });
  }, [files, currentFolder, filterClient]);

  const handleCreateFolder = () => {
    const name = prompt('Ingrese el nombre de la nueva carpeta:');
    if (!name || !name.trim()) return;
    const cleanName = name.trim().replace(/\//g, ''); // Prevent slashes inside folder name
    const folderPath = currentFolder ? `${currentFolder}/${cleanName}` : cleanName;
    setCreatedFolders(prev => [...prev, folderPath]);
  };

  const handleFolderClick = (folderName: string) => {
    setCurrentFolder(prev => prev ? `${prev}/${folderName}` : folderName);
  };

  const navigateToBreadcrumb = (index: number) => {
    if (index === -1) {
      setCurrentFolder('');
      return;
    }
    const parts = currentFolder.split('/');
    const newPath = parts.slice(0, index + 1).join('/');
    setCurrentFolder(newPath);
  };

  const breadcrumbs = useMemo(() => {
    if (!currentFolder) return [];
    return currentFolder.split('/');
  }, [currentFolder]);

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1 className="text-xl font-extrabold tracking-tight" style={{ color: '#0A0F1C' }}>{t('staffFiles.title')}</h1>
        <p className="text-sm mt-0.5 font-medium" style={{ color: '#5A6B80' }}>{t('staffFiles.subtitle')}</p>
      </motion.div>

      {/* Upload area */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl p-5"
        style={{ background: '#ffffff', border: '1px solid rgba(10,15,28,0.08)', boxShadow: '0 1px 4px rgba(10,15,28,0.05)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#8A9BB0' }}>Upload Files</p>
          {currentFolder && (
            <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ background: 'rgba(184,151,108,0.1)', color: '#B8976C' }}>
              Subiendo a: {currentFolder}
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <select
            value={uploadClient}
            onChange={(e) => setUploadClient(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl text-sm outline-none transition-all"
            style={{
              background: '#F7F4EE',
              border: '1.5px solid rgba(10,15,28,0.12)',
              color: uploadClient ? '#334155' : '#8A9BB0',
              fontFamily: 'inherit',
            }}
          >
            <option value="">Select client to associate…</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={!uploadClient || uploading}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5"
            style={{ background: '#0A0F1C', color: '#fff', boxShadow: '0 2px 8px rgba(10,15,28,0.2)' }}
          >
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? 'Subiendo…' : 'Seleccionar archivos'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
        </div>

        {/* Drag & drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); if (uploadClient) handleUpload(e.dataTransfer.files); }}
          onClick={() => uploadClient && fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 py-10 rounded-xl transition-all"
          style={{
            border: `2px dashed ${dragOver ? '#0A0F1C' : 'rgba(10,15,28,0.15)'}`,
            background: dragOver ? 'rgba(10,15,28,0.04)' : '#F7F4EE',
            cursor: uploadClient ? 'pointer' : 'default',
          }}
        >
          <CloudUpload size={28} style={{ color: dragOver ? '#0A0F1C' : '#cbd5e1' }} />
          <p className="text-sm font-medium" style={{ color: '#8A9BB0' }}>
            {uploadClient ? 'Drag and drop files here' : 'Select a client first'}
          </p>
          <p className="text-xs" style={{ color: '#cbd5e1' }}>Images, videos, PDFs, documents · Any size</p>
        </div>

        {/* Progress bar */}
        {uploading && (
          <div className="mt-3">
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#EDE9E1' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: '#0A0F1C' }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-[11px] mt-1 text-right" style={{ color: '#8A9BB0' }}>{uploadProgress}%</p>
          </div>
        )}

        {uploadError && (
          <div className="mt-3 px-4 py-3 rounded-xl text-xs font-medium"
            style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
            {uploadError}
          </div>
        )}
      </motion.div>

      {/* Files list */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl overflow-hidden"
        style={{ background: '#ffffff', border: '1px solid rgba(10,15,28,0.08)', boxShadow: '0 1px 4px rgba(10,15,28,0.05)' }}
      >
        {/* List header */}
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5"
          style={{ borderBottom: '1px solid rgba(10,15,28,0.08)', background: '#F7F4EE' }}
        >
          <div className="flex items-center gap-2 flex-wrap text-sm font-bold" style={{ color: '#0A0F1C' }}>
            <button
              onClick={() => navigateToBreadcrumb(-1)}
              className="hover:underline transition-all hover:text-[#B8976C] cursor-pointer"
            >
              Raíz
            </button>
            {breadcrumbs.map((part, index) => (
              <span key={index} className="flex items-center gap-1.5 text-slate-400">
                <ChevronRight size={12} />
                <button
                  onClick={() => navigateToBreadcrumb(index)}
                  className="hover:underline transition-all hover:text-[#B8976C] text-[#0A0F1C] cursor-pointer"
                >
                  {part}
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateFolder}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:bg-slate-200 cursor-pointer border"
              style={{ borderColor: 'rgba(10,15,28,0.12)', color: '#0A0F1C', background: '#fff' }}
            >
              <Plus size={12} /> Nueva carpeta
            </button>
            <div className="flex items-center gap-1">
              <Filter size={12} style={{ color: '#8A9BB0' }} className="ml-1" />
              <select
                value={filterClient}
                onChange={(e) => setFilterClient(e.target.value)}
                className="text-xs px-2 py-1.5 rounded-lg outline-none cursor-pointer"
                style={{ border: '1.5px solid rgba(10,15,28,0.12)', color: '#334155', background: '#fff', fontFamily: 'inherit' }}
              >
                <option value="all">All clients</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin" style={{ color: '#8A9BB0' }} />
          </div>
        ) : parsedFolders.length === 0 && currentLevelFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <FileIcon size={32} style={{ color: '#e2e8f0' }} />
            <p className="text-sm font-semibold mt-3" style={{ color: '#8A9BB0' }}>Esta carpeta está vacía</p>
            {currentFolder && (
              <button
                onClick={() => setCurrentFolder(prev => prev.includes('/') ? prev.split('/').slice(0, -1).join('/') : '')}
                className="mt-4 flex items-center gap-1 text-xs font-bold hover:underline"
                style={{ color: '#B8976C' }}
              >
                <ArrowLeft size={12} /> Volver
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'rgba(10,15,28,0.05)' }}>
            
            {/* Folder rows */}
            {parsedFolders.map((folder) => (
              <div
                key={folder}
                onClick={() => handleFolderClick(folder)}
                className="flex items-center gap-4 px-5 py-3 hover:bg-[rgba(10,15,28,0.04)] transition-colors cursor-pointer"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(184,151,108,0.12)', color: '#B8976C' }}
                >
                  <Folder size={16} fill="#B8976C" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: '#0A0F1C' }}>{folder}</p>
                  <p className="text-[11px]" style={{ color: '#8A9BB0' }}>Carpeta de archivos</p>
                </div>
                <ChevronRight size={14} className="text-slate-400" />
              </div>
            ))}

            {/* File rows */}
            {currentLevelFiles.map((file, idx) => {
              const TypeIcon = TYPE_ICONS[file.type] ?? FileIcon;
              const typeStyle = TYPE_COLORS[file.type] ?? TYPE_COLORS.other;
              const isDeleting = deleting === file.id;
              
              // Strip folder path from display name
              const displayName = file.name.includes('/') ? file.name.split('/').pop()! : file.name;

              return (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-[rgba(10,15,28,0.04)] transition-colors"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: typeStyle.bg, color: typeStyle.color }}
                  >
                    <TypeIcon size={16} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#0A0F1C' }}>{displayName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                        style={{ background: clientColor(file.client_id) + '18', color: clientColor(file.client_id) }}
                      >
                        {file.client_name}
                      </span>
                      <span className="text-[11px]" style={{ color: '#8A9BB0' }}>{formatBytes(file.size_bytes)}</span>
                      <span className="text-[11px]" style={{ color: '#cbd5e1' }}>·</span>
                      <span className="text-[11px]" style={{ color: '#8A9BB0' }}>
                        {new Date(file.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDownload(file)}
                      className="p-2 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer"
                      title="Download"
                      style={{ color: '#5A6B80' }}
                    >
                      <Download size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(file)}
                      disabled={isDeleting}
                      className="p-2 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-40 cursor-pointer"
                      title="Delete"
                      style={{ color: '#8A9BB0' }}
                    >
                      {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}

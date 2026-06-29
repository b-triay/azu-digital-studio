'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Eye, EyeOff, Users, Shield, Loader2, AlertCircle, RefreshCw,
  Pencil, UserX, UserCheck, Mail, Copy,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'client' | 'staff' | 'admin';
  created_at: string;
  last_sign_in_at: string | null;
  banned: boolean;
}

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  admin:  { label: 'Admin',  color: '#dc2626', bg: '#fef2f2' },
  staff:  { label: 'Staff',  color: '#B8976C', bg: '#fff7ed' },
  client: { label: 'Client', color: '#2563eb', bg: '#eff6ff' },
};

const fieldStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1.5px solid rgba(10,15,28,0.12)',
  color: '#334155',
  fontFamily: 'inherit',
};

const focusHandlers = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = '#0A0F1C';
    e.target.style.boxShadow = '0 0 0 3px rgba(10,15,28,0.07)';
  },
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = 'rgba(10,15,28,0.12)';
    e.target.style.boxShadow = 'none';
  },
};

export default function UsersSettingsPage() {
  const t = useTranslations('portal');
  const [users, setUsers]           = useState<User[]>([]);
  const [loading, setLoading]       = useState(true);
  const [serviceErr, setServiceErr] = useState(false);
  const [showForm, setShowForm]     = useState(false);
  const [deleting, setDeleting]     = useState<string | null>(null);
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState('');
  const [showPw, setShowPw]         = useState(false);

  // Create form
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'client' as User['role'] });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  // Edit
  const [editingUser, setEditingUser]   = useState<User | null>(null);
  const [editForm, setEditForm]         = useState({ name: '', email: '', role: 'client' as User['role'] });
  const [editError, setEditError]       = useState('');
  const setEdit = (k: keyof typeof editForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setEditForm((p) => ({ ...p, [k]: e.target.value }));

  // Ban / Invite
  const [banning, setBanning]     = useState<string | null>(null);
  const [inviting, setInviting]   = useState<string | null>(null);
  const [inviteResult, setInviteResult] = useState<{ email: string; link: string | null; sent: boolean } | null>(null);
  const [copied, setCopied]       = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/users');
    if (res.status === 503) { setServiceErr(true); setLoading(false); return; }
    const data = await res.json();
    setUsers(
      (data.users ?? []).map((u: Record<string, unknown>) => ({
        ...u,
        banned: u.is_banned ?? false,
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // ── Create ──────────────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.name) return;
    setSaving(true);
    setFormError('');
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setFormError(data.error ?? 'Error creating user'); setSaving(false); return; }
    setForm({ email: '', password: '', name: '', role: 'client' });
    setShowForm(false);
    setSaving(false);
    loadUsers();
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Delete user ${email}? This cannot be undone.`)) return;
    setDeleting(id);
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    setDeleting(null);
    loadUsers();
  };

  // ── Edit ────────────────────────────────────────────────────────────────────
  const openEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({ name: user.name, email: user.email, role: user.role });
    setEditError('');
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSaving(true);
    setEditError('');
    const res = await fetch(`/api/admin/users/${editingUser.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    const data = await res.json();
    if (!res.ok) { setEditError(data.error ?? 'Error updating user'); setSaving(false); return; }
    setSaving(false);
    setEditingUser(null);
    loadUsers();
  };

  // ── Ban / Unban ──────────────────────────────────────────────────────────────
  const handleBan = async (user: User) => {
    setBanning(user.id);
    await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ban_duration: user.banned ? 'none' : '876000h' }),
    });
    setBanning(null);
    loadUsers();
  };

  // ── Invite / Reset ───────────────────────────────────────────────────────────
  const handleInvite = async (user: User) => {
    setInviting(user.id);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sendEmail: true }),
    });
    const data = await res.json();
    setInviteResult({
      email: user.email,
      link: data.link ?? null,
      sent: res.ok && !!data.ok,
    });
    setInviting(null);
  };

  return (
    <div className="max-w-4xl mx-auto">

      {/* Header */}
      <motion.div
        className="flex items-start justify-between mb-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div>
          <h1 className="text-xl font-extrabold tracking-tight" style={{ color: '#0A0F1C' }}>{t('settings.title')}</h1>
          <p className="text-sm mt-0.5 font-medium" style={{ color: '#5A6B80' }}>{t('settings.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadUsers}
            className="p-2 rounded-xl transition-colors hover:bg-[rgba(10,15,28,0.07)]"
            style={{ border: '1.5px solid rgba(10,15,28,0.12)' }}
            title="Refresh"
          >
            <RefreshCw size={15} style={{ color: '#5A6B80' }} />
          </button>
          <motion.button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: '#0A0F1C', color: '#ffffff' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus size={15} />
            {t('settings.newUser')}
          </motion.button>
        </div>
      </motion.div>

      {/* Service role key warning */}
      {serviceErr && (
        <div className="flex items-start gap-3 px-5 py-4 rounded-2xl mb-6"
          style={{ background: '#fffbeb', border: '1.5px solid #fde68a' }}>
          <AlertCircle size={18} style={{ color: '#d97706', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p className="text-sm font-bold" style={{ color: '#92400e' }}>{t('settings.serviceErrTitle')}</p>
            <p className="text-xs mt-1" style={{ color: '#b45309' }}>
              Add <code className="bg-amber-100 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code> to your Vercel environment variables.
            </p>
          </div>
        </div>
      )}

      {/* Create user form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-5"
          >
            <div className="rounded-2xl p-5"
              style={{ background: '#ffffff', border: '1px solid rgba(10,15,28,0.08)', boxShadow: '0 1px 4px rgba(10,15,28,0.05)' }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#8A9BB0' }}>{t('settings.formTitle')}</p>
              <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: '#5A6B80' }}>{t('settings.fieldName')}</label>
                  <input type="text" required placeholder="Jane Smith" value={form.name} onChange={set('name')}
                    className="px-4 py-3 rounded-xl text-sm outline-none transition-all" style={fieldStyle} {...focusHandlers} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: '#5A6B80' }}>{t('settings.fieldEmail')}</label>
                  <input type="email" required placeholder="jane@company.com" value={form.email} onChange={set('email')}
                    className="px-4 py-3 rounded-xl text-sm outline-none transition-all" style={fieldStyle} {...focusHandlers} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: '#5A6B80' }}>{t('settings.fieldPassword')}</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} required placeholder="min. 8 characters"
                      value={form.password} onChange={set('password')} minLength={8}
                      className="w-full px-4 py-3 pr-11 rounded-xl text-sm outline-none transition-all" style={fieldStyle}
                      onFocus={focusHandlers.onFocus as React.FocusEventHandler<HTMLInputElement>}
                      onBlur={focusHandlers.onBlur as React.FocusEventHandler<HTMLInputElement>}
                    />
                    <button type="button" onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[rgba(10,15,28,0.07)]" style={{ color: '#8A9BB0' }}>
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: '#5A6B80' }}>{t('settings.fieldRole')}</label>
                  <select value={form.role} onChange={set('role')}
                    className="px-4 py-3 rounded-xl text-sm outline-none transition-all" style={fieldStyle} {...focusHandlers}>
                    <option value="client">{t('settings.roleClient')}</option>
                    <option value="staff">{t('settings.roleStaff')}</option>
                    <option value="admin">{t('settings.roleAdmin')}</option>
                  </select>
                </div>
                {formError && (
                  <div className="sm:col-span-2 px-4 py-3 rounded-xl text-xs font-medium"
                    style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                    {formError}
                  </div>
                )}
                <div className="sm:col-span-2 flex gap-3 justify-end">
                  <button type="button" onClick={() => { setShowForm(false); setFormError(''); }}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold" style={{ background: '#EDE9E1', color: '#5A6B80' }}>
                    {t('settings.cancel')}
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                    style={{ background: '#0A0F1C', color: '#ffffff' }}>
                    {saving && <Loader2 size={13} className="animate-spin" />}
                    {t('settings.createUser')}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Users list */}
      <motion.div
        className="rounded-2xl overflow-hidden"
        style={{ background: '#ffffff', border: '1px solid rgba(10,15,28,0.08)', boxShadow: '0 1px 4px rgba(10,15,28,0.05)' }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {/* Table header */}
        <div className="grid px-5 py-3 text-[10px] font-bold uppercase tracking-widest"
          style={{
            gridTemplateColumns: '1fr 160px 90px 120px 120px',
            color: '#8A9BB0', background: '#F7F4EE',
            borderBottom: '1px solid rgba(10,15,28,0.06)',
          }}>
          <span>{t('settings.tableUser')}</span>
          <span>{t('settings.tableRole')}</span>
          <span>{t('settings.tableLastLogin')}</span>
          <span>{t('settings.tableCreated')}</span>
          <span />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin" style={{ color: '#8A9BB0' }} />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Users size={32} style={{ color: '#e2e8f0' }} />
            <p className="text-sm font-semibold mt-3" style={{ color: '#8A9BB0' }}>{t('settings.noUsers')}</p>
          </div>
        ) : (
          users
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map((user, idx) => {
              const roleCfg = ROLE_CONFIG[user.role] ?? ROLE_CONFIG.client;
              const isDeleting = deleting === user.id;
              const isBanning  = banning  === user.id;
              const isInviting = inviting === user.id;
              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.04 }}
                  className="grid items-center px-5 py-4"
                  style={{
                    gridTemplateColumns: '1fr 160px 90px 120px 120px',
                    borderBottom: '1px solid rgba(10,15,28,0.05)',
                    opacity: user.banned ? 0.6 : 1,
                  }}
                >
                  {/* User */}
                  <div className="flex items-center gap-3 min-w-0 pr-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: roleCfg.bg, color: roleCfg.color }}>
                      {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: '#334155' }}>{user.name || '—'}</p>
                      <p className="text-xs truncate" style={{ color: '#8A9BB0' }}>{user.email}</p>
                    </div>
                  </div>

                  {/* Role + banned badge */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5"
                      style={{ background: roleCfg.bg, color: roleCfg.color }}>
                      <Shield size={10} />
                      {roleCfg.label}
                    </span>
                    {user.banned && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: '#fef2f2', color: '#dc2626' }}>
                        {t('settings.banned')}
                      </span>
                    )}
                  </div>

                  {/* Last login */}
                  <p className="text-xs" style={{ color: '#8A9BB0' }}>
                    {user.last_sign_in_at
                      ? new Date(user.last_sign_in_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })
                      : t('settings.never')}
                  </p>

                  {/* Created */}
                  <p className="text-xs" style={{ color: '#8A9BB0' }}>
                    {new Date(user.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-1 justify-end">
                    {/* Edit */}
                    <button onClick={() => openEdit(user)}
                      title={t('settings.editUser')}
                      className="p-2 rounded-xl transition-colors hover:bg-[rgba(10,15,28,0.07)] flex items-center justify-center"
                      style={{ color: '#5A6B80' }}>
                      <Pencil size={13} />
                    </button>

                    {/* Ban / Unban */}
                    <button onClick={() => handleBan(user)} disabled={isBanning}
                      title={user.banned ? t('settings.activate') : t('settings.deactivate')}
                      className="p-2 rounded-xl transition-colors hover:bg-amber-50 disabled:opacity-40 flex items-center justify-center"
                      style={{ color: user.banned ? '#16a34a' : '#d97706' }}>
                      {isBanning
                        ? <Loader2 size={13} className="animate-spin" />
                        : user.banned ? <UserCheck size={13} /> : <UserX size={13} />}
                    </button>

                    {/* Send welcome / reset email */}
                    <button onClick={() => handleInvite(user)} disabled={isInviting}
                      title={t('settings.sendWelcome')}
                      className="p-2 rounded-xl transition-colors hover:bg-blue-50 disabled:opacity-40 flex items-center justify-center"
                      style={{ color: '#2563eb' }}>
                      {isInviting ? <Loader2 size={13} className="animate-spin" /> : <Mail size={13} />}
                    </button>

                    {/* Delete */}
                    <button onClick={() => handleDelete(user.id, user.email)} disabled={isDeleting}
                      title="Delete user"
                      className="p-2 rounded-xl transition-colors hover:bg-red-50 disabled:opacity-40 flex items-center justify-center"
                      style={{ color: '#8A9BB0' }}>
                      {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </motion.div>
              );
            })
        )}
      </motion.div>

      {!serviceErr && !loading && (
        <p className="text-xs mt-4 text-center" style={{ color: '#cbd5e1' }}>
          {t('settings.footerNote')}
        </p>
      )}

      {/* ── Edit modal ── */}
      <AnimatePresence>
        {editingUser && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setEditingUser(null); }}
          >
            <motion.div
              className="w-full max-w-md rounded-2xl p-6"
              style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
              initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-base font-bold mb-4" style={{ color: '#0A0F1C' }}>{t('settings.editUser')}</h2>
              <form onSubmit={handleEditSave} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: '#5A6B80' }}>{t('settings.fieldName')}</label>
                  <input type="text" required value={editForm.name} onChange={setEdit('name')}
                    className="px-4 py-3 rounded-xl text-sm outline-none transition-all" style={fieldStyle} {...focusHandlers} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: '#5A6B80' }}>{t('settings.fieldEmail')}</label>
                  <input type="email" required value={editForm.email} onChange={setEdit('email')}
                    className="px-4 py-3 rounded-xl text-sm outline-none transition-all" style={fieldStyle} {...focusHandlers} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold" style={{ color: '#5A6B80' }}>{t('settings.fieldRole')}</label>
                  <select value={editForm.role} onChange={setEdit('role')}
                    className="px-4 py-3 rounded-xl text-sm outline-none transition-all" style={fieldStyle} {...focusHandlers}>
                    <option value="client">{t('settings.roleClient')}</option>
                    <option value="staff">{t('settings.roleStaff')}</option>
                    <option value="admin">{t('settings.roleAdmin')}</option>
                  </select>
                </div>
                {editError && (
                  <div className="px-4 py-3 rounded-xl text-xs font-medium"
                    style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                    {editError}
                  </div>
                )}
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setEditingUser(null)}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold" style={{ background: '#EDE9E1', color: '#5A6B80' }}>
                    {t('settings.cancel')}
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                    style={{ background: '#0A0F1C', color: '#ffffff' }}>
                    {saving && <Loader2 size={13} className="animate-spin" />}
                    {t('settings.save')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Invite result modal ── */}
      <AnimatePresence>
        {inviteResult && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setInviteResult(null); }}
          >
            <motion.div
              className="w-full max-w-md rounded-2xl p-6"
              style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
              initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-base font-bold mb-1" style={{ color: '#0A0F1C' }}>
                {inviteResult.sent ? t('settings.emailSent') : t('settings.inviteLinkTitle')}
              </h2>
              <p className="text-xs mb-4" style={{ color: '#5A6B80' }}>{inviteResult.email}</p>

              {inviteResult.sent && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4"
                  style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a' }}>
                  <span className="text-xs font-semibold">{t('settings.emailSentDesc')}</span>
                </div>
              )}

              {inviteResult.link && (
                <>
                  <p className="text-xs font-semibold mb-2" style={{ color: '#8A9BB0' }}>
                    {t('settings.copyLinkFallback')}
                  </p>
                  <div className="flex gap-2">
                    <input readOnly value={inviteResult.link}
                      className="flex-1 px-3 py-2.5 rounded-xl text-xs outline-none"
                      style={{ background: '#F7F4EE', border: '1.5px solid rgba(10,15,28,0.12)', color: '#334155', fontFamily: 'monospace' }}
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const text = inviteResult.link ?? '';
                        try {
                          await navigator.clipboard.writeText(text);
                        } catch {
                          // Fallback for browsers that block clipboard API
                          const el = document.createElement('textarea');
                          el.value = text;
                          el.style.position = 'fixed';
                          el.style.opacity = '0';
                          document.body.appendChild(el);
                          el.select();
                          document.execCommand('copy');
                          document.body.removeChild(el);
                        }
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                      style={{ background: copied ? '#16a34a' : '#0A0F1C', color: '#fff' }}>
                      <Copy size={12} /> {copied ? '¡Copiado!' : t('settings.copy')}
                    </button>
                  </div>
                </>
              )}

              <button onClick={() => setInviteResult(null)}
                className="mt-4 w-full py-2.5 rounded-xl text-xs font-bold"
                style={{ background: '#EDE9E1', color: '#5A6B80' }}>
                {t('settings.close')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

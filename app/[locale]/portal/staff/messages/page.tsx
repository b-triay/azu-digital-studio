'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ClientItem {
  id: string;
  name: string;
  initials: string;
  color: string;
  unread: number;
  lastMessage: string | null;
  lastAt: string | null;
}

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'staff' | 'client';
  content: string;
  created_at: string;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function formatDateLabel(iso: string): string {
  const msgDate = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (msgDate.toDateString() === today.toDateString()) return 'Hoy';
  if (msgDate.toDateString() === yesterday.toDateString()) return 'Ayer';
  return msgDate.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}

type MessageOrSep = { type: 'msg'; msg: Message } | { type: 'sep'; label: string; key: string };

export default function StaffMessagesPage() {
  const [clients, setClients]           = useState<ClientItem[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [selected, setSelected]         = useState<ClientItem | null>(null);
  const [messages, setMessages]         = useState<Message[]>([]);
  const [text, setText]                 = useState('');
  const [sending, setSending]           = useState(false);
  const [loadingMsgs, setLoadingMsgs]   = useState(false);
  const bottomRef                       = useRef<HTMLDivElement>(null);
  const textareaRef                     = useRef<HTMLTextAreaElement>(null);
  const channelRef                      = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);

  const loadClients = useCallback(async () => {
    const supabase = createClient();
    const { data: rawClients } = await supabase
      .from('clients')
      .select('id, name, initials, color')
      .order('name');
    if (!rawClients) { setLoadingClients(false); return; }

    const { data: unreadRows } = await supabase
      .from('messages')
      .select('client_id')
      .eq('read_by_staff', false);

    const { data: lastRows } = await supabase
      .from('messages')
      .select('client_id, content, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    const unreadMap: Record<string, number> = {};
    for (const r of unreadRows ?? []) {
      unreadMap[r.client_id] = (unreadMap[r.client_id] ?? 0) + 1;
    }

    const lastMap: Record<string, { content: string; created_at: string }> = {};
    for (const r of lastRows ?? []) {
      if (!lastMap[r.client_id]) lastMap[r.client_id] = r;
    }

    const items: ClientItem[] = rawClients.map((c) => ({
      id: c.id,
      name: c.name,
      initials: c.initials,
      color: c.color,
      unread: unreadMap[c.id] ?? 0,
      lastMessage: lastMap[c.id]?.content ?? null,
      lastAt: lastMap[c.id]?.created_at ?? null,
    }));

    items.sort((a, b) => {
      if (a.lastAt && b.lastAt) return new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime();
      if (a.lastAt) return -1;
      if (b.lastAt) return 1;
      return a.name.localeCompare(b.name);
    });

    setClients(items);
    setLoadingClients(false);
  }, []);

  useEffect(() => { loadClients(); }, [loadClients]);

  const selectClient = useCallback(async (client: ClientItem) => {
    setSelected(client);
    setLoadingMsgs(true);
    setMessages([]);
    setText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    if (channelRef.current) { channelRef.current.unsubscribe(); channelRef.current = null; }

    const supabase = createClient();

    await supabase
      .from('messages')
      .update({ read_by_staff: true })
      .eq('client_id', client.id)
      .eq('read_by_staff', false);

    const { data } = await supabase
      .from('messages')
      .select('id, sender_id, sender_name, sender_role, content, created_at')
      .eq('client_id', client.id)
      .order('created_at', { ascending: true });

    setMessages(data ?? []);
    setLoadingMsgs(false);
    setClients((prev) => prev.map((c) => (c.id === client.id ? { ...c, unread: 0 } : c)));

    const channel = supabase
      .channel('staff-messages-' + client.id)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: 'client_id=eq.' + client.id },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => [...prev, msg]);
          if (msg.sender_role === 'client') {
            supabase.from('messages').update({ read_by_staff: true }).eq('id', msg.id).then(() => {});
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { return () => { channelRef.current?.unsubscribe(); }; }, []);

  const items = useMemo<MessageOrSep[]>(() => {
    const result: MessageOrSep[] = [];
    let lastDate = '';
    for (const msg of messages) {
      const dateKey = new Date(msg.created_at).toDateString();
      if (dateKey !== lastDate) {
        result.push({ type: 'sep', label: formatDateLabel(msg.created_at), key: dateKey });
        lastDate = dateKey;
      }
      result.push({ type: 'msg', msg });
    }
    return result;
  }, [messages]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  };

  const handleSend = async () => {
    if (!text.trim() || !selected || sending) return;
    setSending(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSending(false); return; }

    const { data: staffRow } = await supabase
      .from('staff_members')
      .select('name')
      .eq('user_id', user.id)
      .single();

    await supabase.from('messages').insert({
      client_id: selected.id,
      sender_id: user.id,
      sender_name: staffRow?.name ?? 'Staff',
      sender_role: 'staff',
      content: text.trim(),
      read_by_staff: true,
    });

    setText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setSending(false);
    loadClients();
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex h-full overflow-hidden rounded-2xl" style={{ border: '1px solid rgba(10,15,28,0.08)' }}>

      {/* Panel izquierdo — lista de clientes */}
      <div
        className="w-72 flex-shrink-0 flex flex-col overflow-hidden"
        style={{ background: '#F7F4EE', borderRight: '1px solid rgba(10,15,28,0.08)' }}
      >
        <div className="px-4 py-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(10,15,28,0.08)', background: '#F7F4EE' }}>
          <h1 className="text-base font-extrabold" style={{ color: '#0A0F1C' }}>Mensajes</h1>
          <p className="text-xs mt-0.5" style={{ color: '#5A6B80' }}>Conversaciones con clientes</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingClients ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3 animate-pulse" style={{ borderBottom: '1px solid rgba(10,15,28,0.04)' }}>
                  <div className="w-9 h-9 rounded-full flex-shrink-0" style={{ background: 'rgba(10,15,28,0.08)' }} />
                  <div className="flex-1 pt-0.5 space-y-2">
                    <div className="h-3 rounded" style={{ background: 'rgba(10,15,28,0.08)', width: '55%' }} />
                    <div className="h-2.5 rounded" style={{ background: 'rgba(10,15,28,0.05)', width: '80%' }} />
                  </div>
                </div>
              ))}
            </>
          ) : clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 p-6 text-center">
              <MessageSquare size={28} style={{ color: '#8A9BB0' }} />
              <p className="text-sm" style={{ color: '#5A6B80' }}>Sin clientes aún</p>
            </div>
          ) : (
            clients.map((c) => {
              const isSelected = selected?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => selectClient(c)}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[rgba(10,15,28,0.04)]"
                  style={{
                    background: isSelected ? 'rgba(184,151,108,0.1)' : 'transparent',
                    borderBottom: '1px solid rgba(10,15,28,0.04)',
                    borderLeft: isSelected ? '2.5px solid #B8976C' : '2.5px solid transparent',
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: c.color }}
                  >
                    {c.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-sm truncate"
                        style={{ color: '#0A0F1C', fontWeight: c.unread > 0 ? 700 : 500 }}
                      >
                        {c.name}
                      </span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {c.lastAt && (
                          <span className="text-xs" style={{ color: '#8A9BB0' }}>{formatRelative(c.lastAt)}</span>
                        )}
                        {c.unread > 0 && (
                          <span
                            className="text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
                            style={{ background: '#B8976C', color: '#fff' }}
                          >
                            {c.unread}
                          </span>
                        )}
                      </div>
                    </div>
                    {c.lastMessage && (
                      <p
                        className="text-xs truncate mt-0.5"
                        style={{ color: c.unread > 0 ? '#5A6B80' : '#8A9BB0', fontWeight: c.unread > 0 ? 500 : 400 }}
                      >
                        {c.lastMessage.length > 42 ? c.lastMessage.slice(0, 42) + '…' : c.lastMessage}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Panel derecho — chat */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'rgba(184,151,108,0.06)' }}>
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(184,151,108,0.12)' }}
            >
              <MessageSquare size={30} style={{ color: '#B8976C' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#0A0F1C' }}>Seleccioná un cliente</p>
              <p className="text-xs mt-1" style={{ color: '#8A9BB0' }}>
                Elegí una conversación de la lista para comenzar.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div
              className="px-5 py-3 flex items-center gap-3 flex-shrink-0"
              style={{ background: '#ffffff', borderBottom: '1px solid rgba(10,15,28,0.08)' }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: selected.color }}
              >
                {selected.initials}
              </div>
              <span className="text-sm font-bold" style={{ color: '#0A0F1C' }}>{selected.name}</span>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2">
              {loadingMsgs ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ color: '#0A0F1C' }} />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 mt-16 text-center">
                  <MessageSquare size={28} style={{ color: '#8A9BB0' }} />
                  <p className="text-sm" style={{ color: '#5A6B80' }}>Sin mensajes aún con {selected.name}.</p>
                </div>
              ) : (
                items.map((item) => {
                  if (item.type === 'sep') {
                    return (
                      <div key={item.key} className="flex items-center gap-3 my-2">
                        <div className="flex-1 h-px" style={{ background: 'rgba(10,15,28,0.1)' }} />
                        <span className="text-[11px] font-semibold px-2" style={{ color: '#8A9BB0' }}>{item.label}</span>
                        <div className="flex-1 h-px" style={{ background: 'rgba(10,15,28,0.1)' }} />
                      </div>
                    );
                  }
                  const { msg } = item;
                  const isStaff = msg.sender_role === 'staff';
                  return (
                    <div key={msg.id} className={`flex flex-col gap-1 ${isStaff ? 'items-end' : 'items-start'}`}>
                      <div
                        className="max-w-xs lg:max-w-md px-4 py-2.5 text-sm leading-relaxed"
                        style={{
                          background: isStaff ? '#0A0F1C' : '#ffffff',
                          color: isStaff ? '#F7F4EE' : '#0A0F1C',
                          border: isStaff ? 'none' : '1px solid rgba(10,15,28,0.1)',
                          borderRadius: isStaff ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          boxShadow: isStaff ? 'none' : '0 1px 3px rgba(10,15,28,0.06)',
                        }}
                      >
                        {msg.content}
                      </div>
                      <div className="flex items-center gap-1.5 px-1">
                        {!isStaff && <span className="text-xs font-medium" style={{ color: '#5A6B80' }}>{msg.sender_name}</span>}
                        <span className="text-xs" style={{ color: '#8A9BB0' }}>{formatTime(msg.created_at)}</span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div
              className="px-4 py-3 flex items-end gap-3 flex-shrink-0"
              style={{ background: '#ffffff', borderTop: '1px solid rgba(10,15,28,0.08)' }}
            >
              <textarea
                ref={textareaRef}
                value={text}
                onChange={handleTextChange}
                onKeyDown={handleKey}
                placeholder="Escribí un mensaje… (Enter para enviar)"
                rows={1}
                className="flex-1 resize-none rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
                style={{
                  background: 'rgba(184,151,108,0.07)',
                  border: '1.5px solid rgba(10,15,28,0.1)',
                  color: '#0A0F1C',
                  maxHeight: '120px',
                  fontFamily: 'inherit',
                  lineHeight: '1.5',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#B8976C'; e.target.style.boxShadow = '0 0 0 3px rgba(184,151,108,0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(10,15,28,0.1)'; e.target.style.boxShadow = 'none'; }}
              />
              <button
                onClick={handleSend}
                disabled={!text.trim() || sending}
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30 hover:scale-105"
                style={{ background: '#0A0F1C' }}
              >
                <Send size={15} style={{ color: '#F7F4EE' }} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

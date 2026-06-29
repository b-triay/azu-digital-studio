'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

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

export default function ClientMessagesPage() {
  const [clientId, setClientId]     = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [messages, setMessages]     = useState<Message[]>([]);
  const [text, setText]             = useState('');
  const [sending, setSending]       = useState(false);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const bottomRef                   = useRef<HTMLDivElement>(null);
  const textareaRef                 = useRef<HTMLTextAreaElement>(null);
  const channelRef                  = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);

  const init = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('No autenticado'); setLoading(false); return; }

    const { data: clientRow } = await supabase
      .from('clients')
      .select('id, name')
      .eq('user_id', user.id)
      .single();

    if (!clientRow) { setError('No encontramos tu cuenta de cliente.'); setLoading(false); return; }

    setClientId(clientRow.id);
    setClientName(clientRow.name);

    await supabase
      .from('messages')
      .update({ read_by_client: true })
      .eq('client_id', clientRow.id)
      .eq('read_by_client', false);

    const { data } = await supabase
      .from('messages')
      .select('id, sender_id, sender_name, sender_role, content, created_at')
      .eq('client_id', clientRow.id)
      .order('created_at', { ascending: true });

    setMessages(data ?? []);
    setLoading(false);

    const channel = supabase
      .channel('client-messages-' + clientRow.id)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: 'client_id=eq.' + clientRow.id },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => [...prev, msg]);
          if (msg.sender_role === 'staff') {
            supabase.from('messages').update({ read_by_client: true }).eq('id', msg.id).then(() => {});
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
  }, []);

  useEffect(() => { init(); return () => { channelRef.current?.unsubscribe(); }; }, [init]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

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
    if (!text.trim() || !clientId || sending) return;
    setSending(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSending(false); return; }

    await supabase.from('messages').insert({
      client_id: clientId,
      sender_id: user.id,
      sender_name: clientName,
      sender_role: 'client',
      content: text.trim(),
      read_by_client: true,
    });

    setText('');
    if (textareaRef.current) { textareaRef.current.style.height = 'auto'; }
    setSending(false);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ color: '#0A0F1C' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
        <MessageSquare size={36} style={{ color: '#8A9BB0' }} />
        <p className="text-sm" style={{ color: '#5A6B80' }}>{error}</p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full overflow-hidden rounded-2xl"
      style={{ border: '1px solid rgba(10,15,28,0.08)', background: '#ffffff' }}
    >
      {/* Header */}
      <div className="px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(10,15,28,0.08)' }}>
        <h1 className="text-base font-extrabold" style={{ color: '#0A0F1C' }}>Mensajes</h1>
        <p className="text-xs mt-0.5" style={{ color: '#5A6B80' }}>Comunicación directa con tu equipo Azu.</p>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2" style={{ background: 'rgba(184,151,108,0.06)' }}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(184,151,108,0.12)' }}>
              <MessageSquare size={26} style={{ color: '#B8976C' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#0A0F1C' }}>Sin mensajes aún</p>
              <p className="text-xs mt-1" style={{ color: '#8A9BB0' }}>Escribí un mensaje para iniciar la conversación con tu equipo.</p>
            </div>
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
            const isMe = msg.sender_role === 'client';
            return (
              <div key={msg.id} className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                <div
                  className="max-w-xs lg:max-w-md px-4 py-2.5 text-sm leading-relaxed"
                  style={{
                    background: isMe ? '#0A0F1C' : '#ffffff',
                    color: isMe ? '#F7F4EE' : '#0A0F1C',
                    border: isMe ? 'none' : '1px solid rgba(10,15,28,0.1)',
                    borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    boxShadow: isMe ? 'none' : '0 1px 3px rgba(10,15,28,0.06)',
                  }}
                >
                  {msg.content}
                </div>
                <div className="flex items-center gap-1.5 px-1">
                  {!isMe && <span className="text-xs font-medium" style={{ color: '#5A6B80' }}>{msg.sender_name}</span>}
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
    </div>
  );
}

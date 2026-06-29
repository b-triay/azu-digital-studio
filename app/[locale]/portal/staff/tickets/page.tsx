'use client';

import { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, X, Calendar, User, Building2, Pencil, Trash2, Filter } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Status = 'pending' | 'in_progress' | 'done';

interface Ticket {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  client_id: string | null;
  staff_member_id: string | null;
  due_date: string | null;
  created_at: string;
}

interface ClientRow  { id: string; name: string; initials: string; color: string }
interface StaffRow   { id: string; name: string; initials: string; color: string }

interface TicketForm {
  title: string;
  description: string;
  status: Status;
  client_id: string;
  staff_member_id: string;
  due_date: string;
}

const DEFAULT_FORM: TicketForm = {
  title: '', description: '', status: 'pending',
  client_id: '', staff_member_id: '', due_date: '',
};

const COLUMNS: { key: Status; label: string; color: string; bg: string }[] = [
  { key: 'pending',     label: 'Pendiente',    color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
  { key: 'in_progress', label: 'En progreso',  color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
  { key: 'done',        label: 'Terminado',    color: '#22c55e', bg: 'rgba(34,197,94,0.08)'  },
];

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 50,
  background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
};

function dueDateStyle(due: string | null): { label: string; color: string; bg: string } | null {
  if (!due) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(due + 'T00:00:00');
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff < 0)  return { label: `Venció hace ${Math.abs(diff)}d`, color: '#dc2626', bg: 'rgba(220,38,38,0.1)' };
  if (diff === 0) return { label: 'Vence hoy',                     color: '#d97706', bg: 'rgba(217,119,6,0.1)' };
  if (diff <= 3)  return { label: `${diff}d restante${diff > 1 ? 's' : ''}`, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
  return { label: d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }), color: '#5A6B80', bg: 'rgba(100,116,139,0.08)' };
}

export default function TicketsPage() {
  const [tickets, setTickets]   = useState<Ticket[]>([]);
  const [clients, setClients]   = useState<ClientRow[]>([]);
  const [staff, setStaff]       = useState<StaffRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Ticket | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ticket | null>(null);
  const [form, setForm]         = useState<TicketForm>(DEFAULT_FORM);
  const [saving, setSaving]     = useState(false);
  const [filterToday, setFilterToday] = useState(false);
  const [filterMine, setFilterMine]   = useState(false);
  const [myStaffId, setMyStaffId]     = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data: t }, { data: c }, { data: s }] = await Promise.all([
      supabase.from('tickets').select('*').order('created_at', { ascending: true }),
      supabase.from('clients').select('id, name, initials, color').order('name'),
      supabase.from('staff_members').select('id, name, initials, color').order('name'),
    ]);
    setTickets(t ?? []);
    setClients(c ?? []);
    setStaff(s ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('staff_members').select('id').eq('email', user.email).single()
        .then(({ data }) => { if (data) setMyStaffId(data.id); });
    });
  }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm(DEFAULT_FORM);
    setShowModal(true);
  };

  const openEdit = (ticket: Ticket) => {
    setEditTarget(ticket);
    setForm({
      title: ticket.title,
      description: ticket.description ?? '',
      status: ticket.status,
      client_id: ticket.client_id ?? '',
      staff_member_id: ticket.staff_member_id ?? '',
      due_date: ticket.due_date ?? '',
    });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditTarget(null); };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const supabase = createClient();
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      status: form.status,
      client_id: form.client_id || null,
      staff_member_id: form.staff_member_id || null,
      due_date: form.due_date || null,
      updated_at: new Date().toISOString(),
    };

    if (editTarget) {
      await supabase.from('tickets').update(payload).eq('id', editTarget.id);
    } else {
      await supabase.from('tickets').insert(payload);
    }
    await load();
    closeModal();
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const supabase = createClient();
    await supabase.from('tickets').delete().eq('id', deleteTarget.id);
    setTickets((prev) => prev.filter((t) => t.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId as Status;
    const ticketId  = result.draggableId;
    if (result.source.droppableId === newStatus) return;

    setTickets((prev) =>
      prev.map((t) => t.id === ticketId ? { ...t, status: newStatus } : t)
    );

    const supabase = createClient();
    await supabase
      .from('tickets')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', ticketId);
  };

  const clientMap  = Object.fromEntries(clients.map((c) => [c.id, c]));
  const staffMap   = Object.fromEntries(staff.map((s) => [s.id, s]));

  const todayStr = new Date().toISOString().slice(0, 10);
  const visibleTickets = tickets.filter(t => {
    if (filterToday && t.due_date !== todayStr) return false;
    if (filterMine && t.staff_member_id !== myStaffId) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ color: '#0A0F1C' }} />
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-extrabold" style={{ color: '#0A0F1C' }}>Tickets</h1>
          <p className="text-sm mt-0.5" style={{ color: '#5A6B80' }}>Tablero de tareas del equipo</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: '#EDE9E1' }}>
            <button
              onClick={() => setFilterToday(f => !f)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{ background: filterToday ? '#0A0F1C' : 'transparent', color: filterToday ? '#ffffff' : '#5A6B80' }}
            >
              Hoy
            </button>
            <button
              onClick={() => setFilterMine(f => !f)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{ background: filterMine ? '#0A0F1C' : 'transparent', color: filterMine ? '#ffffff' : '#5A6B80' }}
            >
              <Filter size={10} /> Solo lo mío
            </button>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
            style={{ background: '#0A0F1C', color: '#ffffff' }}
          >
            <Plus size={15} />
            Nuevo ticket
          </button>
        </div>
      </div>

      {/* Kanban */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-3 gap-4 items-start">
          {COLUMNS.map((col) => {
            const colTickets = visibleTickets.filter((t) => t.status === col.key);
            return (
              <div key={col.key} className="flex flex-col gap-3">
                {/* Column header */}
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: col.bg }}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: col.color }} />
                  <span className="text-sm font-bold" style={{ color: col.color }}>{col.label}</span>
                  <span
                    className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: col.color, color: '#fff' }}
                  >
                    {colTickets.length}
                  </span>
                </div>

                <Droppable droppableId={col.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="flex flex-col gap-2 min-h-[80px] rounded-xl transition-colors p-1"
                      style={{ background: snapshot.isDraggingOver ? 'rgba(10,15,28,0.04)' : 'transparent' }}
                    >
                      {colTickets.map((ticket, index) => {
                        const client  = ticket.client_id  ? clientMap[ticket.client_id]  : null;
                        const member  = ticket.staff_member_id ? staffMap[ticket.staff_member_id] : null;
                        const dateStyle = dueDateStyle(ticket.due_date);

                        return (
                          <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                            {(drag, dragSnapshot) => (
                              <div
                                ref={drag.innerRef}
                                {...drag.draggableProps}
                                {...drag.dragHandleProps}
                                className="rounded-xl p-4 flex flex-col gap-2.5"
                                style={{
                                  background: '#ffffff',
                                  border: '1px solid rgba(10,15,28,0.08)',
                                  boxShadow: dragSnapshot.isDragging ? '0 8px 24px rgba(0,0,0,0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
                                  ...drag.draggableProps.style,
                                }}
                              >
                                {/* Title + actions */}
                                <div className="flex items-start gap-2">
                                  <p className="text-sm font-semibold flex-1 leading-snug" style={{ color: '#0A0F1C' }}>
                                    {ticket.title}
                                  </p>
                                  <div className="flex gap-1 flex-shrink-0">
                                    <button
                                      onClick={() => openEdit(ticket)}
                                      className="p-1 rounded-lg hover:bg-[rgba(10,15,28,0.07)] transition-colors"
                                    >
                                      <Pencil size={12} style={{ color: '#8A9BB0' }} />
                                    </button>
                                    <button
                                      onClick={() => setDeleteTarget(ticket)}
                                      className="p-1 rounded-lg hover:bg-red-50 transition-colors"
                                    >
                                      <Trash2 size={12} style={{ color: '#fca5a5' }} />
                                    </button>
                                  </div>
                                </div>

                                {/* Description */}
                                {ticket.description && (
                                  <p className="text-xs leading-relaxed line-clamp-2" style={{ color: '#5A6B80' }}>
                                    {ticket.description}
                                  </p>
                                )}

                                {/* Meta badges */}
                                <div className="flex flex-wrap gap-1.5">
                                  {client && (
                                    <span
                                      className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                                      style={{ background: client.color + '20', color: client.color }}
                                    >
                                      <Building2 size={10} />
                                      {client.name}
                                    </span>
                                  )}
                                  {member && (
                                    <span
                                      className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                                      style={{ background: member.color + '20', color: member.color }}
                                    >
                                      <User size={10} />
                                      {member.name.split(' ')[0]}
                                    </span>
                                  )}
                                  {dateStyle && (
                                    <span
                                      className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                                      style={{ background: dateStyle.bg, color: dateStyle.color }}
                                    >
                                      <Calendar size={10} />
                                      {dateStyle.label}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Modal crear/editar */}
      {showModal && (
        <div style={overlayStyle} onClick={closeModal}>
          <div
            className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-4"
            style={{ background: '#ffffff' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold" style={{ color: '#0A0F1C' }}>
                {editTarget ? 'Editar ticket' : 'Nuevo ticket'}
              </h2>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-[rgba(10,15,28,0.07)]">
                <X size={16} style={{ color: '#5A6B80' }} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: '#5A6B80' }}>Título *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="¿Qué hay que hacer?"
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ border: '1px solid rgba(10,15,28,0.15)', color: '#0A0F1C' }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: '#5A6B80' }}>Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  placeholder="Detalles opcionales..."
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
                  style={{ border: '1px solid rgba(10,15,28,0.15)', color: '#0A0F1C' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: '#5A6B80' }}>Estado</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ border: '1px solid rgba(10,15,28,0.15)', color: '#0A0F1C' }}
                  >
                    {COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: '#5A6B80' }}>Fecha límite</label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ border: '1px solid rgba(10,15,28,0.15)', color: '#0A0F1C' }}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: '#5A6B80' }}>Cliente</label>
                <select
                  value={form.client_id}
                  onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ border: '1px solid rgba(10,15,28,0.15)', color: '#0A0F1C' }}
                >
                  <option value="">Sin cliente</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: '#5A6B80' }}>Responsable</label>
                <select
                  value={form.staff_member_id}
                  onChange={(e) => setForm({ ...form, staff_member_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ border: '1px solid rgba(10,15,28,0.15)', color: '#0A0F1C' }}
                >
                  <option value="">Sin asignar</option>
                  {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={closeModal}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ border: '1px solid rgba(10,15,28,0.15)', color: '#5A6B80' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.title.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-opacity disabled:opacity-50"
                style={{ background: '#0A0F1C', color: '#ffffff' }}
              >
                {saving ? 'Guardando…' : editTarget ? 'Guardar cambios' : 'Crear ticket'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminación */}
      {deleteTarget && (
        <div style={overlayStyle} onClick={() => setDeleteTarget(null)}>
          <div
            className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4"
            style={{ background: '#ffffff' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-extrabold" style={{ color: '#0A0F1C' }}>¿Eliminar ticket?</h2>
            <p className="text-sm" style={{ color: '#5A6B80' }}>
              <span className="font-semibold" style={{ color: '#0A0F1C' }}>"{deleteTarget.title}"</span> será eliminado permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ border: '1px solid rgba(10,15,28,0.15)', color: '#5A6B80' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: '#dc2626', color: '#ffffff' }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

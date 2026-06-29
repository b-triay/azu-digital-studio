'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Post, PostStatus } from '@/lib/types';

const PLATFORMS = ['instagram', 'tiktok', 'youtube'] as const;
const PLATFORM_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  instagram: { bg: '#fdf0f8', text: '#c026d3', icon: '📸' },
  tiktok:    { bg: '#f0f0f0', text: '#0f0f0f', icon: '🎵' },
  youtube:   { bg: '#fff0f0', text: '#dc2626', icon: '▶'  },
};

const STATUS_STYLES: Record<PostStatus, { bg: string; text: string; label: string }> = {
  draft:            { bg: '#EDE9E1', text: '#5A6B80', label: 'Borrador' },
  pending_approval: { bg: '#fff7ed', text: '#ea580c', label: 'Pendiente' },
  approved:         { bg: '#f0fdf4', text: '#16a34a', label: 'Aprobado' },
  published:        { bg: '#eff6ff', text: '#2563eb', label: 'Publicado' },
  rejected:         { bg: '#fef2f2', text: '#dc2626', label: 'Rechazado' },
};

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

interface ContentCalendarProps {
  clientId?: string;
  onPostClick?: (post: Post) => void;
  selectedPostId?: string;
}

export function ContentCalendar({ clientId, onPostClick, selectedPostId }: ContentCalendarProps = {}) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [posts, setPosts]           = useState<Post[]>([]);

  const getWeekDays = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7) + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };

  const weekDays = getWeekDays();
  const today = new Date();

  useEffect(() => {
    if (!clientId) { setPosts([]); return; }
    const supabase = createClient();
    const start = weekDays[0];
    start.setHours(0, 0, 0, 0);
    const end = weekDays[6];
    end.setHours(23, 59, 59, 999);
    supabase
      .from('posts')
      .select('id, client_id, platform, title, caption, scheduled_for, status, created_at')
      .eq('client_id', clientId)
      .gte('scheduled_for', start.toISOString())
      .lte('scheduled_for', end.toISOString())
      .then(({ data }) => setPosts(data ?? []));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, weekOffset]);

  const getPostsForDayAndPlatform = (day: Date, platform: string) =>
    posts.filter((post) => {
      const d = new Date(post.scheduled_for);
      return (
        post.platform === platform &&
        d.getDate() === day.getDate() &&
        d.getMonth() === day.getMonth()
      );
    });

  const weekLabel = `${weekDays[0].toLocaleDateString('es-AR', { month: 'short', day: 'numeric' })} — ${weekDays[6].toLocaleDateString('es-AR', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid rgba(10,15,28,0.08)', background: '#ffffff' }}
    >
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(10,15,28,0.08)' }}>
        <div>
          <h3 className="text-sm font-bold" style={{ color: '#0A0F1C' }}>Calendario de contenido</h3>
          <p className="text-xs mt-0.5" style={{ color: '#5A6B80' }}>{weekLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset(weekOffset - 1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[rgba(10,15,28,0.07)]"
            style={{ color: '#0A0F1C' }}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-[rgba(10,15,28,0.07)]"
            style={{ color: '#0A0F1C' }}
          >
            Hoy
          </button>
          <button
            onClick={() => setWeekOffset(weekOffset + 1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[rgba(10,15,28,0.07)]"
            style={{ color: '#0A0F1C' }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="px-5 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5" style={{ borderBottom: '1px solid rgba(10,15,28,0.06)', background: '#fafbfc' }}>
        {Object.entries(STATUS_STYLES).map(([, s]) => (
          <span key={s.label} className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: '#5A6B80' }}>
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.text }} />
            {s.label}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b" style={{ borderColor: 'rgba(10,15,28,0.06)' }}>
            <div className="p-3" />
            {weekDays.map((day, i) => {
              const isToday = day.toDateString() === today.toDateString();
              return (
                <div key={i} className="p-3 text-center">
                  <div className="text-xs font-medium mb-1" style={{ color: '#5A6B80' }}>{DAY_NAMES[i]}</div>
                  <div
                    className="text-sm font-bold mx-auto w-7 h-7 rounded-full flex items-center justify-center"
                    style={{
                      background: isToday ? '#0A0F1C' : 'transparent',
                      color: isToday ? '#ffffff' : '#0A0F1C',
                    }}
                  >
                    {day.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {PLATFORMS.map((platform) => {
            const config = PLATFORM_COLORS[platform];
            return (
              <div
                key={platform}
                className="grid grid-cols-[80px_repeat(7,1fr)] border-b"
                style={{ borderColor: 'rgba(10,15,28,0.04)' }}
              >
                <div
                  className="p-3 flex items-center justify-center text-xs font-semibold capitalize"
                  style={{ background: config.bg, color: config.text, borderRight: '1px solid rgba(10,15,28,0.06)' }}
                >
                  <span>{config.icon}</span>
                </div>
                {weekDays.map((day, i) => {
                  const dayPosts = getPostsForDayAndPlatform(day, platform);
                  return (
                    <div
                      key={i}
                      className="p-2 min-h-[70px] border-r"
                      style={{ borderColor: 'rgba(10,15,28,0.04)' }}
                    >
                      {dayPosts.map((post) => {
                        const status = STATUS_STYLES[post.status];
                        const isSelected = selectedPostId === post.id;
                        return (
                          <div
                            key={post.id}
                            onClick={() => onPostClick?.(post)}
                            className="mb-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-all hover:shadow-sm text-xs"
                            style={{
                              background: isSelected ? status.text : status.bg,
                              color: isSelected ? '#ffffff' : status.text,
                              boxShadow: isSelected ? `0 0 0 2px ${status.text}` : undefined,
                            }}
                          >
                            <div className="font-semibold leading-tight truncate">{post.title}</div>
                            <div className="mt-0.5 font-medium opacity-80">{status.label}</div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

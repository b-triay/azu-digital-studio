'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
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

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'all' | 'instagram' | 'tiktok' | 'youtube'>('all');

  const getWeekDays = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    // Adjust day of week (Monday as day 0)
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
    const start = new Date(weekDays[0]);
    start.setHours(0, 0, 0, 0);
    const end = new Date(weekDays[6]);
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

  // Apply frontend search and platform filters
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (platformFilter !== 'all' && post.platform !== platformFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchTitle = post.title?.toLowerCase().includes(query);
        const matchCaption = post.caption?.toLowerCase().includes(query);
        if (!matchTitle && !matchCaption) return false;
      }
      return true;
    });
  }, [posts, platformFilter, searchQuery]);

  const getPostsForDayAndPlatform = (day: Date, platform: string) =>
    filteredPosts.filter((post) => {
      const d = new Date(post.scheduled_for);
      return (
        post.platform === platform &&
        d.getDate() === day.getDate() &&
        d.getMonth() === day.getMonth() &&
        d.getFullYear() === day.getFullYear()
      );
    });

  const weekLabel = `${weekDays[0].toLocaleDateString('es-AR', { month: 'short', day: 'numeric' })} — ${weekDays[6].toLocaleDateString('es-AR', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid rgba(10,15,28,0.08)', background: '#ffffff' }}
    >
      {/* Calendar Header Navigation */}
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(10,15,28,0.08)' }}>
        <div>
          <h3 className="text-sm font-bold" style={{ color: '#0A0F1C' }}>Calendario de contenido</h3>
          <p className="text-xs mt-0.5" style={{ color: '#5A6B80' }}>{weekLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset(weekOffset - 1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[rgba(10,15,28,0.07)] cursor-pointer"
            style={{ color: '#0A0F1C' }}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-[rgba(10,15,28,0.07)] cursor-pointer"
            style={{ color: '#0A0F1C' }}
          >
            Hoy
          </button>
          <button
            onClick={() => setWeekOffset(weekOffset + 1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[rgba(10,15,28,0.07)] cursor-pointer"
            style={{ color: '#0A0F1C' }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="px-5 py-2.5 flex flex-wrap items-center justify-between gap-3" style={{ borderBottom: '1px solid rgba(10,15,28,0.06)', background: '#F7F4EE' }}>
        <div className="flex items-center gap-2 flex-grow sm:flex-grow-0">
          <div className="relative flex items-center flex-grow sm:flex-grow-0">
            <Search size={11} className="absolute left-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar contenido..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs pl-7 pr-3 py-1.5 rounded-lg outline-none w-full sm:w-48 border bg-white"
              style={{ borderColor: 'rgba(10,15,28,0.12)', color: '#334155' }}
            />
          </div>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value as any)}
            className="text-xs px-2.5 py-1.5 rounded-lg outline-none border bg-white cursor-pointer"
            style={{ borderColor: 'rgba(10,15,28,0.12)', color: '#334155' }}
          >
            <option value="all">Todas las redes</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
          </select>
        </div>
        
        {/* Status Legends */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {Object.entries(STATUS_STYLES).map(([key, s]) => (
            <span key={key} className="flex items-center gap-1 text-[10px] font-bold" style={{ color: '#5A6B80' }}>
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.text }} />
              {s.label}
            </span>
          ))}
        </div>
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
                            <div className="font-bold leading-tight truncate">{post.title}</div>
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

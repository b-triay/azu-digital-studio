'use client';

import { useState } from 'react';
import { Check, X, MessageSquare, Camera, Play } from 'lucide-react';
import type { Post } from '@/lib/types';

const PLATFORM_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  instagram: { label: 'Instagram', color: '#c026d3', bg: '#fdf4ff', Icon: Camera },
  tiktok: { label: 'TikTok', color: '#0f0f0f', bg: '#f5f5f5', Icon: () => <span className="text-xs font-bold">TK</span> },
  youtube: { label: 'YouTube', color: '#dc2626', bg: '#fef2f2', Icon: Play },
  email: { label: 'Email', color: '#2563eb', bg: '#eff6ff', Icon: MessageSquare },
};

const MOCK_PENDING: Post[] = [
  { id: '1', client_id: 'c1', platform: 'instagram', title: 'Product launch story', caption: 'Exciting news coming your way! 🚀 New collection drops this Friday. Stay tuned for something special.', scheduled_for: new Date(Date.now() + 86400000).toISOString(), status: 'pending_approval', created_at: new Date().toISOString() },
  { id: '5', client_id: 'c1', platform: 'tiktok', title: 'Trending audio reel', caption: 'Jumping on this trend for you! We put our spin on the viral sound 🎵', scheduled_for: new Date(Date.now() + 86400000 * 5).toISOString(), status: 'pending_approval', created_at: new Date().toISOString() },
  { id: '7', client_id: 'c1', platform: 'youtube', title: 'Monthly roundup video', caption: 'A recap of everything we accomplished this month — results, wins, and what\'s coming next.', scheduled_for: new Date(Date.now() + 86400000 * 2).toISOString(), status: 'pending_approval', created_at: new Date().toISOString() },
];

export function ApprovalList() {
  const [posts, setPosts] = useState(MOCK_PENDING);
  const [actionComment, setActionComment] = useState<Record<string, string>>({});

  const handleAction = (postId: string, action: 'approved' | 'rejected') => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl"
          style={{ background: '#f0fdf4' }}
        >
          ✅
        </div>
        <h3 className="text-base font-bold mb-1" style={{ color: '#0A0F1C' }}>All caught up!</h3>
        <p className="text-sm" style={{ color: '#5A6B80' }}>No posts pending your approval.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {posts.map((post) => {
        const config = PLATFORM_CONFIG[post.platform] ?? PLATFORM_CONFIG.instagram;
        const { Icon } = config;
        const scheduledDate = new Date(post.scheduled_for).toLocaleDateString('en', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });

        return (
          <div
            key={post.id}
            className="rounded-2xl overflow-hidden transition-all duration-200"
            style={{
              border: '1px solid rgba(10,15,28,0.08)',
              background: '#ffffff',
              boxShadow: '0 2px 8px rgba(10,15,28,0.05)',
            }}
          >
            <div className="p-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: config.bg, color: config.color }}
                  >
                    <Icon size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold" style={{ color: '#0A0F1C' }}>{post.title}</h4>
                    <p className="text-xs mt-0.5" style={{ color: '#5A6B80' }}>
                      {config.label} · Scheduled for {scheduledDate}
                    </p>
                  </div>
                </div>
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{ background: '#fff7ed', color: '#ea580c' }}
                >
                  Needs review
                </span>
              </div>

              {/* Caption */}
              <div
                className="px-4 py-3 rounded-xl mb-4 text-sm leading-relaxed"
                style={{ background: '#F7F4EE', color: '#334155' }}
              >
                {post.caption}
              </div>

              {/* Placeholder thumbnail */}
              <div
                className="rounded-xl mb-4 flex items-center justify-center"
                style={{
                  height: '120px',
                  background: 'linear-gradient(135deg, rgba(10,15,28,0.06) 0%, rgba(184,151,108,0.06) 100%)',
                  border: '1px dashed rgba(10,15,28,0.15)',
                }}
              >
                <p className="text-xs font-medium" style={{ color: '#5A6B80' }}>Media preview · Replace with actual asset</p>
              </div>

              {/* Comment field */}
              <textarea
                placeholder="Optional comment..."
                value={actionComment[post.id] ?? ''}
                onChange={(e) => setActionComment((prev) => ({ ...prev, [post.id]: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl text-sm resize-none outline-none transition-all mb-4"
                style={{
                  background: '#F7F4EE',
                  border: '1.5px solid rgba(10,15,28,0.1)',
                  color: '#334155',
                  fontFamily: 'inherit',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#0A0F1C')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(10,15,28,0.1)')}
              />

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleAction(post.id, 'approved')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
                  style={{
                    background: '#f0fdf4',
                    color: '#16a34a',
                    border: '1.5px solid #bbf7d0',
                  }}
                >
                  <Check size={14} strokeWidth={2.5} />
                  Approve
                </button>
                <button
                  onClick={() => handleAction(post.id, 'rejected')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
                  style={{
                    background: '#fef2f2',
                    color: '#dc2626',
                    border: '1.5px solid #fecaca',
                  }}
                >
                  <X size={14} strokeWidth={2.5} />
                  Request changes
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

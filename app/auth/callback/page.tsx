'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

// Handles both implicit flow (#access_token=...) and PKCE flow (?code=...).
// next-intl middleware is excluded from /auth/* paths via proxy.ts matcher.
export default function AuthCallbackPage() {
  useEffect(() => {
    const supabase = createClient();
    const search   = new URLSearchParams(window.location.search);
    const hash     = new URLSearchParams(window.location.hash.substring(1));

    const next = search.get('next') ?? '/es/portal/dashboard';
    const code = search.get('code');
    const accessToken  = hash.get('access_token');
    const refreshToken = hash.get('refresh_token');

    if (accessToken && refreshToken) {
      // Implicit flow — tokens in URL fragment
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          window.location.href = error ? '/es/portal/login?error=link_expired' : next;
        });
    } else if (code) {
      // PKCE flow — code in query params
      supabase.auth
        .exchangeCodeForSession(code)
        .then(({ error }) => {
          window.location.href = error ? '/es/portal/login?error=link_expired' : next;
        });
    } else {
      window.location.href = '/es/portal/login?error=link_expired';
    }
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a2e3f 0%, #294864 100%)',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ textAlign: 'center', color: 'rgba(215,224,231,0.8)', fontSize: 14 }}>
        <div
          style={{
            width: 32,
            height: 32,
            border: '3px solid rgba(244,162,97,0.3)',
            borderTopColor: '#f4a261',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 12px',
          }}
        />
        Validando…
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

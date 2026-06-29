'use client';

import { useState } from 'react';
import { StaffSidebar } from '@/components/portal/StaffSidebar';
import { TopBar } from '@/components/portal/TopBar';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F7F4EE' }}>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <StaffSidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed left-0 top-0 bottom-0 z-50 lg:hidden">
            <StaffSidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onMenuToggle={() => setSidebarOpen(true)} userName="Staff" />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

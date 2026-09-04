'use client';

import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopNavbar } from '@/components/layout/TopNavbar';
import { AppProvider } from '@/context/AppContext';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col pl-64 min-w-0">
          <TopNavbar />
          <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </AppProvider>
  );
}

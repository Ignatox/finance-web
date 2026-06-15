'use client';

import { ReactNode } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full w-full overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <MobileNav />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

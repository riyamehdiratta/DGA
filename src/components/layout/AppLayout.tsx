import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileTopBar } from '@/components/layout/MobileTopBar';

export function AppLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen print:block print:min-h-0">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar title="DGA Analysis System" onOpenMenu={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto print:overflow-visible print:h-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

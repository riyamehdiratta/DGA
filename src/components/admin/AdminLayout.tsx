import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { MobileTopBar } from '@/components/layout/MobileTopBar';

export function AdminLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen print:block print:min-h-0">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar title="Admin Panel" onOpenMenu={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto print:overflow-visible print:h-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

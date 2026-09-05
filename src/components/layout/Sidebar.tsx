import { NavLink } from 'react-router-dom';
import { useAuth } from '@/context';
import type { NavItem } from '@/types';

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/' },
  { label: 'Transformers', path: '/transformers' },
  { label: 'New Analysis', path: '/analysis/new' },
  { label: 'Analysis History', path: '/analysis/history' },
  { label: 'Reports', path: '/reports' },
  { label: 'Learn', path: '/learn' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <>
      {isOpen && (
        <div
          className="no-print fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`no-print fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-gray-300 bg-gray-50 transition-transform duration-200 ease-in-out md:static md:z-auto md:w-56 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-start justify-between border-b border-gray-300 px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              DTL Laboratory
            </p>
            <h1 className="mt-1 text-sm font-bold leading-tight text-gray-900">
              DGA Analysis System
            </h1>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-gray-500 hover:text-gray-900 md:hidden"
            aria-label="Close menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="h-5 w-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          <ul>
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `block border-l-2 px-4 py-2.5 text-sm ${
                      isActive
                        ? 'border-gray-800 bg-white font-medium text-gray-900'
                        : 'border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {user.role === 'ADMIN' && (
          <div className="border-t border-gray-300 py-2">
            <NavLink
              to="/admin"
              onClick={onClose}
              className={({ isActive }) =>
                `block border-l-2 px-4 py-2.5 text-sm ${
                  isActive
                    ? 'border-gray-800 bg-white font-medium text-gray-900'
                    : 'border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              Admin Panel
            </NavLink>
          </div>
        )}

        <div className="border-t border-gray-300 px-4 py-3">
          <p className="truncate text-xs text-gray-700" title={user.email}>
            {user.email}
          </p>
          <button
            type="button"
            onClick={() => void logout()}
            className="mt-1 cursor-pointer text-xs text-gray-500 underline hover:text-gray-900"
          >
            Log out
          </button>
          <p className="mt-2 text-xs text-gray-500">IEEE C57.104-2019</p>
          <p className="text-xs text-gray-400">v1.0.0</p>
        </div>
      </aside>
    </>
  );
}

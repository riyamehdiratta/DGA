interface MobileTopBarProps {
  title: string;
  onOpenMenu: () => void;
}

export function MobileTopBar({ title, onOpenMenu }: MobileTopBarProps) {
  return (
    <header className="no-print flex items-center gap-3 border-b border-gray-300 bg-gray-50 px-4 py-3 md:hidden">
      <button
        type="button"
        onClick={onOpenMenu}
        className="cursor-pointer text-gray-700 hover:text-gray-900"
        aria-label="Open menu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="h-6 w-6"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
        </svg>
      </button>
      <h1 className="text-sm font-bold text-gray-900">{title}</h1>
    </header>
  );
}

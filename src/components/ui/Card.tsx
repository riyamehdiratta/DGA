import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export function Card({ title, children, className = '', action }: CardProps) {
  return (
    <section className={`border border-gray-300 bg-white ${className}`}>
      {title && (
        <header className="flex items-center justify-between border-b border-gray-300 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

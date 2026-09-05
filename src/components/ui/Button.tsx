import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center px-4 py-2 text-sm font-medium border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-gray-800 text-white border-gray-800 hover:bg-gray-700',
    secondary: 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50',
    danger: 'bg-white text-red-700 border-red-300 hover:bg-red-50',
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

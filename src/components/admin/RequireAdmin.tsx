import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context';
import type { ReactNode } from 'react';

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  if (user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

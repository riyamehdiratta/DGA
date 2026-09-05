import { apiClient } from '@/api/client';
import type { AuthUser, UserRole } from '@/types';

export interface CreateUserPayload {
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserPayload {
  email?: string;
  role?: UserRole;
  isActive?: boolean;
}

export async function fetchUsers(): Promise<AuthUser[]> {
  return apiClient.get<AuthUser[]>('/admin/users');
}

export async function createUser(input: CreateUserPayload): Promise<AuthUser> {
  return apiClient.post<AuthUser>('/admin/users', input);
}

export async function updateUser(id: string, input: UpdateUserPayload): Promise<AuthUser> {
  return apiClient.put<AuthUser>(`/admin/users/${id}`, input);
}

export async function resetUserPassword(id: string, password: string): Promise<AuthUser> {
  return apiClient.post<AuthUser>(`/admin/users/${id}/reset-password`, { password });
}

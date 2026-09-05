import { apiClient } from './client';
import type { AuthUser } from '@/types';

export async function loginApi(email: string, password: string): Promise<AuthUser> {
  return apiClient.post<AuthUser>('/auth/login', { email, password });
}

export interface SignupPayload {
  email: string;
  password: string;
  designation: string;
  substationType: string;
  substationArea: string;
}

export async function signupApi(payload: SignupPayload): Promise<AuthUser> {
  return apiClient.post<AuthUser>('/auth/signup', payload);
}

export async function logoutApi(): Promise<void> {
  await apiClient.post('/auth/logout', {});
}

export async function fetchMeApi(): Promise<AuthUser> {
  return apiClient.get<AuthUser>('/auth/me');
}

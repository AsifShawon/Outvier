import api from '../api';
import { LoginPayload, SignupPayload, AuthResponse } from '@/types/auth';
import { ApiResponse } from '@/types/api';

export const authApi = {
  signup: (data: SignupPayload): Promise<{ data: ApiResponse<AuthResponse> }> =>
    api.post('/auth/signup', data),

  login: (data: LoginPayload): Promise<{ data: ApiResponse<AuthResponse> }> =>
    api.post('/auth/login', data),

  logout: (): Promise<{ data: ApiResponse<void> }> =>
    api.post('/auth/logout'),

  getMe: (): Promise<{ data: ApiResponse<{ _id: string; email: string; name: string; role: string }> }> => 
    api.get('/auth/me'),
};

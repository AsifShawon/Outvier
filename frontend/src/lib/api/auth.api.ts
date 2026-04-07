import api from '../api';
import { LoginPayload, AuthResponse } from '@/types/auth';
import { ApiResponse } from '@/types/api';

export const authApi = {
  login: (data: LoginPayload): Promise<{ data: ApiResponse<AuthResponse> }> =>
    api.post('/auth/login', data),

  getMe: () => api.get('/auth/me'),
};

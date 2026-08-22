import api from '../api';
import {
  LoginPayload,
  SignupPayload,
  AuthResponse,
  AuthUser,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from '@/types/auth';
import { ApiResponse } from '@/types/api';

export const authApi = {
  signup: (data: SignupPayload): Promise<{ data: ApiResponse<AuthResponse> }> =>
    api.post('/auth/signup', data),

  login: (data: LoginPayload): Promise<{ data: ApiResponse<AuthResponse> }> =>
    api.post('/auth/login', data),

  refresh: (): Promise<{ data: ApiResponse<AuthResponse> }> =>
    api.post('/auth/refresh'),

  logout: (): Promise<{ data: ApiResponse<void> }> =>
    api.post('/auth/logout'),

  logoutAll: (): Promise<{ data: ApiResponse<void> }> =>
    api.post('/auth/logout-all'),

  getMe: (): Promise<{ data: ApiResponse<AuthUser> }> =>
    api.get('/auth/me'),

  forgotPassword: (data: ForgotPasswordPayload): Promise<{ data: ApiResponse<{ resetToken: string }> }> =>
    api.post('/auth/forgot-password', data),

  resetPassword: (data: ResetPasswordPayload): Promise<{ data: ApiResponse<void> }> =>
    api.post('/auth/reset-password', data),
};

export interface AuthUser {
  _id: string;
  name: string;
  username?: string;
  email: string;
  role: 'user' | 'admin';
  permissions?: string[];
  status?: 'active' | 'inactive';
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: AuthUser;
  csrfToken?: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

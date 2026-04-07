export interface AuthUser {
  _id: string;
  username: string;
  role: 'admin';
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

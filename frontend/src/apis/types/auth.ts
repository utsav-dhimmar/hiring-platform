export interface UserRead {
  id: string;
  full_name: string | null;
  email: string;
  is_active: boolean;
  role_id: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface UserCreate {
  email: string;
  password?: string;
  full_name?: string | null;
  is_active?: boolean;
  role_id?: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_at: string;
  refresh_token_expires_at: string;
  user: UserRead;
}

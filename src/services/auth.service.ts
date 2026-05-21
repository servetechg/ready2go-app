import type { ForgotPasswordPayload, LoginCredentials, SignupCredentials, User } from '@/types/auth';

interface AuthResponse {
  user: User;
  token: string;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Mock auth service — replace with apiClient calls when backend is ready */
export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    await delay(800);
    if (credentials.email === 'demo@ready2go.com' && credentials.password === 'password') {
      return {
        user: {
          id: '1',
          email: credentials.email,
          firstName: 'Demo',
          lastName: 'User',
        },
        token: 'mock-jwt-token',
      };
    }
    return {
      user: {
        id: Date.now().toString(),
        email: credentials.email,
        firstName: 'Ready2Go',
        lastName: 'User',
      },
      token: 'mock-jwt-token',
    };
  },

  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    await delay(1000);
    return {
      user: {
        id: Date.now().toString(),
        email: credentials.email,
        firstName: credentials.firstName,
        lastName: credentials.lastName,
      },
      token: 'mock-jwt-token',
    };
  },

  async forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
    await delay(600);
    if (!payload.email) {
      throw new Error('Email is required');
    }
  },
};

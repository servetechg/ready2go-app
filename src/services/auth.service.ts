import type {
  AuthResponse,
  ForgotPasswordPayload,
  LoginCredentials,
  ResendOtpPayload,
  SignupCredentials,
  VerifyOtpPayload,
} from '@/types/auth';

/** Mock OTP for development — replace with backend-sent codes */
export const MOCK_OTP_CODE = '123456';

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

  async sendSignupOtp(_payload: ResendOtpPayload): Promise<void> {
    await delay(600);
  },

  async verifyOtp(
    payload: VerifyOtpPayload,
    pendingAuth: AuthResponse | null,
  ): Promise<AuthResponse> {
    await delay(800);
    if (payload.code !== MOCK_OTP_CODE) {
      throw new Error('Invalid verification code');
    }
    if (!pendingAuth || pendingAuth.user.email !== payload.email) {
      throw new Error('Verification session expired. Please sign up again.');
    }
    return pendingAuth;
  },

  async forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
    await delay(600);
    if (!payload.email) {
      throw new Error('Email is required');
    }
  },
};

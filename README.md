# Ready2Go — Emergency Registration App

Production-ready Expo + TypeScript mobile app for emergency household registration.

## Tech Stack

- **Expo SDK 55** + React Native
- **Redux Toolkit** + redux-persist (AsyncStorage)
- **React Navigation** (native stack)
- **React Hook Form** + **Zod**
- Reusable component architecture

## Getting Started

```bash
npm install
npm start
```

Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_BASE_URL` (must include `/api/v1`).

Default dev: `http://localhost:3000/api/v1` — use your machine LAN IP on a physical device.

## App Flow

1. **Welcome** → Sign up or Sign in
2. **Auth** → Signup → OTP → Login / Forgot password → OTP → Reset password
3. **Onboarding** (7 steps, local Redux) → Finish submits `POST /profile/complete`
4. **Dashboard** → Profile summary

## Project Structure

```
src/
├── components/     # common, form, layout, ui
├── screens/        # auth, onboarding, dashboard
├── navigation/     # Auth, Onboarding, Main, Root navigators
├── redux/          # auth, registration, ui slices
├── services/       # API-ready auth & registration services
├── validations/    # Zod schemas
├── theme/          # colors, typography, spacing
└── types/          # TypeScript interfaces
```

## API

Mobile REST API v1 (`/api/v1/auth/*`, `/users/me`, `/profile/complete`). Production base: `https://earthquickalert.vercel.app/api/v1`

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run android` | Run on Android |
| `npm run ios` | Run on iOS |
| `npm run lint` | Run ESLint |

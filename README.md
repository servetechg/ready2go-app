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

Copy `.env.example` to `.env` and set your API URL when connecting a backend.

## App Flow

1. **Welcome** → Sign up or Sign in
2. **Auth** → Login / Signup / Forgot password (mock API)
3. **Onboarding** (7 steps) → Address → Household → ADA → Medical → Pets → Transport → Lodging
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

## Demo Login

Any email/password works (mock auth). Example: `demo@ready2go.com` / `password`

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run android` | Run on Android |
| `npm run ios` | Run on iOS |
| `npm run lint` | Run ESLint |

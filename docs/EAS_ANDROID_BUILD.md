# EAS Android build — maps & push

## Environment variables (Expo dashboard)

Set for **preview** (and **production**) before `eas build`:

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_API_BASE_URL` | Backend URL (not `localhost` on a phone) |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | JS + native maps |
| `GOOGLE_MAPS_API_KEY` | Same mobile key — baked into AndroidManifest at build time |
| `EXPO_PUBLIC_APP_ENV` | `development` or `production` |
| `EXPO_PUBLIC_PROFILE_REMINDER_SECONDS` | Optional test delay (e.g. `60`) |

Rebuild after changing any variable.

---

## Blank map (beige tiles, Google logo only)

Usually the **API key restriction** does not match the EAS signing certificate.

1. Get the **SHA-1** fingerprint for your EAS Android keystore:

   ```powershell
   cd c:\projects\ready2go-app
   eas credentials -p android
   ```

   Copy the **SHA-1** for the build profile you use (`preview`).

2. In [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → your **mobile** API key:

   - Application restriction: **Android apps**
   - Package name: `com.ready2go.app`
   - SHA-1: paste from step 1

3. Enable APIs on the same project:

   - Maps SDK for Android
   - Places API
   - Geocoding API

4. Run a **new** EAS build:

   ```powershell
   eas build --platform android --profile preview
   ```

---

## Profile reminder push when app is closed

- **Local reminder:** scheduled on the device after OTP verify (needs notification permission).
- **Server reminder:** backend cron + Expo push token (set up [cron-job.org](https://cron-job.org) for Vercel Hobby).

Test local reminder:

1. Set `EXPO_PUBLIC_PROFILE_REMINDER_SECONDS=60` in EAS env.
2. Rebuild and install APK.
3. Sign up → verify OTP → allow notifications → leave onboarding incomplete.
4. Force-close the app, wait 60s — notification should appear.

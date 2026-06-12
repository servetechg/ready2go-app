# EAS Android build — maps & push

## Environment variables (Expo dashboard)

Set for **preview** before `eas build --platform android --profile preview`:

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_API_BASE_URL` | `https://earthquickalert.vercel.app/api/v1` (not localhost) |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Mobile Google key |
| `GOOGLE_MAPS_API_KEY` | Same key — native Android manifest |
| `EXPO_PUBLIC_APP_ENV` | `production` |
| `EXPO_PUBLIC_PROFILE_REMINDER_SECONDS` | `60` for quick push testing |

Rebuild after changing any variable.

---

## Blank map fix

The app now uses **OpenStreetMap tiles** as a fallback when Google Maps SDK auth fails, so the map should show roads/terrain even before SHA-1 is configured.

For **Google traffic, heatmap, and Places** to work fully, still configure SHA-1:

1. Get EAS signing SHA-1:

   ```powershell
   cd c:\projects\ready2go-app
   eas credentials -p android
   ```

   Select **preview** profile → copy **SHA-1**.

2. [Google Cloud Console](https://console.cloud.google.com/) → Credentials → your **mobile** API key:

   - Application restriction: **Android apps**
   - Package: `com.ready2go.app`
   - SHA-1: from step 1

3. Enable: **Maps SDK for Android**, Places API, Geocoding API, billing enabled.

4. Rebuild APK.

---

## Profile reminder push (app closed)

After OTP verify the app:

1. Asks for notification permission
2. Schedules a **local** notification (works when app is closed)
3. Registers **Expo push token** with backend (server push needs cron)

**Test:**

1. `EXPO_PUBLIC_PROFILE_REMINDER_SECONDS=60` in EAS env
2. New build + install
3. Sign up → verify OTP → tap **Allow** on notifications
4. Do not finish onboarding → force-close app
5. Wait 60 seconds

If no notification:

- Android Settings → Apps → Ready2Go → Notifications → **Allowed**
- Android Settings → Apps → Ready2Go → Alarms & reminders → **Allowed** (Android 12+)
- Disable battery optimization for Ready2Go

**Server push** (backup): set up [cron-job.org](https://cron-job.org) to call  
`GET https://earthquickalert.vercel.app/api/v1/cron/profile-incomplete-reminders` every 5 minutes with `Authorization: Bearer YOUR_CRON_SECRET`.

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

Maps use **Google Maps** only. Configure SHA-1 so tiles load on release APKs:

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
3. Registers **Expo push token** with backend (server push needs cron + FCM)

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

---

## Disaster survey OS notifications (required)

In-app inbox notifications work without FCM. **Remote Expo push** (banner when app is closed) needs Android FCM V1 credentials.

### Why survey “push” was missing

- Profile incomplete reminder uses a **local** scheduled notification.
- Survey dispatch uses **remote Expo push**, which needs:
  1. A saved `expoPushToken` on the user in MongoDB
  2. **FCM V1** credentials on the EAS project
  3. `google-services.json` in the Android app

Until FCM is configured, the app now also **mirrors new survey inbox items into local OS notifications** while the app can poll (foreground / briefly background). For closed-app remote delivery, complete FCM setup below and rebuild.

### FCM V1 setup (Android)

1. Create/open a Firebase project → add Android app with package `com.ready2go.app`
2. Download **google-services.json** into `ready2go-app/google-services.json`
3. Firebase Console → Project settings → Service accounts → **Generate new private key** (JSON)
4. Upload that key to Expo:

   ```powershell
   cd c:\projects\ready2go-app
   eas credentials
   ```

   Android → your build profile → **FCM V1 service account key** → upload JSON

5. Rebuild the APK (`eas build --platform android --profile preview` or `share`)
6. Install, log in, allow notifications — token should save to the API
7. Admin: Create & dispatch a survey — toast should show `1 push` (not `0 push`)

Docs: [Expo FCM credentials](https://docs.expo.dev/push-notifications/fcm-credentials/)

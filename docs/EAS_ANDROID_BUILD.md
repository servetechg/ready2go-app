# EAS Android build, OTA updates, maps & push

## Client updates without reinstalling the APK

The app now uses **EAS Update**. The `preview` APK is attached to the `preview`
channel; Play Store builds use the separate `production` channel.

### One-time rollout

Because `expo-updates` is a native dependency, existing APKs cannot receive
updates. Build and send **one new APK** to the client:

```powershell
cd C:\projects\ready2go-app
eas build --platform android --profile preview
```

After the client installs that APK once, compatible JavaScript, TypeScript,
styles, and image changes can be delivered without another APK:

```powershell
npm run update:preview -- --message "Describe the client update"
```

When the client next opens Ready2Go, the update downloads in the background.
The app displays **Ready2Go update ready**; tapping **Restart now** applies it.

Publish to `production` only for Play Store users:

```powershell
npm run update:production -- --message "Describe the production update"
```

### When a new APK/AAB is still required

Create a new native build when changing native dependencies, Expo SDK,
permissions, plugins, `app.json` native settings, notification credentials, or
Android/iOS code. Before that build, increase `expo.version` (for example
`1.0.0` → `1.1.0`) because OTA compatibility uses the app-version runtime.

Never publish test work to `production`. Test it on `preview` first. EAS Update
also supports rollout percentages and rollback from the Expo dashboard.

## Environment variables (Expo dashboard)

Set for **preview** before `eas build --platform android --profile preview`:

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_API_BASE_URL` | `https://earthquickalert.vercel.app/api/v1` (not localhost) |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Places/Geocoding key — registration address search only |
| `GOOGLE_MAPS_API_KEY` | Same key — native Android manifest |
| `EXPO_PUBLIC_APP_ENV` | `production` |
| `EXPO_PUBLIC_USE_RN_FETCH` | `1` — required so media uploads keep working (see below) |
| `EXPO_PUBLIC_PROFILE_REMINDER_SECONDS` | `60` for quick push testing |

### `EXPO_PUBLIC_USE_RN_FETCH`

SDK 56 made the spec-compliant `expo/fetch` the default `globalThis.fetch`. Media
uploads in this app append React Native file objects (`{ uri, name, type }`) to
`FormData`, a non-standard shape that only React Native's own `fetch` resolves.
Without this variable, avatar, document, survey, and citizen-report uploads
serialize as `[object Object]` and silently fail.

Removing it later requires migrating those uploads to `Blob`/`File` first.

Publish an EAS update after changing bundle-time `EXPO_PUBLIC_*` values. Rebuild
after changing native secrets/configuration such as `GOOGLE_MAPS_API_KEY`.

---

## Dashboard map (OpenStreetMap, no API key)

The Home / dashboard map used to render through `react-native-maps`, which sits on top of the
**Google Maps SDK for Android** even when the tiles come from OpenStreetMap. Expo Go supplies
its own Google key, so the map looked fine in development and turned into a blank grey surface
in every standalone APK, where the project's own `com.google.android.geo.API_KEY` was used.

It now runs on Leaflet inside a `react-native-webview` (`src/components/dashboard/OsmMapView.tsx`),
so there is **no Google dependency and nothing to configure**:

- Tiles: CARTO's OpenStreetMap raster CDN (`src/constants/openStreetMap.ts`).
- Leaflet's JS/CSS and the Ionicons marker glyphs are vendored into
  `src/vendor/leafletBundle.json` and `src/vendor/mapPinIcons.json` and inlined into the page,
  so the WebView never fetches a script at runtime. Regenerate them after upgrading Leaflet or
  Ionicons with `node scripts/build-leaflet-bundle.js` and `node scripts/build-map-icons.js`.
- `node scripts/preview-osm-map.js` serves the exact same page with sample markers on
  `http://localhost:8099` — pair it with `adb reverse tcp:8099 tcp:8099` to open it in an
  emulator browser.

The Google key is still read for the **registration address search** (Places / Geocoding web
services in `src/services/places.service.ts`). Those are plain HTTPS calls and are unrelated to
map rendering; leaving the key blank only disables address autocomplete.

### If the map is blank

The only remaining causes are network-level:

```powershell
adb logcat -s "chromium:V" "ReactNativeJS:V"
```

Look for tile requests failing — the device must reach `basemaps.cartocdn.com`.

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

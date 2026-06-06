# Home Tab API Integration

This document describes the Home tab integration with the backend `/api/v1` dashboard API. The UI layout and components are unchanged; only the data source moved from mocks to live API responses.

---

## Overview

| Before | After |
|--------|-------|
| `loadEmergencyDashboard` + `buildMockEmergencyDashboard` | `fetchHome` → `GET /dashboard/home` |
| `MOCK_WEATHER` default on weather card | `home.weather` from API (placeholder when `null`) |
| `MOCK_ALERTS` for Home preview | `home.recentAlerts` (mapped client-side) |
| `PREPAREDNESS_CATEGORIES` constants | `home.preparednessCategories` from API |
| Static banner copy | `home.status.headline` / `home.status.summary` |
| Mock cloudy/blue_sky toggle | `home.mode` (`blue_sky` \| `cloudy`) |
| Local unread count from mock alerts | `home.badges.unreadAlerts` |

---

## Prerequisites

1. User logged in with a valid Bearer token (`auth.token` in Redux).
2. `user.profileComplete === true` (enforced by `RootNavigator` before Main app).
3. `EXPO_PUBLIC_API_BASE_URL` set (e.g. `http://192.168.x.x:3000/api/v1` on a physical device).
4. Profile address completed via onboarding `POST /profile/complete`.

---

## Files Added

### `src/services/dashboard.service.ts`

Service layer for dashboard endpoints:

- **`getHome(token, query?)`** — `GET /dashboard/home` with optional `include`, `newsLimit`, `alertsLimit`.
- **`getBadges(token)`** — `GET /dashboard/badges` (available for future 60s polling; Home uses `home.badges` today).

### `src/utils/dashboardMappers.ts`

Maps API shapes to existing UI types (no component changes required):

| Mapper | Purpose |
|--------|---------|
| `mapHomeAlertToWeatherAlert` | `MobileWeatherAlert` → `WeatherAlert` (formats `issuedAgo`, `expires` client-side) |
| `mapHomeNewsToEmergencyNewsItem` | Dashboard news → `EmergencyNewsItem` for `BlueSkyNewsFeed` |
| `mapPreparednessCategory` | API category → `PreparednessCategory` (icon aliases) |

### `src/hooks/useHomeDashboard.ts`

Home screen lifecycle hook:

- **`useFocusEffect`** — dispatches `fetchHome()` when the tab is focused and data is missing or older than 5 minutes.
- **Pull-to-refresh** — calls `reload()` → `fetchHome()`.
- Exposes `home`, `emergency`, `loading`, `error`, `isCloudy`, `mode`.

### `docs/HOME_TAB_INTEGRATION.md`

This file.

---

## Files Modified

### Types — `src/types/dashboard.ts`

Added API-aligned types:

- `DashboardHomeResponse`
- `DashboardStatus`
- `MobileWeatherAlert`
- `MobilePreparednessCategory`
- `DashboardHomeNewsItem`

`PreparednessCategory.icon` now accepts API icon strings in addition to the fixed union.

### Utils — `src/utils/formatTimestamp.ts`

- **`formatIssuedAgo(iso)`** — e.g. `"Issued 12 min ago"` (API sends `issuedAt`, not `issuedAgo`).
- **`formatExpiresLabel(expiresAt?)`** — e.g. `"EXPIRES: Jun 4, 3:00 PM"`.

### Emergency service — `src/services/emergency.service.ts`

Replaced mock-only implementation with real endpoints (used when `home.mode === 'cloudy'`):

- **`fetchEmergencyMap(token)`** — `GET /emergency/map`
- **`fetchEmergencyIncidents(token)`** — `GET /emergency/incidents`

Map/incident fetches are best-effort (`.catch`); Home still renders if they fail.

### Redux — `src/redux/slices/dashboardSlice.ts`

**New state:**

| Field | Source |
|-------|--------|
| `home` | `DashboardHomeResponse \| null` |
| `homeLoading` / `homeError` | `fetchHome` thunk |
| `lastFetchedAt` | Cache TTL for focus refresh |
| `unreadAlertsCount` | `home.badges.unreadAlerts` |

**Removed from Home flow:**

- `disruptionModeOverride` (dev-only mock toggle)
- Mock `emergency` initial state (`buildMockEmergencyDashboard('cloudy')`)

**Thunk: `fetchHome`**

1. Reads `auth.token`.
2. Calls `GET /dashboard/home?newsLimit=4&alertsLimit=2`.
3. If `mode === 'cloudy'`, parallel fetch of `/emergency/map` and `/emergency/incidents`.
4. On 401: dispatches `refreshSession`, retries once.
5. On fulfill: sets `home`, `emergency`, `unreadAlertsCount`, `lastFetchedAt`.
6. On logout: resets dashboard state.

**Selectors:**

- `selectDashboardMode` → `home?.mode ?? 'blue_sky'`
- `selectUnreadAlertCount` → `unreadAlertsCount`
- `selectPreparednessCategories` → mapped `home.preparednessCategories`

**Note:** `dashboard.alerts` still seeds from `MOCK_ALERTS` for the **Alerts tab** until that tab’s API plan is implemented.

### Hooks — `src/hooks/useEmergencyDashboard.ts`

Now reads from Redux home/emergency state and uses `fetchHome` for refresh (used by `EmergencyNewsScreen`).

### Components

| Component | Change |
|-----------|--------|
| `BlueSkyStatusBanner` | Optional `status` prop (`headline`, `summary`, `updatedAt`) |
| `DisruptionStatusBanner` | Optional `status` prop + existing CTA |
| `WeatherSummaryCard` | No mock default; shows placeholder when `weather` is `null` |
| `PreparednessCategoryCard` | Dynamic Ionicons from API icon strings |
| `DashboardTabBar` | Badge on Alerts tab from `selectUnreadAlertCount` |

### Screens

| Screen | Change |
|--------|--------|
| `HomeScreen` | Uses `useHomeDashboard`; wires all sections to `home` state; client-side search on news/alerts/preparedness; full-screen error + retry |
| `AlertsScreen` | Pull-to-refresh calls `fetchHome` (alerts list still mock until Alerts tab plan) |
| `EmergencyNewsScreen` | Unchanged API surface; news comes from `fetchHome` via `emergency.news` |

---

## API → UI Mapping

### Banner (`home.mode` + `home.status`)

| API | UI |
|-----|-----|
| `mode: 'blue_sky'` | `BlueSkyStatusBanner` |
| `mode: 'cloudy'` | `DisruptionStatusBanner` + map + incidents + Active Alerts |
| `status.headline` | Banner title |
| `status.summary` | Banner subtitle |
| `status.updatedAt` | “Updated …” (relative time) |

### News (`home.news`)

Rendered by `BlueSkyNewsFeed` (max 4 on Home, “View all” → `EmergencyNewsScreen`).

### Weather (`home.weather`)

Rendered by `WeatherSummaryCard`. When `null`, shows “Complete your address in Profile” with link to Profile tab.

### Active Alerts (`home.recentAlerts`)

Shown only when `mode === 'cloudy'`. Mapped to `AlertCard` via `mapHomeAlertToWeatherAlert`.

### Preparedness (`home.preparednessCategories`)

Top categories in the grid; tap navigates to `PreparednessCategoryScreen`.

### Tab badge

`home.badges.unreadAlerts` → `unreadAlertsCount` → Alerts tab badge + top-bar notification dot.

---

## Client-side search

Home search (top bar) filters in memory:

- `home.news`
- `home.recentAlerts`
- `home.preparednessCategories`

No dedicated Home search API in v1.

---

## Error handling

| Condition | UX |
|-----------|-----|
| 401 | Refresh token via `refreshSession`, retry once |
| Initial load failure | Full-screen “Could not load dashboard” + Try again |
| `weather === null` | Weather card placeholder + Profile link |
| Empty `recentAlerts` (cloudy) | “No active alerts in your registered zones.” |
| Map/incidents fetch fails | News/weather/alerts still show; map block hidden |

---

## What was NOT changed (out of scope)

- **Alerts tab** full list — still uses `MOCK_ALERTS` until Alerts tab integration.
- **Weather detail screen** — still uses `MOCK_WEATHER` + registration address.
- **Preparedness tab** task content — still static constants.
- **`GET /dashboard/badges` polling** — optional; badge updates on each `fetchHome`.

---

## Testing checklist

1. Log in and complete profile with a US address.
2. Open Home — verify `GET /dashboard/home` returns 200.
3. Pull-to-refresh — timestamps and data update.
4. With active NWS HIGH/EXTREME alerts — `mode` should be `cloudy`, map/incidents load.
5. Tab badge count matches `badges.unreadAlerts`.
6. Logout — dashboard state clears.

```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/v1/dashboard/home?newsLimit=4&alertsLimit=2"
```

---

## Implementation order (completed)

1. `dashboard.service.ts` + types + mappers  
2. `fetchHome` thunk + Redux state  
3. Banners wired to `home.mode` / `home.status`  
4. Weather, news, recent alerts, preparedness preview  
5. Badge sync on tab bar + top bar  
6. Cloudy-only map/incidents via `/emergency/map` and `/emergency/incidents`

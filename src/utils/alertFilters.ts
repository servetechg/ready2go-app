import { US_STATE_NAMES } from '@/constants/usStates';
import type { MobileWeatherAlert, WeatherAlert } from '@/types/dashboard';
import type { MapMarkerPoint } from '@/types/emergency';

const STATE_CODES = Object.keys(US_STATE_NAMES);

/** Full state names that appear in alert text but are not the signup state (e.g. Colorado River in AZ). */
const STATE_NAME_FALSE_POSITIVES: Partial<Record<string, RegExp[]>> = {
  CO: [/\bcolorado river\b/i],
  WA: [/\bwashington\s*,?\s*d\.?c\.?\b/i],
};

function addStateToken(codeOrName: string | null | undefined, allowed: Set<string>): void {
  if (!codeOrName?.trim()) return;
  const clean = codeOrName.trim().toUpperCase();

  if (US_STATE_NAMES[clean]) {
    allowed.add(clean);
    allowed.add(US_STATE_NAMES[clean].toUpperCase());
    return;
  }

  const entry = Object.entries(US_STATE_NAMES).find(
    ([, name]) => name.toUpperCase() === clean,
  );
  if (entry) {
    allowed.add(entry[0]);
    allowed.add(entry[1].toUpperCase());
  }
}

/**
 * Tokens for the user's signup (home) state only — not alert-location states.
 */
export function getSignupStateTokens(address: { state?: string | null }): string[] {
  const allowed = new Set<string>();
  addStateToken(address?.state, allowed);
  return Array.from(allowed);
}

/** @deprecated Use {@link getSignupStateTokens} — alert locations are not used for alert filtering. */
export function getAllowedStateTokens(
  address: { state?: string | null },
  _alertLocations?: unknown[],
): string[] {
  return getSignupStateTokens(address);
}

function resolveSignupStateCodes(allowedTokens: string[]): Set<string> {
  const codes = new Set<string>();
  for (const token of allowedTokens) {
    if (token.length === 2 && US_STATE_NAMES[token]) {
      codes.add(token);
      continue;
    }
    const entry = Object.entries(US_STATE_NAMES).find(
      ([, name]) => name.toUpperCase() === token,
    );
    if (entry) codes.add(entry[0]);
  }
  return codes;
}

function extractMentionedStateCodes(text: string): Set<string> {
  const upper = text.toUpperCase();
  const found = new Set<string>();

  for (const code of STATE_CODES) {
    if (new RegExp(`\\b${code}\\b`).test(upper)) {
      found.add(code);
    }
  }

  for (const [code, name] of Object.entries(US_STATE_NAMES)) {
    const nameUpper = name.toUpperCase();
    if (!new RegExp(`\\b${nameUpper}\\b`).test(upper)) continue;

    const falsePositives = STATE_NAME_FALSE_POSITIVES[code];
    if (falsePositives?.some((pattern) => pattern.test(text))) continue;

    found.add(code);
  }

  return found;
}

function locationMatchesSignupState(location: string, allowedTokens: string[]): boolean {
  if (!allowedTokens.length) return false;

  const signupCodes = resolveSignupStateCodes(allowedTokens);
  if (!signupCodes.size) return false;

  const mentioned = extractMentionedStateCodes(location);
  if (mentioned.size > 0) {
    for (const code of signupCodes) {
      if (mentioned.has(code)) return true;
    }
    return false;
  }

  const upper = location.toUpperCase();
  return allowedTokens.some((token) => new RegExp(`\\b${token}\\b`).test(upper));
}

/**
 * Filters alerts to the user's signup state only.
 * When no signup state is set, returns an empty list.
 */
export function filterAlertsByAllowedStates<T extends MobileWeatherAlert | WeatherAlert>(
  alerts: T[],
  allowedTokens: string[],
): T[] {
  if (!allowedTokens?.length) return [];

  return alerts.filter((alert) =>
    locationMatchesSignupState(alert.location || '', allowedTokens),
  );
}

/**
 * Filters map markers to the user's signup state only.
 */
export function filterMapMarkersByAllowedStates(
  markers: MapMarkerPoint[],
  allowedTokens: string[],
): MapMarkerPoint[] {
  if (!allowedTokens?.length) return [];

  return markers.filter((marker) => {
    const locStr = `${marker.title || ''} ${marker.description || ''}`;
    return locationMatchesSignupState(locStr, allowedTokens);
  });
}

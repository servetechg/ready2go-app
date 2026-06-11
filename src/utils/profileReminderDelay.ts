import { ENV } from '@/constants/env';

/** Seconds until local push fires, anchored to signup time (not onboarding step changes). */
export function getProfileReminderDelaySeconds(signupAt?: string): number {
  const total = ENV.PROFILE_REMINDER_SECONDS;

  if (!signupAt) {
    return total;
  }

  const signupMs = new Date(signupAt).getTime();
  if (Number.isNaN(signupMs)) {
    return total;
  }

  const elapsed = Math.floor((Date.now() - signupMs) / 1000);
  const remaining = total - elapsed;

  // Fire soon if the window already passed (e.g. user reopened the app late).
  return Math.max(10, remaining);
}

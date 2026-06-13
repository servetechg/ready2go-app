export function formatNewsTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Relative time for feed rows, e.g. "12 min ago" */
export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;

  return formatNewsTimestamp(iso);
}

/** Absolute issue date/time for alerts from UnifiedEvent ISO timestamps. */
export function formatIssuedDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Label for alert cards and banners, e.g. "Issued Jun 4, 2026, 2:00 PM" */
export function formatIssuedLabel(iso: string): string {
  return `Issued ${formatIssuedDate(iso)}`;
}

/** @deprecated Use formatIssuedLabel — relative times were incorrect for UnifiedEvent alerts */
export function formatIssuedAgo(iso: string): string {
  return formatIssuedLabel(iso);
}

export function formatExpiresLabel(expiresAt?: string | null): string {
  if (!expiresAt) return 'EXPIRES: SEE ALERT DETAILS';
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return `EXPIRES: ${expiresAt}`;
  return `EXPIRES: ${date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

export function formatIncidentTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

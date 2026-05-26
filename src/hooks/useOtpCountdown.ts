import { useCallback, useEffect, useState } from 'react';

export function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function useOtpCountdown(durationSeconds = 60) {
  const [remaining, setRemaining] = useState(durationSeconds);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setInterval(() => {
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [remaining]);

  const reset = useCallback(() => {
    setRemaining(durationSeconds);
  }, [durationSeconds]);

  return {
    remaining,
    canResend: remaining <= 0,
    reset,
    formatted: formatCountdown(remaining),
  };
}

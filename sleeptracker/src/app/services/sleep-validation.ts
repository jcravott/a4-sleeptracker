export function overnightError(start: Date, end: Date, now = new Date()): string {
  const minutes = (end.getTime() - start.getTime()) / 60000;
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) return 'Choose a bedtime and wake-up time.';
  if (start > now || end > now) return 'Sleep times must be in the past.';
  if (minutes <= 0) return 'Wake-up must be after bedtime. Check both dates.';
  if (minutes < 1 || minutes > 24 * 60) return 'Choose a duration between 1 minute and 24 hours.';
  return '';
}

export function sleepinessError(value: number, date: Date, now = new Date()): string {
  if (!Number.isInteger(value) || value < 1 || value > 7) return 'Choose a sleepiness rating from 1 to 7.';
  if (!Number.isFinite(date.getTime())) return 'Choose a date and time.';
  if (date > now) return 'The check-in time must be in the past or present.';
  return '';
}

export function localDateTime(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

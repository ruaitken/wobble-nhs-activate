export const MIN_DURATION_WEEKS = 12;
export const MAX_DURATION_WEEKS = 52;
export const DEFAULT_DURATION_WEEKS = 52;

export const DURATION_WEEK_OPTIONS = Array.from(
  { length: MAX_DURATION_WEEKS - MIN_DURATION_WEEKS + 1 },
  (_, index) => MIN_DURATION_WEEKS + index
);

export function isDurationWeeks(value: number) {
  return (
    Number.isInteger(value) &&
    value >= MIN_DURATION_WEEKS &&
    value <= MAX_DURATION_WEEKS
  );
}

export function weeksToDays(weeks: number) {
  return weeks * 7;
}

export function addWeeks(start: Date, weeks: number) {
  const end = new Date(start.getTime());
  end.setUTCDate(end.getUTCDate() + weeksToDays(weeks));
  return end;
}

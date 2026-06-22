export type Clock = {
  now: () => Date;
};

export const systemClock: Clock = {
  now: () => new Date(),
};

export function toIsoTimestamp(date: Date): string {
  return date.toISOString();
}

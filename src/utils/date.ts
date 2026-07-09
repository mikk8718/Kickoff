import { formatInTimeZone } from "date-fns-tz";

export function todayKey(timezone: string): string {
  return formatInTimeZone(new Date(), timezone, "yyyy-MM-dd");
}

import type { Match } from "../providers/FootballProvider.js";
import { todayKey } from "../utils/date.js";

export function formatJson(input: {
  leagueName: string;
  timezone: string;
  matches: Match[];
}): string {
  return JSON.stringify(
    {
      league: input.leagueName,
      date: todayKey(input.timezone),
      timezone: input.timezone,
      matches: input.matches
    },
    null,
    2
  );
}

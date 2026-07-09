import type { Match } from "../providers/FootballProvider.js";
export function formatJson(input: {
  leagueName: string;
  date: string;
  timezone: string;
  matches: Match[];
}): string {
  return JSON.stringify(
    {
      league: input.leagueName,
      date: input.date,
      timezone: input.timezone,
      matches: input.matches
    },
    null,
    2
  );
}

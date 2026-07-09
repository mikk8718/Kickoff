import type { Match } from "../providers/FootballProvider.js";

export function formatConsole(input: {
  leagueName: string;
  date: string;
  matches: Match[];
}): string {
  if (input.matches.length === 0) {
    return `No ${input.leagueName} matches on ${input.date}.`;
  }

  return [
    `${input.leagueName} - ${input.date}`,
    "",
    ...input.matches.map((match) =>
      `${match.kickoffLocal ?? "--:--"} ${match.homeTeam} vs ${match.awayTeam}`
    )
  ].join("\n");
}

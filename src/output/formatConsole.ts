import type { Match } from "../providers/FootballProvider.js";

export function formatConsole(input: {
  leagueName: string;
  matches: Match[];
}): string {
  if (input.matches.length === 0) {
    return `No ${input.leagueName} matches today.`;
  }

  return [
    `${input.leagueName} - Today`,
    "",
    ...input.matches.map((match) =>
      `${match.kickoffLocal ?? "--:--"} ${match.homeTeam} vs ${match.awayTeam}`
    )
  ].join("\n");
}

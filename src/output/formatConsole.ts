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
      formatMatchLine(match)
    )
  ].join("\n");
}

function formatMatchLine(match: Match): string {
  const score = match.homeScore !== undefined && match.awayScore !== undefined
    ? `${match.homeScore}-${match.awayScore}`
    : "vs";
  const timeOrMinute = match.minute ?? match.kickoffTimestampLocal ?? match.kickoffLocal ?? match.dateLocal ?? "--:--";

  return `${timeOrMinute} ${match.homeTeam} ${score} ${match.awayTeam}`;
}

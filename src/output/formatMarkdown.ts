import type { Match } from "../providers/FootballProvider.js";
import { todayKey } from "../utils/date.js";

export function formatMarkdown(input: {
  leagueName: string;
  timezone: string;
  matches: Match[];
}): string {
  return [
    "# Matches today",
    "",
    `Date: ${todayKey(input.timezone)}  `,
    `Timezone: ${input.timezone}  `,
    "Source: Flashscore",
    "",
    `## ${input.leagueName}`,
    "",
    "| Time | Home | Away | Status |",
    "|---|---|---|---|",
    ...input.matches.map((match) =>
      `| ${match.kickoffLocal ?? ""} | ${escapeCell(match.homeTeam)} | ${escapeCell(match.awayTeam)} | ${match.status} |`
    )
  ].join("\n");
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, "\\|");
}

import type { Match } from "../providers/FootballProvider.js";
export function formatMarkdown(input: {
  leagueName: string;
  date: string;
  timezone: string;
  matches: Match[];
}): string {
  return [
    "# Matches",
    "",
    `Date: ${input.date}  `,
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

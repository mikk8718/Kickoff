import type { Match } from "../providers/FootballProvider.js";

export type OverviewData = {
  leagueName: string;
  date: string;
  timezone: string;
  finishedMatches: Match[];
  liveMatches: Match[];
  upcomingMatches: Match[];
};

export function formatOverviewConsole(input: OverviewData): string {
  return [
    `${input.leagueName} - Overview`,
    `Date: ${input.date}`,
    "",
    "FINISHED",
    ...formatSection(input.finishedMatches, "No finished matches."),
    "",
    "LIVE",
    ...formatSection(input.liveMatches, "No live matches."),
    "",
    "UPCOMING",
    ...formatSection(input.upcomingMatches, "No upcoming matches found.")
  ].join("\n");
}

export function formatOverviewJson(input: OverviewData): string {
  return JSON.stringify(
    {
      league: input.leagueName,
      date: input.date,
      timezone: input.timezone,
      finishedMatches: input.finishedMatches,
      liveMatches: input.liveMatches,
      upcomingMatches: input.upcomingMatches
    },
    null,
    2
  );
}

export function formatOverviewMarkdown(input: OverviewData): string {
  return [
    "# Match overview",
    "",
    `Date: ${input.date}  `,
    `Timezone: ${input.timezone}  `,
    "Source: Flashscore",
    "",
    `## ${input.leagueName}`,
    "",
    "### Finished",
    "",
    ...formatMarkdownRows(input.finishedMatches, "No finished matches."),
    "",
    "### Live",
    "",
    ...formatMarkdownRows(input.liveMatches, "No live matches."),
    "",
    "### Upcoming",
    "",
    ...formatMarkdownRows(input.upcomingMatches, "No upcoming matches found.")
  ].join("\n");
}

function formatSection(matches: Match[], emptyMessage: string): string[] {
  if (matches.length === 0) {
    return [emptyMessage];
  }

  return matches.map(formatMatchLine);
}

function formatMatchLine(match: Match): string {
  const score = match.homeScore !== undefined && match.awayScore !== undefined
    ? `${match.homeScore}-${match.awayScore}`
    : "vs";
  const timeOrMinute = match.minute ?? match.kickoffTimestampLocal ?? match.kickoffLocal ?? match.dateLocal ?? formatStatusLabel(match);

  return `${timeOrMinute} ${match.homeTeam} ${score} ${match.awayTeam}`;
}

function formatStatusLabel(match: Match): string {
  if (match.status === "finished") {
    return "FT";
  }

  return "--:--";
}

function formatMarkdownRows(matches: Match[], emptyMessage: string): string[] {
  if (matches.length === 0) {
    return [emptyMessage];
  }

  return [
    "| Date | Time | Timestamp | Home | Score | Away | Status |",
    "|---|---|---|---|---|---|---|",
    ...matches.map((match) =>
      `| ${match.dateLocal ?? ""} | ${match.minute ?? match.kickoffLocal ?? ""} | ${match.kickoffTimestampLocal ?? ""} | ${escapeCell(match.homeTeam)} | ${formatScore(match)} | ${escapeCell(match.awayTeam)} | ${match.status} |`
    )
  ];
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, "\\|");
}

function formatScore(match: Match): string {
  if (match.homeScore === undefined || match.awayScore === undefined) {
    return "";
  }

  return `${match.homeScore}-${match.awayScore}`;
}

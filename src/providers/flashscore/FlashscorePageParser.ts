import { z } from "zod";
import type { Match, MatchStatus } from "../FootballProvider.js";
import type { LeagueConfig } from "../../leagues/leagues.js";

const rawFlashscoreRowSchema = z.object({
  id: z.string().optional(),
  time: z.string().optional(),
  home: z.string().optional(),
  away: z.string().optional(),
  homeScore: z.string().optional(),
  awayScore: z.string().optional(),
  competition: z.string().optional(),
  status: z.string().optional()
});

export type RawFlashscoreRow = z.infer<typeof rawFlashscoreRowSchema>;

export function parseFlashscoreRows(input: {
  rows: unknown[];
  league: LeagueConfig;
  date: string;
}): Match[] {
  return input.rows
    .map((row) => rawFlashscoreRowSchema.safeParse(row))
    .filter((result) => result.success)
    .map((result) => result.data)
    .filter((row) => row.home && row.away)
    .filter((row) => rowBelongsToDate(row, input.date))
    .map((row, index) => ({
      id: row.id ?? `${input.league.key}-${index}-${slugify(`${row.home}-${row.away}-${row.time ?? ""}`)}`,
      leagueKey: input.league.key,
      leagueName: input.league.displayName,
      kickoffLocal: extractKickoffTime(row.time),
      minute: extractMinute(row.status),
      homeTeam: cleanText(row.home) ?? "Unknown home team",
      awayTeam: cleanText(row.away) ?? "Unknown away team",
      homeScore: cleanText(row.homeScore),
      awayScore: cleanText(row.awayScore),
      status: normalizeStatus(row.status),
      source: "flashscore" as const,
      sourceUrl: input.league.flashscoreUrl
    }));
}

export function parseLiveFlashscoreRows(input: {
  rows: unknown[];
  league?: LeagueConfig;
}): Match[] {
  return input.rows
    .map((row) => rawFlashscoreRowSchema.safeParse(row))
    .filter((result) => result.success)
    .map((result) => result.data)
    .filter((row) => row.home && row.away)
    .filter((row) => !input.league || competitionMatchesLeague(row.competition, input.league))
    .map((row, index) => ({
      id: row.id ?? `live-${index}-${slugify(`${row.home}-${row.away}-${row.status ?? ""}`)}`,
      leagueKey: input.league?.key ?? "live",
      leagueName: input.league?.displayName ?? cleanCompetitionName(row.competition) ?? "Live Football",
      kickoffLocal: extractKickoffTime(row.time),
      minute: extractMinute(row.status),
      homeTeam: cleanText(row.home) ?? "Unknown home team",
      awayTeam: cleanText(row.away) ?? "Unknown away team",
      homeScore: cleanText(row.homeScore),
      awayScore: cleanText(row.awayScore),
      status: normalizeStatus(row.status),
      source: "flashscore" as const,
      sourceUrl: "https://www.flashscore.com/football/",
      competitionName: cleanCompetitionName(row.competition)
    }))
    .filter((match) => match.status === "live");
}

export function normalizeStatus(status?: string): MatchStatus {
  const normalized = cleanText(status)?.toLowerCase();

  if (!normalized) {
    return "scheduled";
  }

  if (["postp", "postponed"].includes(normalized)) {
    return "postponed";
  }

  if (["canc", "cancelled", "canceled"].includes(normalized)) {
    return "cancelled";
  }

  if (["ft", "aet", "pen", "finished"].includes(normalized)) {
    return "finished";
  }

  if (/^\d{1,3}'?$/.test(normalized) || normalized === "ht" || normalized === "live") {
    return "live";
  }

  return "unknown";
}

function cleanText(value?: string): string | undefined {
  const cleaned = value?.replace(/\s+/g, " ").trim();
  return cleaned || undefined;
}

function rowBelongsToDate(row: RawFlashscoreRow, targetDate: string): boolean {
  const parsed = parseFlashscoreDateTime(row.time, targetDate);
  return parsed?.date === targetDate;
}

function extractKickoffTime(value?: string): string | undefined {
  return parseFlashscoreDateTime(value)?.time ?? cleanText(value);
}

function extractMinute(status?: string): string | undefined {
  const cleaned = cleanText(status);

  if (!cleaned) {
    return undefined;
  }

  if (/^\d{1,3}'?$/.test(cleaned)) {
    return cleaned.endsWith("'") ? cleaned : `${cleaned}'`;
  }

  if (["HT", "Half Time"].includes(cleaned)) {
    return "HT";
  }

  if (cleaned.toLowerCase() === "live") {
    return "live";
  }

  return undefined;
}

function cleanCompetitionName(value?: string): string | undefined {
  const cleaned = cleanText(value);

  if (!cleaned) {
    return undefined;
  }

  return cleaned
    .replace(/([a-z])([A-Z])/g, "$1 - $2")
    .replace(/\b[A-Z]+:\s*Draw\b/g, "")
    .replace(/\bWORLD:\s*Draw\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function competitionMatchesLeague(competition: string | undefined, league: LeagueConfig): boolean {
  const normalizedCompetition = normalizeCompetitionText(competition);

  if (!normalizedCompetition) {
    return false;
  }

  return [league.displayName, league.key, ...league.aliases].some((candidate) =>
    normalizedCompetition.includes(normalizeCompetitionText(candidate))
  );
}

function normalizeCompetitionText(value?: string): string {
  return cleanText(value)
    ?.toLowerCase()
    .replace(/play-?offs/g, "play offs")
    .replace(/[^a-z0-9]+/g, " ")
    .trim() ?? "";
}

export function parseFlashscoreDateTime(value?: string, targetDate?: string): {
  date?: string;
  time?: string;
} | undefined {
  const cleaned = cleanText(value);

  if (!cleaned) {
    return undefined;
  }

  const datedMatch = cleaned.match(/^(\d{1,2})\.(\d{1,2})\.\s+(\d{1,2}:\d{2})$/);

  if (datedMatch) {
    const [, day, month, time] = datedMatch;
    const year = targetDate?.slice(0, 4) ?? String(new Date().getFullYear());

    return {
      date: `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
      time
    };
  }

  const timeOnlyMatch = cleaned.match(/^(\d{1,2}:\d{2})$/);

  if (timeOnlyMatch) {
    return {
      date: targetDate,
      time: timeOnlyMatch[1]
    };
  }

  return undefined;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

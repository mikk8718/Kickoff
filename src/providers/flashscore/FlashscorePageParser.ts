import { z } from "zod";
import type { Match, MatchStatus } from "../FootballProvider.js";
import type { LeagueConfig } from "../../leagues/leagues.js";
import { addDaysToDateKey } from "../../utils/date.js";

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
    .map((row, index) => {
      const dateTime = parseFlashscoreDateTime(row.time, input.date);

      return {
        id: row.id ?? `${input.league.key}-${index}-${slugify(`${row.home}-${row.away}-${row.time ?? ""}`)}`,
        leagueKey: input.league.key,
        leagueName: input.league.displayName,
        dateLocal: dateTime?.date,
        kickoffLocal: dateTime?.time ?? (dateTime?.date ? undefined : cleanText(row.time)),
        kickoffTimestampLocal: formatLocalTimestamp(dateTime),
        minute: extractMinute(row.status),
        homeTeam: cleanText(row.home) ?? "Unknown home team",
        awayTeam: cleanText(row.away) ?? "Unknown away team",
        homeScore: normalizeScore(row.homeScore),
        awayScore: normalizeScore(row.awayScore),
        status: normalizeStatus(row.status),
        source: "flashscore" as const,
        sourceUrl: input.league.flashscoreUrl
      };
    });
}

export function parseUpcomingFlashscoreRows(input: {
  rows: unknown[];
  league: LeagueConfig;
  fromDate: string;
  days?: number;
  limit: number;
}): Match[] {
  const throughDate = input.days === undefined
    ? undefined
    : addDaysToDateKey(input.fromDate, Math.max(input.days - 1, 0));

  return input.rows
    .map((row) => rawFlashscoreRowSchema.safeParse(row))
    .filter((result) => result.success)
    .map((result) => result.data)
    .filter((row) => row.home && row.away)
    .map(createRollingFixtureNormalizer({
      league: input.league,
      referenceDate: input.fromDate
    }))
    .filter((match) => match.dateLocal !== undefined)
    .filter((match) => match.dateLocal! >= input.fromDate)
    .filter((match) => throughDate === undefined || match.dateLocal! <= throughDate)
    .sort((left, right) =>
      (left.kickoffTimestampLocal ?? left.dateLocal ?? "").localeCompare(
        right.kickoffTimestampLocal ?? right.dateLocal ?? ""
      )
    )
    .slice(0, input.limit);
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
      homeScore: normalizeScore(row.homeScore),
      awayScore: normalizeScore(row.awayScore),
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

function normalizeFixtureRow(input: {
  row: RawFlashscoreRow;
  index: number;
  league: LeagueConfig;
  referenceDate: string;
  yearOverride?: string;
}): Match {
  const dateTime = parseFlashscoreDateTime(input.row.time, input.referenceDate, input.yearOverride);

  return {
    id: input.row.id ?? `${input.league.key}-${input.index}-${slugify(`${input.row.home}-${input.row.away}-${input.row.time ?? ""}`)}`,
    leagueKey: input.league.key,
    leagueName: input.league.displayName,
    dateLocal: dateTime?.date,
    kickoffLocal: dateTime?.time ?? (dateTime?.date ? undefined : cleanText(input.row.time)),
    kickoffTimestampLocal: formatLocalTimestamp(dateTime),
    minute: extractMinute(input.row.status),
    homeTeam: cleanText(input.row.home) ?? "Unknown home team",
    awayTeam: cleanText(input.row.away) ?? "Unknown away team",
    homeScore: normalizeScore(input.row.homeScore),
    awayScore: normalizeScore(input.row.awayScore),
    status: normalizeStatus(input.row.status),
    source: "flashscore",
    sourceUrl: input.league.flashscoreUrl
  };
}

function createRollingFixtureNormalizer(input: {
  league: LeagueConfig;
  referenceDate: string;
}): (row: RawFlashscoreRow, index: number) => Match {
  let currentYear = Number(input.referenceDate.slice(0, 4));
  let previousMonthDay: number | undefined;

  return (row, index) => {
    const monthDay = extractFlashscoreMonthDay(row.time);

    if (monthDay !== undefined) {
      if (previousMonthDay !== undefined && monthDay < previousMonthDay) {
        currentYear += 1;
      }

      previousMonthDay = monthDay;
    }

    return normalizeFixtureRow({
      row,
      index,
      league: input.league,
      referenceDate: input.referenceDate,
      yearOverride: String(currentYear)
    });
  };
}

function extractKickoffTime(value?: string): string | undefined {
  return parseFlashscoreDateTime(value)?.time ?? cleanText(value);
}

function normalizeScore(value?: string): string | undefined {
  const cleaned = cleanText(value);

  if (!cleaned || cleaned === "-") {
    return undefined;
  }

  return cleaned;
}

function formatLocalTimestamp(dateTime?: {
  date?: string;
  time?: string;
}): string | undefined {
  if (!dateTime?.date || !dateTime.time) {
    return undefined;
  }

  return `${dateTime.date} ${dateTime.time}`;
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
    .replace(/\s+-\s*$/g, "")
    .trim();
}

function competitionMatchesLeague(competition: string | undefined, league: LeagueConfig): boolean {
  const normalizedCompetition = normalizeCompetitionText(competition);

  if (!normalizedCompetition) {
    return false;
  }

  return [league.displayName, league.key, ...league.aliases]
    .map(normalizeCompetitionText)
    .filter((candidate) => candidate.length >= 4)
    .some((candidate) => normalizedCompetition.includes(candidate));
}

function normalizeCompetitionText(value?: string): string {
  return cleanText(value)
    ?.toLowerCase()
    .replace(/play-?offs/g, "play offs")
    .replace(/[^a-z0-9]+/g, " ")
    .trim() ?? "";
}

export function parseFlashscoreDateTime(value?: string, targetDate?: string, yearOverride?: string): {
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
    const year = yearOverride ?? targetDate?.slice(0, 4) ?? String(new Date().getFullYear());

    return {
      date: `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
      time
    };
  }

  const datedWithYearMatch = cleaned.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}:\d{2}))?$/);

  if (datedWithYearMatch) {
    const [, day, month, year, time] = datedWithYearMatch;

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

function extractFlashscoreMonthDay(value?: string): number | undefined {
  const cleaned = cleanText(value);
  const datedMatch = cleaned?.match(/^(\d{1,2})\.(\d{1,2})\.(?:\d{4})?(?:\s+\d{1,2}:\d{2})?$/);

  if (!datedMatch) {
    return undefined;
  }

  const [, day, month] = datedMatch;
  return Number(month) * 100 + Number(day);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

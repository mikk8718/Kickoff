import { z } from "zod";
import type { Match, MatchStatus } from "../FootballProvider.js";
import type { LeagueConfig } from "../../leagues/leagues.js";

const rawFlashscoreRowSchema = z.object({
  id: z.string().optional(),
  time: z.string().optional(),
  home: z.string().optional(),
  away: z.string().optional(),
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
      homeTeam: cleanText(row.home) ?? "Unknown home team",
      awayTeam: cleanText(row.away) ?? "Unknown away team",
      status: normalizeStatus(row.status),
      source: "flashscore" as const,
      sourceUrl: input.league.flashscoreUrl
    }));
}

function normalizeStatus(status?: string): MatchStatus {
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

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
}): Match[] {
  return input.rows
    .map((row) => rawFlashscoreRowSchema.safeParse(row))
    .filter((result) => result.success)
    .map((result) => result.data)
    .filter((row) => row.home && row.away)
    .map((row, index) => ({
      id: row.id ?? `${input.league.key}-${index}-${slugify(`${row.home}-${row.away}-${row.time ?? ""}`)}`,
      leagueKey: input.league.key,
      leagueName: input.league.displayName,
      kickoffLocal: cleanText(row.time),
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

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

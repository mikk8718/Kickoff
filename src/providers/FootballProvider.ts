import type { LeagueConfig } from "../leagues/leagues.js";

export type MatchStatus =
  | "scheduled"
  | "live"
  | "finished"
  | "postponed"
  | "cancelled"
  | "unknown";

export type Match = {
  id: string;
  leagueKey: string;
  leagueName: string;
  kickoffLocal?: string;
  kickoffUtc?: string;
  homeTeam: string;
  awayTeam: string;
  status: MatchStatus;
  source: "flashscore";
  sourceUrl?: string;
};

export interface FootballProvider {
  getTodayMatches(input: {
    league: LeagueConfig;
    timezone: string;
  }): Promise<Match[]>;
}

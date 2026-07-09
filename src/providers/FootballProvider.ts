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
  minute?: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: string;
  awayScore?: string;
  status: MatchStatus;
  source: "flashscore";
  sourceUrl?: string;
  competitionName?: string;
};

export interface FootballProvider {
  getTodayMatches(input: {
    league: LeagueConfig;
    timezone: string;
    date: string;
  }): Promise<Match[]>;

  getLiveMatches(input: {
    timezone: string;
    league?: LeagueConfig;
  }): Promise<Match[]>;
}

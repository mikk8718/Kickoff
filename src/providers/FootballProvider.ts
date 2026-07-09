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
  dateLocal?: string;
  kickoffLocal?: string;
  kickoffTimestampLocal?: string;
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

  getUpcomingMatches(input: {
    league: LeagueConfig;
    timezone: string;
    fromDate: string;
    days?: number;
    limit: number;
    showMoreClicks: number;
  }): Promise<Match[]>;

  getLiveMatches(input: {
    timezone: string;
    league?: LeagueConfig;
  }): Promise<Match[]>;

  getFinishedMatches(input: {
    timezone: string;
    league?: LeagueConfig;
  }): Promise<Match[]>;
}

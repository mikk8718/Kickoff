import type { FootballProvider, Match } from "../providers/FootballProvider.js";
import type { LeagueConfig } from "../leagues/leagues.js";
import { FileCache } from "../cache/FileCache.js";

export type FootballServiceOptions = {
  provider: FootballProvider;
  cache: FileCache;
  cacheTtlSeconds: number;
};

export class FootballService {
  private readonly provider: FootballProvider;
  private readonly cache: FileCache;
  private readonly cacheTtlSeconds: number;

  constructor(options: FootballServiceOptions) {
    this.provider = options.provider;
    this.cache = options.cache;
    this.cacheTtlSeconds = options.cacheTtlSeconds;
  }

  async getTodayMatches(input: {
    league: LeagueConfig;
    timezone: string;
    date: string;
    useCache: boolean;
  }): Promise<{ matches: Match[]; usedCache: boolean }> {
    const cacheKey = `flashscore-${input.league.key}-${input.date}-${input.timezone}`;

    if (input.useCache) {
      const cached = await this.cache.get<Match[]>(cacheKey, this.cacheTtlSeconds);

      if (cached) {
        return {
          matches: cached,
          usedCache: true
        };
      }
    }

    try {
      const matches = await this.provider.getTodayMatches({
        league: input.league,
        timezone: input.timezone,
        date: input.date
      });

      await this.cache.set(cacheKey, matches);

      return {
        matches,
        usedCache: false
      };
    } catch (error) {
      const stale = await this.cache.get<Match[]>(cacheKey);

      if (stale) {
        return {
          matches: stale,
          usedCache: true
        };
      }

      throw error;
    }
  }

  async getLiveMatches(input: {
    timezone: string;
    useCache: boolean;
  }): Promise<{ matches: Match[]; usedCache: boolean }> {
    const cacheKey = `flashscore-live-${input.timezone}`;
    const liveCacheTtlSeconds = 60;

    if (input.useCache) {
      const cached = await this.cache.get<Match[]>(cacheKey, liveCacheTtlSeconds);

      if (cached) {
        return {
          matches: cached,
          usedCache: true
        };
      }
    }

    try {
      const matches = await this.provider.getLiveMatches({
        timezone: input.timezone
      });

      await this.cache.set(cacheKey, matches);

      return {
        matches,
        usedCache: false
      };
    } catch (error) {
      const stale = await this.cache.get<Match[]>(cacheKey);

      if (stale) {
        return {
          matches: stale,
          usedCache: true
        };
      }

      throw error;
    }
  }
}

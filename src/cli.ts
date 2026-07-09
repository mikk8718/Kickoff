#!/usr/bin/env node
import { Command } from "commander";
import pino from "pino";
import { FileCache } from "./cache/FileCache.js";
import { env } from "./config/env.js";
import { resolveLeague, UnknownLeagueError } from "./leagues/resolveLeague.js";
import { formatConsole } from "./output/formatConsole.js";
import { formatJson } from "./output/formatJson.js";
import { formatMarkdown } from "./output/formatMarkdown.js";
import {
  formatOverviewConsole,
  formatOverviewJson,
  formatOverviewMarkdown
} from "./output/formatOverview.js";
import { FlashscoreProvider } from "./providers/flashscore/FlashscoreProvider.js";
import { FootballService } from "./services/FootballService.js";
import { isDateKey, todayKey } from "./utils/date.js";

const program = new Command();

program
  .name("football")
  .description("Show football matches for a league using Flashscore.")
  .version("0.1.0");

program
  .command("today")
  .description("Show today's matches for a league.")
  .requiredOption("-l, --league <league>", "league name, key, or alias")
  .option("-d, --date <date>", "date in YYYY-MM-DD format")
  .option("-t, --timezone <timezone>", "IANA timezone", env.timezone)
  .option("--json", "print JSON output")
  .option("--markdown", "print Markdown output")
  .option("--no-cache", "force a fresh scrape")
  .option("--debug", "print debug logs")
  .action(async (options: {
    league: string;
    date?: string;
    timezone: string;
    json?: boolean;
    markdown?: boolean;
    cache?: boolean;
    debug?: boolean;
  }) => {
    const logger = pino({
      enabled: Boolean(options.debug),
      level: "debug"
    });

    try {
      const league = resolveLeague(options.league);
      const date = options.date ?? todayKey(options.timezone);
      const service = new FootballService({
        provider: new FlashscoreProvider(),
        cache: new FileCache(env.cacheDir),
        cacheTtlSeconds: env.cacheTtlSeconds
      });

      const result = await service.getTodayMatches({
        league,
        timezone: options.timezone,
        date,
        useCache: options.cache !== false
      });

      if (result.usedCache) {
        logger.debug("Using cached Flashscore data.");
      }

      if (options.json) {
        console.log(formatJson({
          leagueName: league.displayName,
          date,
          timezone: options.timezone,
          matches: result.matches
        }));
        return;
      }

      if (options.markdown) {
        console.log(formatMarkdown({
          leagueName: league.displayName,
          date,
          timezone: options.timezone,
          matches: result.matches
        }));
        return;
      }

      console.log(formatConsole({
        leagueName: league.displayName,
        date,
        matches: result.matches
      }));
    } catch (error) {
      if (error instanceof UnknownLeagueError) {
        const suggestion = error.suggestion ? `\nDid you mean "${error.suggestion.displayName}"?` : "";
        console.error(`${error.message}${suggestion}`);
        process.exitCode = 1;
        return;
      }

      console.error(error instanceof Error ? error.message : "Unexpected error.");
      process.exitCode = 1;
    }
  });

program
  .command("upcoming")
  .description("Show upcoming fixtures for a league.")
  .requiredOption("-l, --league <league>", "league name, key, or alias")
  .option("-f, --from <date>", "start date in YYYY-MM-DD format")
  .option("--days <days>", "only show fixtures within this many days")
  .option("--limit <limit>", "maximum number of matches to print", "20")
  .option("--show-more <clicks>", "click Flashscore's Show more matches button this many times", "0")
  .option("--all", "load more fixture rows with a bounded default")
  .option("-t, --timezone <timezone>", "IANA timezone", env.timezone)
  .option("--json", "print JSON output")
  .option("--markdown", "print Markdown output")
  .option("--no-cache", "force a fresh scrape")
  .option("--debug", "print debug logs")
  .action(async (options: {
    league: string;
    from?: string;
    days?: string;
    limit: string;
    showMore: string;
    all?: boolean;
    timezone: string;
    json?: boolean;
    markdown?: boolean;
    cache?: boolean;
    debug?: boolean;
  }) => {
    const logger = pino({
      enabled: Boolean(options.debug),
      level: "debug"
    });

    try {
      const league = resolveLeague(options.league);
      const fromDate = options.from ?? todayKey(options.timezone);
      const days = parseOptionalPositiveInteger(options.days, "--days");
      const showMoreClicks = resolveShowMoreClicks(options);
      const limit = resolveLimit(options);

      if (!isDateKey(fromDate)) {
        throw new Error(`Invalid --from date: "${fromDate}". Use YYYY-MM-DD.`);
      }

      const service = new FootballService({
        provider: new FlashscoreProvider(),
        cache: new FileCache(env.cacheDir),
        cacheTtlSeconds: env.cacheTtlSeconds
      });

      const result = await service.getUpcomingMatches({
        league,
        timezone: options.timezone,
        fromDate,
        days,
        limit,
        showMoreClicks,
        useCache: options.cache !== false
      });

      if (result.usedCache) {
        logger.debug("Using cached Flashscore upcoming data.");
      }

      const label = days === undefined ? `${fromDate} onward` : `${fromDate} + ${days} days`;

      if (options.json) {
        console.log(formatJson({
          leagueName: league.displayName,
          date: label,
          timezone: options.timezone,
          matches: result.matches
        }));
        return;
      }

      if (options.markdown) {
        console.log(formatMarkdown({
          leagueName: league.displayName,
          date: label,
          timezone: options.timezone,
          matches: result.matches
        }));
        return;
      }

      console.log(formatConsole({
        leagueName: league.displayName,
        date: label,
        matches: result.matches
      }));
    } catch (error) {
      if (error instanceof UnknownLeagueError) {
        const suggestion = error.suggestion ? `\nDid you mean "${error.suggestion.displayName}"?` : "";
        console.error(`${error.message}${suggestion}`);
        process.exitCode = 1;
        return;
      }

      console.error(error instanceof Error ? error.message : "Unexpected error.");
      process.exitCode = 1;
    }
  });

program
  .command("overview")
  .description("Show live scores and upcoming fixtures for a league.")
  .requiredOption("-l, --league <league>", "league name, key, or alias")
  .option("-f, --from <date>", "upcoming fixture start date in YYYY-MM-DD format")
  .option("--days <days>", "only show upcoming fixtures within this many days")
  .option("--limit <limit>", "maximum number of upcoming matches to print", "20")
  .option("--show-more <clicks>", "click Flashscore's Show more matches button this many times", "0")
  .option("--all", "load more upcoming fixture rows with a bounded default")
  .option("-t, --timezone <timezone>", "IANA timezone", env.timezone)
  .option("--json", "print JSON output")
  .option("--markdown", "print Markdown output")
  .option("--no-cache", "force a fresh scrape")
  .option("--debug", "print debug logs")
  .action(async (options: {
    league: string;
    from?: string;
    days?: string;
    limit: string;
    showMore: string;
    all?: boolean;
    timezone: string;
    json?: boolean;
    markdown?: boolean;
    cache?: boolean;
    debug?: boolean;
  }) => {
    const logger = pino({
      enabled: Boolean(options.debug),
      level: "debug"
    });

    try {
      const league = resolveLeague(options.league);
      const date = todayKey(options.timezone);
      const fromDate = options.from ?? date;
      const days = parseOptionalPositiveInteger(options.days, "--days");
      const showMoreClicks = resolveShowMoreClicks(options);
      const limit = resolveLimit(options);

      if (!isDateKey(fromDate)) {
        throw new Error(`Invalid --from date: "${fromDate}". Use YYYY-MM-DD.`);
      }

      const service = new FootballService({
        provider: new FlashscoreProvider(),
        cache: new FileCache(env.cacheDir),
        cacheTtlSeconds: env.cacheTtlSeconds
      });

      const [liveResult, upcomingResult] = await Promise.all([
        service.getLiveMatches({
          timezone: options.timezone,
          league,
          useCache: options.cache !== false
        }),
        service.getUpcomingMatches({
          league,
          timezone: options.timezone,
          fromDate,
          days,
          limit,
          showMoreClicks,
          useCache: options.cache !== false
        })
      ]);

      if (liveResult.usedCache || upcomingResult.usedCache) {
        logger.debug("Using cached Flashscore overview data.");
      }

      const overview = {
        leagueName: league.displayName,
        date,
        timezone: options.timezone,
        liveMatches: liveResult.matches,
        upcomingMatches: upcomingResult.matches
      };

      if (options.json) {
        console.log(formatOverviewJson(overview));
        return;
      }

      if (options.markdown) {
        console.log(formatOverviewMarkdown(overview));
        return;
      }

      console.log(formatOverviewConsole(overview));
    } catch (error) {
      if (error instanceof UnknownLeagueError) {
        const suggestion = error.suggestion ? `\nDid you mean "${error.suggestion.displayName}"?` : "";
        console.error(`${error.message}${suggestion}`);
        process.exitCode = 1;
        return;
      }

      console.error(error instanceof Error ? error.message : "Unexpected error.");
      process.exitCode = 1;
    }
  });

program
  .command("live")
  .description("Show live football scores with match minute/status.")
  .option("-l, --league <league>", "optional league name, key, or alias")
  .option("-t, --timezone <timezone>", "IANA timezone", env.timezone)
  .option("--json", "print JSON output")
  .option("--markdown", "print Markdown output")
  .option("--no-cache", "force a fresh scrape")
  .option("--debug", "print debug logs")
  .action(async (options: {
    league?: string;
    timezone: string;
    json?: boolean;
    markdown?: boolean;
    cache?: boolean;
    debug?: boolean;
  }) => {
    const logger = pino({
      enabled: Boolean(options.debug),
      level: "debug"
    });

    try {
      const date = todayKey(options.timezone);
      const league = options.league ? resolveLeague(options.league) : undefined;
      const service = new FootballService({
        provider: new FlashscoreProvider(),
        cache: new FileCache(env.cacheDir),
        cacheTtlSeconds: env.cacheTtlSeconds
      });

      const result = await service.getLiveMatches({
        timezone: options.timezone,
        league,
        useCache: options.cache !== false
      });

      if (result.usedCache) {
        logger.debug("Using cached Flashscore live data.");
      }

      if (options.json) {
        console.log(formatJson({
          leagueName: league?.displayName ?? "Live Football",
          date,
          timezone: options.timezone,
          matches: result.matches
        }));
        return;
      }

      if (options.markdown) {
        console.log(formatMarkdown({
          leagueName: league?.displayName ?? "Live Football",
          date,
          timezone: options.timezone,
          matches: result.matches
        }));
        return;
      }

      console.log(formatConsole({
        leagueName: league?.displayName ?? "Live Football",
        date,
        matches: result.matches
      }));
    } catch (error) {
      console.error(error instanceof Error ? error.message : "Unexpected error.");
      process.exitCode = 1;
    }
  });

program.parse();

function parseOptionalPositiveInteger(value: string | undefined, flag: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  return parsePositiveInteger(value, flag);
}

function parsePositiveInteger(value: string, flag: string): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`Invalid ${flag}: "${value}". Use a positive integer.`);
  }

  return parsed;
}

function resolveShowMoreClicks(options: {
  all?: boolean;
  showMore: string;
}): number {
  const explicitClicks = parseNonNegativeInteger(options.showMore, "--show-more");

  if (options.all) {
    return Math.max(explicitClicks, 10);
  }

  return explicitClicks;
}

function resolveLimit(options: {
  all?: boolean;
  limit: string;
}): number {
  if (options.all && options.limit === "20") {
    return 500;
  }

  return parsePositiveInteger(options.limit, "--limit");
}

function parseNonNegativeInteger(value: string, flag: string): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`Invalid ${flag}: "${value}". Use a non-negative integer.`);
  }

  return parsed;
}

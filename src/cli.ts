#!/usr/bin/env node
import { Command } from "commander";
import pino from "pino";
import { FileCache } from "./cache/FileCache.js";
import { env } from "./config/env.js";
import { resolveLeague, UnknownLeagueError } from "./leagues/resolveLeague.js";
import { formatConsole } from "./output/formatConsole.js";
import { formatJson } from "./output/formatJson.js";
import { formatMarkdown } from "./output/formatMarkdown.js";
import { FlashscoreProvider } from "./providers/flashscore/FlashscoreProvider.js";
import { FootballService } from "./services/FootballService.js";

const program = new Command();

program
  .name("football")
  .description("Show football matches for a league using Flashscore.")
  .version("0.1.0");

program
  .command("today")
  .description("Show today's matches for a league.")
  .requiredOption("-l, --league <league>", "league name, key, or alias")
  .option("-t, --timezone <timezone>", "IANA timezone", env.timezone)
  .option("--json", "print JSON output")
  .option("--markdown", "print Markdown output")
  .option("--no-cache", "force a fresh scrape")
  .option("--debug", "print debug logs")
  .action(async (options: {
    league: string;
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
      const service = new FootballService({
        provider: new FlashscoreProvider(),
        cache: new FileCache(env.cacheDir),
        cacheTtlSeconds: env.cacheTtlSeconds
      });

      const result = await service.getTodayMatches({
        league,
        timezone: options.timezone,
        useCache: options.cache !== false
      });

      if (result.usedCache) {
        logger.debug("Using cached Flashscore data.");
      }

      if (options.json) {
        console.log(formatJson({
          leagueName: league.displayName,
          timezone: options.timezone,
          matches: result.matches
        }));
        return;
      }

      if (options.markdown) {
        console.log(formatMarkdown({
          leagueName: league.displayName,
          timezone: options.timezone,
          matches: result.matches
        }));
        return;
      }

      console.log(formatConsole({
        leagueName: league.displayName,
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

program.parse();

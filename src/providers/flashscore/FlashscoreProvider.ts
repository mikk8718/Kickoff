import { chromium, type Browser } from "playwright";
import type { FootballProvider } from "../FootballProvider.js";
import type { LeagueConfig } from "../../leagues/leagues.js";
import { parseFlashscoreRows, parseLiveFlashscoreRows } from "./FlashscorePageParser.js";
import { flashscoreSelectors } from "./selectors.js";

export class FlashscoreSelectorError extends Error {
  constructor() {
    super("Could not find expected Flashscore match rows. Selectors may need updating.");
    this.name = "FlashscoreSelectorError";
  }
}

export class FlashscoreProvider implements FootballProvider {
  async getTodayMatches(input: {
    league: LeagueConfig;
    timezone: string;
    date: string;
  }) {
    let browser: Browser | undefined;

    try {
      browser = await chromium.launch({ headless: true });
    } catch (error) {
      throw new Error("Could not launch Playwright browser. Run: npx playwright install chromium", {
        cause: error
      });
    }

    try {
      const page = await browser.newPage({
        locale: "en-US",
        timezoneId: input.timezone,
        userAgent: "football-scraper/0.1 local personal project"
      });

      await page.goto(input.league.flashscoreUrl, {
        waitUntil: "networkidle",
        timeout: 45_000
      });

      const hasRows = await page.locator(flashscoreSelectors.matchRow).first().isVisible({
        timeout: 15_000
      });

      if (!hasRows) {
        return [];
      }

      const rows = await page.$$eval(flashscoreSelectors.matchRow, (elements, selectors) => {
        return elements.map((row) => ({
          id: row.getAttribute("id") ?? undefined,
          time: row.querySelector(selectors.time)?.textContent?.trim(),
          home: row.querySelector(selectors.homeTeam)?.textContent?.trim(),
          away: row.querySelector(selectors.awayTeam)?.textContent?.trim(),
          status: row.querySelector(selectors.status)?.textContent?.trim()
        }));
      }, flashscoreSelectors);

      return parseFlashscoreRows({
        rows,
        league: input.league,
        date: input.date
      });
    } finally {
      await browser.close();
    }
  }

  async getLiveMatches(input: {
    timezone: string;
    league?: LeagueConfig;
  }) {
    let browser: Browser | undefined;

    try {
      browser = await chromium.launch({ headless: true });
    } catch (error) {
      throw new Error("Could not launch Playwright browser. Run: npx playwright install chromium", {
        cause: error
      });
    }

    try {
      const page = await browser.newPage({
        locale: "en-US",
        timezoneId: input.timezone,
        userAgent: "football-scraper/0.1 local personal project"
      });

      await page.goto("https://www.flashscore.com/football/", {
        waitUntil: "networkidle",
        timeout: 45_000
      });

      const hasRows = await page.locator(flashscoreSelectors.matchRow).first().isVisible({
        timeout: 15_000
      });

      if (!hasRows) {
        return [];
      }

      const rows = await page.$$eval(flashscoreSelectors.matchRow, (elements, selectors) => {
        return elements.map((row) => {
          let sibling = row.previousElementSibling;
          let competition: string | undefined;

          while (sibling) {
            if (sibling.className.toString().includes("headerLeague__wrapper")) {
              competition = sibling.textContent?.trim();
              break;
            }

            sibling = sibling.previousElementSibling;
          }

          return {
            id: row.getAttribute("id") ?? undefined,
            time: row.querySelector(selectors.time)?.textContent?.trim(),
            home: row.querySelector(selectors.homeTeam)?.textContent?.trim(),
            away: row.querySelector(selectors.awayTeam)?.textContent?.trim(),
            homeScore: row.querySelector(selectors.homeScore)?.textContent?.trim(),
            awayScore: row.querySelector(selectors.awayScore)?.textContent?.trim(),
            competition,
            status: row.querySelector(selectors.stage)?.textContent?.trim()
          };
        });
      }, flashscoreSelectors);

      return parseLiveFlashscoreRows({
        rows,
        league: input.league
      });
    } finally {
      await browser.close();
    }
  }
}

import { chromium, type Browser } from "playwright";
import type { FootballProvider } from "../FootballProvider.js";
import type { LeagueConfig } from "../../leagues/leagues.js";
import {
  parseFlashscoreRows,
  parseFinishedFlashscoreRows,
  parseLiveFlashscoreRows,
  parseUpcomingFlashscoreRows
} from "./FlashscorePageParser.js";
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

  async getUpcomingMatches(input: {
    league: LeagueConfig;
    timezone: string;
    fromDate: string;
    days?: number;
    limit: number;
    showMoreClicks: number;
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

      await clickShowMoreMatches(page, input.showMoreClicks);

      const rows = await page.$$eval(flashscoreSelectors.matchRow, (elements, selectors) => {
        return elements.map((row) => ({
          id: row.getAttribute("id") ?? undefined,
          time: row.querySelector(selectors.time)?.textContent?.trim(),
          home: row.querySelector(selectors.homeTeam)?.textContent?.trim(),
          away: row.querySelector(selectors.awayTeam)?.textContent?.trim(),
          homeScore: row.querySelector(selectors.homeScore)?.textContent?.trim(),
          awayScore: row.querySelector(selectors.awayScore)?.textContent?.trim(),
          status: row.querySelector(selectors.status)?.textContent?.trim()
        }));
      }, flashscoreSelectors);

      return parseUpcomingFlashscoreRows({
        rows,
        league: input.league,
        fromDate: input.fromDate,
        days: input.days,
        limit: input.limit
      });
    } finally {
      await browser.close();
    }
  }

  async getLiveMatches(input: {
    timezone: string;
    league?: LeagueConfig;
  }) {
    const rows = await this.getScoreboardRows(input.timezone);

    return parseLiveFlashscoreRows({
      rows,
      league: input.league
    });
  }

  async getFinishedMatches(input: {
    timezone: string;
    league?: LeagueConfig;
  }) {
    const rows = await this.getScoreboardRows(input.timezone);

    return parseFinishedFlashscoreRows({
      rows,
      league: input.league
    });
  }

  private async getScoreboardRows(timezone: string) {
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
        timezoneId: timezone,
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

      return await page.$$eval(flashscoreSelectors.matchRow, (elements, selectors) => {
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

    } finally {
      await browser.close();
    }
  }
}

async function clickShowMoreMatches(page: import("playwright").Page, clicks: number): Promise<void> {
  for (let index = 0; index < clicks; index += 1) {
    const button = page.getByRole("button", { name: /show more matches/i });

    if (await button.count() === 0 || !(await button.first().isVisible())) {
      return;
    }

    const rowCountBefore = await page.locator(flashscoreSelectors.matchRow).count();
    await button.first().click();

    try {
      await page.waitForFunction(
        ({ selector, expectedCount }) => document.querySelectorAll(selector).length > expectedCount,
        {
          selector: flashscoreSelectors.matchRow,
          expectedCount: rowCountBefore
        },
        {
          timeout: 10_000
        }
      );
    } catch {
      return;
    }
  }
}

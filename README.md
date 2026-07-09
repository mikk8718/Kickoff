# Football Scraper

A small TypeScript CLI for showing today's football matches for a given league using Flashscore as the source.

This is designed as a local/personal browser scraping project. It uses Playwright, keeps Flashscore selectors isolated, and normalizes scraped rows behind a provider interface.

## Setup

```bash
npm install
npx playwright install chromium
```

## Usage

```bash
npm run matches -- --league premier-league
npm run matches -- --league premier-league --date 2026-08-21
npm run matches -- --league PL
npm run matches -- --league la-liga --json
npm run matches -- --league champions-league --markdown
npm run matches -- --league bundesliga --no-cache
npm run live
npm run live -- --league world-cup
npm run live -- --json
```

The CLI defaults to `Europe/Copenhagen`.

## Commands

```bash
football today --league premier-league
football today --league premier-league --date 2026-08-21
football today --league la-liga --json
football today --league world-cup --markdown
football today --league premier-league --timezone Europe/Copenhagen --no-cache
football live
football live --league world-cup
football live --json
```

## Supported League Aliases

- `premier-league`, `pl`, `epl`, `premier league`
- `la-liga`, `laliga`, `la liga`, `spain`
- `champions-league`, `cl`, `ucl`, `champions league`
- `world-cup`, `wc`, `world cup`, `fifa world cup`
- `bundesliga`, `bl`, `germany`
- `serie-a`, `serie a`, `italy`

## Notes

Flashscore markup can change. If scraping fails with a selector error, start in `src/providers/flashscore/selectors.ts`.

Before relying on this scraper, check Flashscore's terms and robots.txt yourself. Keep scraping low-frequency, cache aggressively, and do not bypass authentication or anti-bot protections.

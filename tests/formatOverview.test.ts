import { describe, expect, it } from "vitest";
import { formatOverviewConsole, formatOverviewJson, formatOverviewMarkdown } from "../src/output/formatOverview.js";

describe("formatOverview", () => {
  const overview = {
    leagueName: "World Cup",
    date: "2026-07-09",
    timezone: "Europe/Copenhagen",
    liveMatches: [
      {
        id: "live-1",
        leagueKey: "world-cup",
        leagueName: "World Cup",
        minute: "63'",
        homeTeam: "France",
        awayTeam: "Morocco",
        homeScore: "1",
        awayScore: "0",
        status: "live" as const,
        source: "flashscore" as const
      }
    ],
    upcomingMatches: [
      {
        id: "fixture-1",
        leagueKey: "world-cup",
        leagueName: "World Cup",
        dateLocal: "2026-07-10",
        kickoffLocal: "21:00",
        kickoffTimestampLocal: "2026-07-10 21:00",
        homeTeam: "Spain",
        awayTeam: "Belgium",
        status: "scheduled" as const,
        source: "flashscore" as const
      }
    ]
  };

  it("formats console output in live and upcoming sections", () => {
    expect(formatOverviewConsole(overview)).toContain("LIVE\n63' France 1-0 Morocco");
    expect(formatOverviewConsole(overview)).toContain("UPCOMING\n2026-07-10 21:00 Spain vs Belgium");
  });

  it("formats JSON with separate live and upcoming arrays", () => {
    expect(JSON.parse(formatOverviewJson(overview))).toEqual(expect.objectContaining({
      liveMatches: expect.arrayContaining([expect.objectContaining({ homeTeam: "France" })]),
      upcomingMatches: expect.arrayContaining([expect.objectContaining({ homeTeam: "Spain" })])
    }));
  });

  it("formats Markdown with live and upcoming headings", () => {
    expect(formatOverviewMarkdown(overview)).toContain("### Live");
    expect(formatOverviewMarkdown(overview)).toContain("### Upcoming");
  });
});

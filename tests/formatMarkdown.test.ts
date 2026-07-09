import { describe, expect, it } from "vitest";
import { formatMarkdown } from "../src/output/formatMarkdown.js";
import type { Match } from "../src/providers/FootballProvider.js";

describe("formatMarkdown", () => {
  it("formats matches as an Obsidian-friendly table", () => {
    const matches: Match[] = [
      {
        id: "match-1",
        leagueKey: "premier-league",
        leagueName: "Premier League",
        dateLocal: "2026-07-09",
        kickoffLocal: "16:00",
        kickoffTimestampLocal: "2026-07-09 16:00",
        homeTeam: "Arsenal",
        awayTeam: "Chelsea",
        status: "scheduled",
        source: "flashscore"
      }
    ];

    expect(formatMarkdown({
      leagueName: "Premier League",
      date: "2026-07-09",
      timezone: "Europe/Copenhagen",
      matches
    })).toContain("| 2026-07-09 | 16:00 | 2026-07-09 16:00 | Arsenal |  | Chelsea | scheduled |");
  });
});

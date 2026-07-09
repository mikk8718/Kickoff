import { describe, expect, it } from "vitest";
import { formatConsole } from "../src/output/formatConsole.js";

describe("formatConsole", () => {
  it("uses the selected date in the heading", () => {
    expect(formatConsole({
      leagueName: "Premier League",
      date: "2026-08-21",
      matches: [
        {
          id: "match-1",
          leagueKey: "premier-league",
          leagueName: "Premier League",
          kickoffLocal: "21:00",
          homeTeam: "Arsenal",
          awayTeam: "Coventry",
          status: "scheduled",
          source: "flashscore"
        }
      ]
    })).toContain("Premier League - 2026-08-21");
  });
});

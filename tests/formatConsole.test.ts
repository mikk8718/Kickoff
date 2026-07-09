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
          dateLocal: "2026-08-21",
          kickoffLocal: "21:00",
          kickoffTimestampLocal: "2026-08-21 21:00",
          homeTeam: "Arsenal",
          awayTeam: "Coventry",
          status: "scheduled",
          source: "flashscore"
        }
      ]
    })).toContain("Premier League - 2026-08-21");
  });

  it("prints score and minute for live matches", () => {
    expect(formatConsole({
      leagueName: "Live Football",
      date: "2026-07-09",
      matches: [
        {
          id: "match-1",
          leagueKey: "live",
          leagueName: "Live Football",
          minute: "42'",
          homeTeam: "Denmark",
          awayTeam: "Mexico",
          homeScore: "1",
          awayScore: "0",
          status: "live",
          source: "flashscore"
        }
      ]
    })).toContain("42' Denmark 1-0 Mexico");
  });
});

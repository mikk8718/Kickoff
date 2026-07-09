import { describe, expect, it } from "vitest";
import {
  parseFlashscoreDateTime,
  parseFlashscoreRows,
  parseLiveFlashscoreRows
} from "../src/providers/flashscore/FlashscorePageParser.js";
import { leagues } from "../src/leagues/leagues.js";

describe("FlashscorePageParser", () => {
  it("parses Flashscore fixture dates", () => {
    expect(parseFlashscoreDateTime("21.08. 21:00", "2026-08-21")).toEqual({
      date: "2026-08-21",
      time: "21:00"
    });
  });

  it("filters rows to the requested date", () => {
    expect(parseFlashscoreRows({
      league: leagues["premier-league"],
      date: "2026-08-21",
      rows: [
        {
          time: "21.08. 21:00",
          home: "Arsenal",
          away: "Coventry"
        },
        {
          time: "22.08. 13:30",
          home: "Hull",
          away: "Manchester Utd"
        }
      ]
    })).toHaveLength(1);
  });

  it("parses live rows with score and minute", () => {
    expect(parseLiveFlashscoreRows({
      rows: [
        {
          status: "42",
          home: "Denmark",
          away: "Mexico",
          homeScore: "1",
          awayScore: "0"
        },
        {
          status: "Finished",
          home: "Qarabag",
          away: "Vestri",
          homeScore: "3",
          awayScore: "0"
        }
      ]
    })).toEqual([
      expect.objectContaining({
        minute: "42'",
        homeTeam: "Denmark",
        awayTeam: "Mexico",
        homeScore: "1",
        awayScore: "0",
        status: "live"
      })
    ]);
  });

  it("filters live rows by Flashscore competition heading", () => {
    expect(parseLiveFlashscoreRows({
      league: leagues["world-cup"],
      rows: [
        {
          competition: "World Championship - Play OffsWORLD: Draw",
          status: "56",
          home: "France",
          away: "Morocco",
          homeScore: "0",
          awayScore: "0"
        },
        {
          competition: "Liga 1PERU",
          status: "56",
          home: "Grau",
          away: "Carlos Mannucci",
          homeScore: "1",
          awayScore: "1"
        }
      ]
    })).toEqual([
      expect.objectContaining({
        leagueKey: "world-cup",
        leagueName: "World Cup",
        homeTeam: "France",
        awayTeam: "Morocco"
      })
    ]);
  });
});

import { describe, expect, it } from "vitest";
import { parseFlashscoreDateTime, parseFlashscoreRows } from "../src/providers/flashscore/FlashscorePageParser.js";
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
});

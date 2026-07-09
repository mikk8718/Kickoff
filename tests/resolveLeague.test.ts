import { describe, expect, it } from "vitest";
import { resolveLeague, UnknownLeagueError } from "../src/leagues/resolveLeague.js";

describe("resolveLeague", () => {
  it.each([
    ["pl", "premier-league"],
    ["PL", "premier-league"],
    ["premier-league", "premier-league"],
    ["Premier League", "premier-league"],
    ["epl", "premier-league"],
    ["la liga", "la-liga"],
    ["UCL", "champions-league"],
    ["serie a", "serie-a"]
  ])("resolves %s", (input, expectedKey) => {
    expect(resolveLeague(input).key).toBe(expectedKey);
  });

  it("throws for an unknown league", () => {
    expect(() => resolveLeague("prem")).toThrow(UnknownLeagueError);
  });
});

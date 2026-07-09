export type LeagueKey =
  | "premier-league"
  | "la-liga"
  | "champions-league"
  | "world-cup"
  | "bundesliga"
  | "serie-a";

export type LeagueConfig = {
  key: LeagueKey;
  displayName: string;
  country: string;
  aliases: string[];
  flashscoreUrl: string;
};

export const leagues = {
  "premier-league": {
    key: "premier-league",
    displayName: "Premier League",
    country: "england",
    aliases: ["pl", "epl", "premier league"],
    flashscoreUrl: "https://www.flashscore.com/football/england/premier-league/fixtures/"
  },
  "la-liga": {
    key: "la-liga",
    displayName: "La Liga",
    country: "spain",
    aliases: ["laliga", "la liga", "spain"],
    flashscoreUrl: "https://www.flashscore.com/football/spain/laliga/fixtures/"
  },
  "champions-league": {
    key: "champions-league",
    displayName: "Champions League",
    country: "europe",
    aliases: ["cl", "ucl", "champions league"],
    flashscoreUrl: "https://www.flashscore.com/football/europe/champions-league/fixtures/"
  },
  "world-cup": {
    key: "world-cup",
    displayName: "World Cup",
    country: "world",
    aliases: ["wc", "world cup", "fifa world cup", "world championship", "world championship play offs"],
    flashscoreUrl: "https://www.flashscore.com/football/world/world-cup/fixtures/"
  },
  bundesliga: {
    key: "bundesliga",
    displayName: "Bundesliga",
    country: "germany",
    aliases: ["bl", "germany", "bundesliga"],
    flashscoreUrl: "https://www.flashscore.com/football/germany/bundesliga/fixtures/"
  },
  "serie-a": {
    key: "serie-a",
    displayName: "Serie A",
    country: "italy",
    aliases: ["serie a", "italy"],
    flashscoreUrl: "https://www.flashscore.com/football/italy/serie-a/fixtures/"
  }
} satisfies Record<LeagueKey, LeagueConfig>;

export const leagueList = Object.values(leagues);

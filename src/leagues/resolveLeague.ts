import { leagueList, leagues, type LeagueConfig } from "./leagues.js";

export class UnknownLeagueError extends Error {
  readonly suggestion?: LeagueConfig;

  constructor(input: string, suggestion?: LeagueConfig) {
    super(`Unknown league: "${input}"`);
    this.name = "UnknownLeagueError";
    this.suggestion = suggestion;
  }
}

export function resolveLeague(input: string): LeagueConfig {
  const normalized = normalizeLeagueInput(input);
  const directMatch = leagues[normalized as keyof typeof leagues];

  if (directMatch) {
    return directMatch;
  }

  const aliasMatch = leagueList.find((league) =>
    league.aliases.some((alias) => normalizeLeagueInput(alias) === normalized)
  );

  if (aliasMatch) {
    return aliasMatch;
  }

  throw new UnknownLeagueError(input, findClosestLeague(normalized));
}

export function normalizeLeagueInput(input: string): string {
  return input.trim().toLowerCase().replace(/[_\s]+/g, "-");
}

function findClosestLeague(input: string): LeagueConfig | undefined {
  return leagueList.find((league) =>
    [league.key, league.displayName, ...league.aliases].some((candidate) =>
      normalizeLeagueInput(candidate).startsWith(input.slice(0, 3))
    )
  );
}

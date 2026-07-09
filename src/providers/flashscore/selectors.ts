export const flashscoreSelectors = {
  matchRow: ".event__match",
  time: ".event__stageTime",
  stage: ".event__stage",
  homeTeam: ".event__homeParticipant",
  awayTeam: ".event__awayParticipant",
  homeScore: ".event__score--home",
  awayScore: ".event__score--away",
  status: ".event__stage",
  showMoreButton: "button:has-text('Show more matches')"
} as const;

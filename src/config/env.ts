export const env = {
  cacheDir: process.env.FOOTBALL_CACHE_DIR ?? ".cache",
  cacheTtlSeconds: Number(process.env.FOOTBALL_CACHE_TTL_SECONDS ?? 21_600),
  timezone: process.env.FOOTBALL_TIMEZONE ?? "Europe/Copenhagen"
};

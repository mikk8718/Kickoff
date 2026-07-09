import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

type CacheEnvelope<T> = {
  createdAt: string;
  data: T;
};

export class FileCache {
  constructor(private readonly cacheDir: string) {}

  async get<T>(key: string, ttlSeconds?: number): Promise<T | undefined> {
    try {
      const envelope = JSON.parse(await readFile(this.pathForKey(key), "utf8")) as CacheEnvelope<T>;

      if (ttlSeconds !== undefined) {
        const ageMs = Date.now() - new Date(envelope.createdAt).getTime();

        if (ageMs > ttlSeconds * 1000) {
          return undefined;
        }
      }

      return envelope.data;
    } catch {
      return undefined;
    }
  }

  async set<T>(key: string, data: T): Promise<void> {
    await mkdir(this.cacheDir, { recursive: true });
    await writeFile(
      this.pathForKey(key),
      JSON.stringify(
        {
          createdAt: new Date().toISOString(),
          data
        },
        null,
        2
      )
    );
  }

  private pathForKey(key: string): string {
    return join(this.cacheDir, `${key.replace(/[^a-zA-Z0-9.-]/g, "-")}.json`);
  }
}

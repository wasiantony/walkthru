// Screenshot storage. Local disk is the dev fallback; an S3-compatible driver
// plugs in behind the same interface (STORAGE_DRIVER=s3).
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export interface Storage {
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer | null>;
}

function assertSafeKey(key: string) {
  if (!/^[a-z0-9][a-z0-9/_.-]*$/i.test(key) || key.includes("..")) {
    throw new Error(`Unsafe storage key: ${key}`);
  }
}

class LocalDiskStorage implements Storage {
  constructor(private readonly root: string) {}

  async put(key: string, data: Buffer) {
    assertSafeKey(key);
    const file = path.join(this.root, key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, data);
  }

  async get(key: string) {
    assertSafeKey(key);
    try {
      return await readFile(path.join(this.root, key));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw err;
    }
  }
}

export function getStorage(): Storage {
  const driver = process.env.STORAGE_DRIVER ?? "local";
  if (driver === "local") {
    return new LocalDiskStorage(path.resolve(process.env.STORAGE_DIR ?? "./storage"));
  }
  throw new Error(`STORAGE_DRIVER "${driver}" is not available yet. Use "local".`);
}

export function contentTypeFor(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "application/octet-stream";
}

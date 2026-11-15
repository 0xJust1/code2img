// Share image storage: plain files on the web host's disk (native deploy v1).
// Object-store shape (key -> bytes) so R2/S3 drops in by swapping these three functions.
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const KEY_RE = /^[\w-]+\.[a-z]{2,5}$/;

export function storageDir(): string {
  return process.env.SHARE_IMAGES_DIR ?? path.join(process.cwd(), "data", "share");
}

// Keys are generated server-side, but re-check them: they reach a filesystem path.
function fileFor(key: string): string | null {
  return KEY_RE.test(key) ? path.join(storageDir(), key) : null;
}

export async function putObject(key: string, buf: Uint8Array): Promise<void> {
  const file = fileFor(key);
  if (!file) throw new Error("invalid storage key");
  await mkdir(storageDir(), { recursive: true });
  await writeFile(file, buf);
}

export async function getObject(key: string): Promise<Buffer | null> {
  const file = fileFor(key);
  if (!file) return null;
  try {
    return await readFile(file);
  } catch {
    return null;
  }
}

export async function deleteObject(key: string): Promise<void> {
  const file = fileFor(key);
  if (!file) return;
  try {
    await unlink(file);
  } catch {
    // already gone: deleting a share twice is not an error
  }
}
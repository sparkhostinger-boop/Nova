import fs from "fs-extra";
import path from "path";

const DATA_DIR = path.join(process.cwd(), ".data");

// In-memory cache for fast, zero-allocation reads with invalidation on write
const fileCache: Record<string, { data: any; mtime: number }> = {};

export const readJSON = async (filename: string) => {
  const filePath = path.join(DATA_DIR, filename);
  try {
    const stat = await fs.stat(filePath).catch(() => null);
    if (!stat) return null;

    const cached = fileCache[filename];
    if (cached && cached.mtime === stat.mtimeMs) {
      return cached.data;
    }

    const data = await fs.readJson(filePath);
    fileCache[filename] = { data, mtime: stat.mtimeMs };
    return data;
  } catch (err) {
    return null;
  }
};

export const writeJSON = async (filename: string, data: any) => {
  const filePath = path.join(DATA_DIR, filename);
  await fs.writeJson(filePath, data, { spaces: 2 });
  delete fileCache[filename];
};

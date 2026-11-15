import { promises as fs } from "node:fs";
import path from "node:path";
import { get, list, put } from "@vercel/blob";
import type { BriefItem, DeepDive } from "./types";

// All data lives in a *private* Vercel Blob store, so nothing is readable
// without the server's BLOB_READ_WRITE_TOKEN. In local development without a
// token, files go to ./.localdata instead.

const LOCAL = !process.env.BLOB_READ_WRITE_TOKEN && process.env.NODE_ENV !== "production";
const LOCAL_DIR = path.join(process.cwd(), ".localdata");

async function readJson<T>(pathname: string): Promise<T | null> {
  if (LOCAL) {
    try {
      return JSON.parse(await fs.readFile(path.join(LOCAL_DIR, pathname), "utf8")) as T;
    } catch {
      return null;
    }
  }
  const result = await get(pathname, { access: "private", useCache: false });
  if (!result || !result.stream) return null;
  return (await new Response(result.stream).json()) as T;
}

async function writeJson(pathname: string, data: unknown): Promise<void> {
  if (LOCAL) {
    const file = path.join(LOCAL_DIR, pathname);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(data, null, 2));
    return;
  }
  await put(pathname, JSON.stringify(data), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

async function listPaths(prefix: string): Promise<string[]> {
  if (LOCAL) {
    try {
      const files = await fs.readdir(path.join(LOCAL_DIR, prefix), { recursive: true });
      return files.map((f) => path.posix.join(prefix, String(f).split(path.sep).join("/")));
    } catch {
      return [];
    }
  }
  const paths: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, cursor });
    paths.push(...page.blobs.map((b) => b.pathname));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return paths;
}

const pad = (n: number) => String(n).padStart(2, "0");
const itemPath = (date: string, slot: number) => `briefs/${date}/slot-${pad(slot)}.json`;
const deepDivePath = (date: string, slot: number) => `deepdives/${date}/slot-${pad(slot)}.json`;

export async function saveItem(date: string, item: BriefItem) {
  await writeJson(itemPath(date, item.slot), item);
}

export async function getItem(date: string, slot: number) {
  return readJson<BriefItem>(itemPath(date, slot));
}

export async function getBrief(date: string): Promise<BriefItem[]> {
  const paths = await listPaths(`briefs/${date}/`);
  const items = await Promise.all(
    paths.filter((p) => p.endsWith(".json")).map((p) => readJson<BriefItem>(p)),
  );
  return items.filter((i): i is BriefItem => i !== null).sort((a, b) => a.slot - b.slot);
}

/** All dates that have at least one item, newest first. */
export async function listDates(): Promise<string[]> {
  const dates = new Set<string>();
  for (const p of await listPaths("briefs/")) {
    const m = p.match(/^briefs\/(\d{4}-\d{2}-\d{2})\//);
    if (m) dates.add(m[1]);
  }
  return [...dates].sort().reverse();
}

/** Items from the previous `days` days (excluding `today`), for the no-repeats rule. */
export async function recentItems(today: string, days = 7): Promise<BriefItem[]> {
  const dates = (await listDates()).filter((d) => d < today).slice(0, days);
  const briefs = await Promise.all(dates.map((d) => getBrief(d)));
  return briefs.flat().filter((i) => i.found);
}

export async function getDeepDive(date: string, slot: number) {
  return readJson<DeepDive>(deepDivePath(date, slot));
}

export async function saveDeepDive(dd: DeepDive) {
  await writeJson(deepDivePath(dd.date, dd.slot), dd);
}

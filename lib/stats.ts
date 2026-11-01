import "server-only";
import { kv } from "./kv";

function day(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export async function recordStat(s: {
  images?: number;
  previews?: number;
  failures?: number;
  costMilliCents?: number;
  revenueCents?: number;
  orders?: number;
  subscriptions?: number;
  leads?: number;
}): Promise<void> {
  const ops: Promise<number>[] = [];
  for (const [field, value] of Object.entries(s)) {
    if (!value) continue;
    ops.push(kv().hincrby("stats:all", field, value));
    ops.push(kv().hincrby(`stats:${day()}`, field, value));
  }
  await Promise.all(ops);
}

export async function todayCostCents(): Promise<number> {
  const h = await kv().hgetall(`stats:${day()}`);
  return Math.round(Number(h.costMilliCents ?? 0) / 1000);
}

export async function readStats(days = 14): Promise<{ total: Record<string, number>; daily: { day: string; v: Record<string, number> }[] }> {
  const toNum = (h: Record<string, string>) => Object.fromEntries(Object.entries(h).map(([k, v]) => [k, Number(v)]));
  const total = toNum(await kv().hgetall("stats:all"));
  const daily = [];
  for (let i = 0; i < days; i++) {
    const d = day(new Date(Date.now() - i * 86400000));
    daily.push({ day: d, v: toNum(await kv().hgetall(`stats:${d}`)) });
  }
  return { total, daily };
}

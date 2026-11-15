import { isAuthed, isCron } from "@/lib/auth";
import { researchSlot } from "@/lib/claude";
import { brisbaneToday } from "@/lib/dates";
import { SLOTS } from "@/lib/slots";
import { getItem, recentItems, saveItem } from "@/lib/store";

// Each slot is its own function call, so each gets the full time limit and
// one slow search can't sink the whole brief.
export const maxDuration = 300;
export const dynamic = "force-dynamic";

async function run(req: Request, n: number, force: boolean) {
  const slot = SLOTS.find((s) => s.n === n);
  if (!slot) return Response.json({ error: "unknown slot" }, { status: 404 });

  const date = brisbaneToday();
  if (!force) {
    const existing = await getItem(date, n);
    if (existing?.found) return Response.json({ skipped: true, item: existing });
  }

  const recent = await recentItems(date);
  const others = SLOTS.filter((s) => s.n !== n);
  const signal = AbortSignal.timeout(285_000);

  let item;
  try {
    item = await researchSlot(slot, others, recent, signal);
  } catch (err) {
    console.error(`slot ${n} failed`, err);
    item = {
      slot: slot.n,
      slotName: slot.name,
      found: false,
      title: "",
      url: "",
      outlet: "",
      sourceType: "",
      published: "",
      summary: "",
      whyRead: "",
      paywalled: false,
      preprint: false,
      dateEvidence: "",
      emptyReason: signal.aborted ? "Research ran out of time today." : "Research failed with an error today.",
      generatedAt: new Date().toISOString(),
    };
  }
  // Don't overwrite a good item with a failed retry.
  const existing = await getItem(date, n);
  if (!item.found && existing?.found) return Response.json({ kept: true, item: existing });

  await saveItem(date, item);
  return Response.json({ item });
}

// Vercel Cron
export async function GET(req: Request, ctx: { params: Promise<{ n: string }> }) {
  if (!isCron(req)) return new Response("Unauthorized", { status: 401 });
  const { n } = await ctx.params;
  return run(req, Number(n), false);
}

// "Generate now" / "Retry" buttons in the app
export async function POST(req: Request, ctx: { params: Promise<{ n: string }> }) {
  if (!(await isAuthed())) return new Response("Unauthorized", { status: 401 });
  const { n } = await ctx.params;
  const force = new URL(req.url).searchParams.get("force") === "1";
  return run(req, Number(n), force);
}

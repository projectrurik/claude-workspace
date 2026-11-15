import { isAuthed } from "@/lib/auth";
import { streamDeepDive } from "@/lib/claude";
import { isDate } from "@/lib/dates";
import { getDeepDive, getItem, saveDeepDive } from "@/lib/store";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// Streams newline-delimited JSON: {"t":"status"|"text"|"done"|"error","v":...}
export async function POST(req: Request) {
  if (!(await isAuthed())) return new Response("Unauthorized", { status: 401 });

  const body = (await req.json().catch(() => null)) as
    | { date?: string; slot?: number; question?: string }
    | null;
  const date = body?.date ?? "";
  const slot = Number(body?.slot);
  const question = (body?.question ?? "").trim().slice(0, 2000) || "Tell me more about this.";
  if (!isDate(date) || !Number.isInteger(slot)) {
    return Response.json({ error: "bad request" }, { status: 400 });
  }

  const item = await getItem(date, slot);
  if (!item?.found) return Response.json({ error: "item not found" }, { status: 404 });
  const existing = (await getDeepDive(date, slot)) ?? { date, slot, turns: [] };

  const encoder = new TextEncoder();
  const send = (controller: ReadableStreamDefaultController, obj: unknown) =>
    controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const gen = streamDeepDive(item, existing.turns, question, AbortSignal.timeout(290_000));
        let result = await gen.next();
        while (!result.done) {
          send(controller, result.value);
          result = await gen.next();
        }
        const answer = result.value;
        if (answer.trim()) {
          existing.turns.push({ question, answer, createdAt: new Date().toISOString() });
          await saveDeepDive(existing);
        }
        send(controller, { t: "done" });
      } catch (err) {
        console.error("deep dive failed", err);
        send(controller, { t: "error", v: "Something went wrong. Try again in a minute." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}

import Anthropic from "@anthropic-ai/sdk";
import { BLOCKED_DOMAINS, type Slot } from "./slots";
import type { BriefItem, DeepDiveTurn } from "./types";

export const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";
const EFFORT = (process.env.CLAUDE_EFFORT || "high") as "low" | "medium" | "high" | "xhigh" | "max";

// maxRetries is raised because ten slots run at once and a new API account
// has low rate limits; the SDK waits for `retry-after` between attempts.
export const client = new Anthropic({ maxRetries: 6 });

// Server-side fallback: if the model declines a request, the API re-runs it
// on a fallback model inside the same call instead of returning nothing.
const FALLBACK = {
  betas: ["server-side-fallback-2026-07-01"],
  fallbacks: "default" as const,
};

const webTools: Anthropic.Beta.BetaToolUnion[] = [
  { type: "web_search_20260209", name: "web_search", max_uses: 6, blocked_domains: BLOCKED_DOMAINS },
  { type: "web_fetch_20260209", name: "web_fetch", max_uses: 4, blocked_domains: BLOCKED_DOMAINS },
];

// ---------------------------------------------------------------------------
// Daily brief: one slot per call
// ---------------------------------------------------------------------------

const submitItemTool: Anthropic.Beta.BetaTool = {
  name: "submit_item",
  description:
    "Submit the single item you chose for this slot. Call this exactly once, at the end. If nothing qualifies, call it with found=false and explain why in empty_reason (other text fields empty).",
  strict: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "found",
      "title",
      "url",
      "outlet",
      "source_type",
      "published",
      "summary",
      "why_read",
      "paywalled",
      "preprint",
      "date_evidence",
      "empty_reason",
    ],
    properties: {
      found: { type: "boolean" },
      title: { type: "string", description: "The article's real headline." },
      url: { type: "string", description: "Direct link to the article on the original publisher's site." },
      outlet: { type: "string", description: "Publication name, e.g. 'Quanta Magazine'." },
      source_type: {
        type: "string",
        description:
          "e.g. 'peer-reviewed journal', 'preprint (not yet peer-reviewed)', 'mainstream', 'independent', 'nonprofit investigative', 'public broadcaster', 'specialist magazine', 'academic analysis'.",
      },
      published: { type: "string", description: "Publication date as YYYY-MM-DD." },
      summary: { type: "string", description: "2–3 plain sentences: what it says, with the key specifics." },
      why_read: { type: "string", description: "One sentence on why it's worth this reader's time." },
      paywalled: { type: "boolean" },
      preprint: { type: "boolean" },
      date_evidence: {
        type: "string",
        description: "How you confirmed the date, e.g. 'date in URL', 'byline on fetched page: 14 Nov 2026'.",
      },
      empty_reason: { type: "string" },
    },
  },
};

const SLOT_SYSTEM = `You research one item for a personal daily brief read by a curious person in Brisbane, Australia, who wants to learn about advancements, innovations, social commentary, skills and news from a deliberately varied mix of high-quality sources.

Rules:
1. Freshness: the item must have been published within the 48 hours before the current time given below. Confirm the publication date from the date in the URL, the publisher's own listing, or by fetching the page and reading its dateline. If you cannot confirm the date, do not use the item. Never guess a date.
2. Link only to the original publisher's article page: never an aggregator, homepage, section page, tag page or search result page.
3. Use only legitimate, reputable outlets. The listed sources are good starting points, not limits, but do not use outlets reserved for other slots (listed below).
4. Don't repeat anything in the "recently used" list, and prefer a different outlet from those used recently.
5. Never invent a title, URL, date or detail. Take the title and summary from what the source actually says.
6. Pick the most interesting, substantive item rather than the first one you find. Search efficiently: a few targeted searches, then fetch your top candidate to verify its date and details.
7. Finish by calling submit_item exactly once. If nothing qualifies, call it with found=false and say why.`;

function slotPrompt(slot: Slot, otherSlots: Slot[], recent: BriefItem[], now: Date) {
  const reserved = otherSlots.flatMap((s) => s.sources).join(", ");
  const recentList = recent.length
    ? recent.map((i) => `- ${i.outlet}: ${i.url}`).join("\n")
    : "(none yet)";
  return `Current time (UTC): ${now.toISOString()}
Only items published on or after ${new Date(now.getTime() - 48 * 3600 * 1000).toISOString()} qualify.

Slot ${slot.n}: ${slot.name}
What to look for: ${slot.brief}
Suggested sources: ${slot.sources.join(", ")}

Outlets reserved for other slots (don't use): ${reserved}

Recently used (don't repeat these articles; prefer other outlets):
${recentList}`;
}

function emptyItem(slot: Slot, reason: string): BriefItem {
  return {
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
    emptyReason: reason,
    generatedAt: new Date().toISOString(),
  };
}

interface SubmitInput {
  found: boolean;
  title: string;
  url: string;
  outlet: string;
  source_type: string;
  published: string;
  summary: string;
  why_read: string;
  paywalled: boolean;
  preprint: boolean;
  date_evidence: string;
  empty_reason: string;
}

function toItem(slot: Slot, input: SubmitInput): BriefItem {
  if (!input.found) return emptyItem(slot, input.empty_reason || "Nothing qualified today.");
  let url: URL;
  try {
    url = new URL(input.url);
  } catch {
    return emptyItem(slot, "The chosen item had an invalid link, so it was dropped.");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return emptyItem(slot, "The chosen item had an invalid link, so it was dropped.");
  }
  return {
    slot: slot.n,
    slotName: slot.name,
    found: true,
    title: input.title,
    url: url.toString(),
    outlet: input.outlet,
    sourceType: input.source_type,
    published: input.published,
    summary: input.summary,
    whyRead: input.why_read,
    paywalled: input.paywalled,
    preprint: input.preprint,
    dateEvidence: input.date_evidence,
    generatedAt: new Date().toISOString(),
  };
}

export async function researchSlot(
  slot: Slot,
  otherSlots: Slot[],
  recent: BriefItem[],
  signal?: AbortSignal,
): Promise<BriefItem> {
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    { role: "user", content: slotPrompt(slot, otherSlots, recent, new Date()) },
  ];
  let nudged = false;

  for (let turn = 0; turn < 8; turn++) {
    const stream = client.beta.messages.stream(
      {
        model: MODEL,
        max_tokens: 32000,
        output_config: { effort: EFFORT },
        system: [{ type: "text", text: SLOT_SYSTEM, cache_control: { type: "ephemeral" } }],
        tools: [...webTools, submitItemTool],
        messages,
        ...FALLBACK,
      },
      { signal },
    );
    const message = await stream.finalMessage();

    if (message.stop_reason === "refusal") {
      return emptyItem(slot, "The model declined this search today.");
    }

    const submit = message.content.find(
      (b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use" && b.name === "submit_item",
    );
    if (submit && message.stop_reason !== "max_tokens") {
      return toItem(slot, submit.input as SubmitInput);
    }

    // Keep the full content (including thinking and search results) so the
    // conversation stays append-only.
    messages.push({ role: "assistant", content: message.content });

    if (message.stop_reason === "pause_turn") continue; // server resumes the search loop

    if (nudged) break;
    nudged = true;
    messages.push({
      role: "user",
      content: "Please call submit_item now with your best verified pick, or with found=false.",
    });
  }
  return emptyItem(slot, "The search didn't finish cleanly today.");
}

// ---------------------------------------------------------------------------
// "Tell me more": streamed deep dive on one item
// ---------------------------------------------------------------------------

const DEEP_DIVE_SYSTEM = `You write deep dives for a curious reader in Brisbane, Australia, who tapped "tell me more" on an item in their daily brief. Give them real substance, not filler.

Research with web search and web fetch. Background sources can be older than the item, as long as they're reputable. Cover both:
- The facts: what the article or study actually says, the key numbers and who is involved, the background and history, how it fits the wider field, what's genuinely new, and the limitations or open questions. For research, find the primary paper and any independent expert reaction. If other outlets' accounts differ, say how.
- The conversation around it: how it's being discussed in opinion pieces, essays, expert commentary and by advocates and critics, plus what it means for ordinary people (and for Australia, where relevant). Present a genuine range of viewpoints, attribute each one, don't take sides, and say where the evidence is strong or weak.

Format, in Markdown:
- Open with a 1–2 sentence answer to the question.
- ## The facts
- ## The conversation around it
- ## What's still unknown or contested
- ## Go deeper: 3–6 links, each with the outlet, date and a one-line description

Aim for a 4–6 minute read. Link every factual claim and quote to a source you actually found, using Markdown links. Never invent links, quotes or numbers. If you can't find much, say so plainly. For a follow-up question, answer that question directly and keep the same standards; skip any section that doesn't fit.`;

export type DeepDiveEvent =
  | { t: "status"; v: string }
  | { t: "text"; v: string };

/** Streams a deep dive. Yields status updates while searching, then text. Returns the full answer. */
export async function* streamDeepDive(
  item: BriefItem,
  history: DeepDiveTurn[],
  question: string,
  signal?: AbortSignal,
): AsyncGenerator<DeepDiveEvent, string> {
  const context = `The item from today's brief (slot: ${item.slotName}):
Title: ${item.title}
Outlet: ${item.outlet} (${item.sourceType}), published ${item.published}
URL: ${item.url}
Summary: ${item.summary}`;

  const messages: Anthropic.Beta.BetaMessageParam[] = [];
  history.forEach((turn, i) => {
    messages.push({ role: "user", content: i === 0 ? `${context}\n\n${turn.question}` : turn.question });
    messages.push({ role: "assistant", content: turn.answer });
  });
  messages.push({
    role: "user",
    content: history.length === 0 ? `${context}\n\n${question}` : question,
  });

  let answer = "";
  for (let turn = 0; turn < 6; turn++) {
    const stream = client.beta.messages.stream(
      {
        model: MODEL,
        max_tokens: 32000,
        output_config: { effort: EFFORT },
        system: [{ type: "text", text: DEEP_DIVE_SYSTEM, cache_control: { type: "ephemeral" } }],
        tools: [
          { type: "web_search_20260209", name: "web_search", max_uses: 8, blocked_domains: BLOCKED_DOMAINS },
          { type: "web_fetch_20260209", name: "web_fetch", max_uses: 5, blocked_domains: BLOCKED_DOMAINS },
        ],
        messages,
        ...FALLBACK,
      },
      { signal },
    );

    for await (const event of stream) {
      if (event.type === "content_block_start" && event.content_block.type === "server_tool_use") {
        const name = event.content_block.name;
        yield { t: "status", v: name === "web_fetch" ? "Reading a source…" : "Searching…" };
      } else if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        answer += event.delta.text;
        yield { t: "text", v: event.delta.text };
      }
    }
    const message = await stream.finalMessage();

    if (message.stop_reason === "refusal") {
      const note = "\n\n*The model declined to go further on this one.*";
      answer += note;
      yield { t: "text", v: note };
      break;
    }
    if (message.stop_reason !== "pause_turn") break;
    // Server-side search loop paused: resend with the partial turn and it resumes.
    messages.push({ role: "assistant", content: message.content });
  }
  return answer;
}

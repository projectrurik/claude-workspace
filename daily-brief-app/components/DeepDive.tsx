"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { DeepDiveTurn } from "@/lib/types";

function Markdown({ text }: { text: string }) {
  return (
    <div className="prose">
      <ReactMarkdown
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

export function DeepDive({
  date,
  slot,
  initialTurns,
}: {
  date: string;
  slot: number;
  initialTurns: DeepDiveTurn[];
}) {
  const [turns, setTurns] = useState(initialTurns);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [streamed, setStreamed] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");

  async function ask(question: string) {
    setPendingQuestion(question);
    setStreamed("");
    setError("");
    setStatus("Starting research…");
    let answer = "";
    try {
      const res = await fetch("/api/deepdive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, slot, question }),
      });
      if (!res.ok || !res.body) throw new Error(String(res.status));
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const ev = JSON.parse(line) as { t: string; v?: string };
          if (ev.t === "status") setStatus(ev.v ?? "");
          else if (ev.t === "text") {
            answer += ev.v ?? "";
            setStreamed(answer);
            setStatus("");
          } else if (ev.t === "error") setError(ev.v ?? "Something went wrong.");
        }
      }
      if (answer.trim()) {
        setTurns((t) => [...t, { question, answer, createdAt: new Date().toISOString() }]);
      }
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setPendingQuestion(null);
      setStreamed("");
      setStatus("");
    }
  }

  const busy = pendingQuestion !== null;

  return (
    <section>
      {turns.map((turn, i) => (
        <div key={i}>
          <div className="question">{turn.question}</div>
          <Markdown text={turn.answer} />
        </div>
      ))}

      {busy && (
        <div>
          <div className="question">{pendingQuestion}</div>
          {status && <p className="status">{status}</p>}
          {streamed && <Markdown text={streamed} />}
        </div>
      )}

      {error && <p className="status">{error}</p>}

      {!busy && turns.length === 0 && (
        <div className="row">
          <button className="button" onClick={() => ask("Tell me more about this.")}>
            Tell me more
          </button>
          <button
            className="button secondary"
            onClick={() => ask("What are people saying about this? Give me the range of views.")}
          >
            What are people saying?
          </button>
        </div>
      )}

      {!busy && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const q = draft.trim();
            if (!q) return;
            setDraft("");
            ask(q);
          }}
          style={{ marginTop: 18 }}
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={turns.length ? "Ask a follow-up…" : "Or ask your own question about this…"}
          />
          <div className="row">
            <button className="button" type="submit" disabled={!draft.trim()}>
              Ask
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

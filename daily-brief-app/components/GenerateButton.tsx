"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Starts research for the given slots, each as its own request, and refreshes
// the page as each one lands. Takes 1–4 minutes.
export function GenerateButton({ slots, label }: { slots: number[]; label: string }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [failed, setFailed] = useState(0);

  async function start() {
    setRunning(true);
    setDone(0);
    setFailed(0);
    await Promise.all(
      slots.map(async (n) => {
        try {
          const res = await fetch(`/api/generate/${n}?force=1`, { method: "POST" });
          if (!res.ok) throw new Error(String(res.status));
        } catch {
          setFailed((f) => f + 1);
        } finally {
          setDone((d) => d + 1);
          router.refresh();
        }
      }),
    );
    setRunning(false);
  }

  return (
    <div>
      <button className="button" onClick={start} disabled={running}>
        {running ? `Researching… ${done}/${slots.length}` : label}
      </button>
      {running && (
        <p className="status">
          Each item is researched and fact-checked separately. This takes a few minutes, so keep this
          page open.
        </p>
      )}
      {!running && failed > 0 && <p className="status">{failed} request(s) failed. Try again.</p>}
    </div>
  );
}

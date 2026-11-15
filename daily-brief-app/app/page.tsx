import { BriefView, TopBar } from "@/components/BriefView";
import { GenerateButton } from "@/components/GenerateButton";
import { requireAuth } from "@/lib/auth";
import { brisbaneToday, prettyDate } from "@/lib/dates";
import { SLOTS } from "@/lib/slots";
import { getBrief, listDates } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  await requireAuth();
  const today = brisbaneToday();
  const items = await getBrief(today);
  const missing = SLOTS.map((s) => s.n).filter((n) => !items.some((i) => i.slot === n));
  const empty = items.filter((i) => !i.found).map((i) => i.slot);

  // Nothing for today yet: show the most recent brief underneath.
  let fallbackDate: string | null = null;
  let fallbackItems: Awaited<ReturnType<typeof getBrief>> = [];
  if (items.length === 0) {
    fallbackDate = (await listDates()).find((d) => d !== today) ?? null;
    if (fallbackDate) fallbackItems = await getBrief(fallbackDate);
  }

  return (
    <main>
      <TopBar />
      <p className="subtitle">
        {prettyDate(today)}
        {items.length > 0 && ` · ${items.filter((i) => i.found).length} items`}
      </p>

      {items.length === 0 && (
        <div className="card">
          <p className="summary" style={{ marginBottom: 12 }}>
            Today&apos;s brief arrives automatically between 5 and 6am. It isn&apos;t here yet, but you
            can start it now.
          </p>
          <GenerateButton slots={SLOTS.map((s) => s.n)} label="Generate today's brief" />
        </div>
      )}

      {items.length > 0 && <BriefView date={today} items={items} />}

      {items.length > 0 && (missing.length > 0 || empty.length > 0) && (
        <GenerateButton
          slots={[...missing, ...empty]}
          label={`Retry ${missing.length + empty.length} empty slot(s)`}
        />
      )}

      {fallbackDate && (
        <>
          <p className="subtitle" style={{ marginTop: 28 }}>
            Most recent: {prettyDate(fallbackDate)}
          </p>
          <BriefView date={fallbackDate} items={fallbackItems} />
        </>
      )}

      <p className="footer-note">
        Every item was published in the 48 hours before it was picked, with the date checked against
        the URL, the publisher&apos;s listing or the page itself. Tap any item for a deeper dive.
      </p>
    </main>
  );
}

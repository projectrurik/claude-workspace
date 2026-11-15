import Link from "next/link";
import { notFound } from "next/navigation";
import { ItemMeta, TopBar } from "@/components/BriefView";
import { DeepDive } from "@/components/DeepDive";
import { requireAuth } from "@/lib/auth";
import { isDate, prettyDate } from "@/lib/dates";
import { getDeepDive, getItem } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ItemPage({ params }: { params: Promise<{ date: string; n: string }> }) {
  await requireAuth();
  const { date, n } = await params;
  const slot = Number(n);
  if (!isDate(date) || !Number.isInteger(slot)) notFound();

  const [item, deepDive] = await Promise.all([getItem(date, slot), getDeepDive(date, slot)]);
  if (!item?.found) notFound();

  return (
    <main>
      <TopBar />
      <p className="subtitle">
        <Link href={`/brief/${date}`}>← {prettyDate(date)}</Link>
      </p>

      <div className="slot">
        {item.slot}. {item.slotName}
      </div>
      <h2 className="title" style={{ fontSize: 24 }}>
        {item.title}
      </h2>
      <ItemMeta item={item} />
      <p className="summary">{item.summary}</p>
      <p className="why">
        <strong>Why read:</strong> {item.whyRead}
      </p>
      <div className="row">
        <a className="button secondary" href={item.url} target="_blank" rel="noopener noreferrer">
          Read the original ↗
        </a>
      </div>
      <p className="footer-note" style={{ marginTop: 0 }}>
        Date checked: {item.dateEvidence}
      </p>

      <DeepDive date={date} slot={slot} initialTurns={deepDive?.turns ?? []} />
    </main>
  );
}

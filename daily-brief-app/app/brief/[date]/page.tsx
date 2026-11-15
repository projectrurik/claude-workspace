import { notFound } from "next/navigation";
import { BriefView, TopBar } from "@/components/BriefView";
import { requireAuth } from "@/lib/auth";
import { isDate, prettyDate } from "@/lib/dates";
import { getBrief } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function BriefPage({ params }: { params: Promise<{ date: string }> }) {
  await requireAuth();
  const { date } = await params;
  if (!isDate(date)) notFound();
  const items = await getBrief(date);
  if (items.length === 0) notFound();

  return (
    <main>
      <TopBar />
      <p className="subtitle">
        {prettyDate(date)} · {items.filter((i) => i.found).length} items
      </p>
      <BriefView date={date} items={items} />
    </main>
  );
}

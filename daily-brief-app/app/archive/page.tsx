import Link from "next/link";
import { TopBar } from "@/components/BriefView";
import { requireAuth } from "@/lib/auth";
import { prettyDate } from "@/lib/dates";
import { listDates } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Archive() {
  await requireAuth();
  const dates = await listDates();
  return (
    <main>
      <TopBar />
      <p className="subtitle">Past days</p>
      <div className="archive">
        {dates.length === 0 && <p className="status">Nothing yet.</p>}
        {dates.map((d) => (
          <Link key={d} href={`/brief/${d}`}>
            {prettyDate(d)}
          </Link>
        ))}
      </div>
    </main>
  );
}

import Link from "next/link";
import type { BriefItem } from "@/lib/types";
import { shortDate } from "@/lib/dates";

export function ItemMeta({ item }: { item: BriefItem }) {
  return (
    <div className="meta">
      {item.outlet} · {item.sourceType} · {item.published ? shortDate(item.published) : ""}
      {item.preprint && <span className="tag">preprint</span>}
      {item.paywalled && <span className="tag">paywall</span>}
    </div>
  );
}

export function BriefView({ date, items }: { date: string; items: BriefItem[] }) {
  return (
    <div>
      {items.map((item) =>
        item.found ? (
          <Link key={item.slot} href={`/item/${date}/${item.slot}`} className="card">
            <div className="slot">
              {item.slot}. {item.slotName}
            </div>
            <h2 className="title">{item.title}</h2>
            <ItemMeta item={item} />
            <p className="summary">{item.summary}</p>
          </Link>
        ) : (
          <div key={item.slot} className="card empty">
            <div className="slot">
              {item.slot}. {item.slotName}
            </div>
            <p className="why">Empty today: {item.emptyReason}</p>
          </div>
        ),
      )}
    </div>
  );
}

export function TopBar() {
  return (
    <div className="topbar">
      <Link href="/" style={{ textDecoration: "none" }}>
        <h1>Daily Brief</h1>
      </Link>
      <nav>
        <Link href="/">Today</Link>
        <Link href="/archive">Past days</Link>
      </nav>
    </div>
  );
}

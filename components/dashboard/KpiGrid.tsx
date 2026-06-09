import { KpiCard } from "./KpiCard";

interface KpiItem {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: string;
}

interface KpiGridProps {
  items: KpiItem[];
}

export function KpiGrid({ items }: KpiGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {items.map((item) => (
        <KpiCard key={item.title} {...item} />
      ))}
    </div>
  );
}

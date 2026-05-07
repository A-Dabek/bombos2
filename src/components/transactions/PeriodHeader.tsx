import { component$ } from "@builder.io/qwik";
import { getOrdinal } from "~/utils/date";

interface PeriodHeaderProps {
  startTs: number;       // unix ts, 0 = default "Transactions"
  endTs?: number;        // optional — if present, renders "– endDate" suffix
}

function formatDate(ts: number): string {
  const d = new Date(ts * 1000);
  const month = d.toLocaleString("en-US", { month: "long" });
  const day = d.getDate();
  return `${month} ${day}${getOrdinal(day)}, ${d.getFullYear()}`;
}

export default component$<PeriodHeaderProps>(({ startTs, endTs }) => {
  let label: string;
  if (startTs === 0) {
    label = "Transactions";
  } else if (endTs) {
    label = `${formatDate(startTs)} – ${formatDate(endTs)}`;
  } else {
    label = formatDate(startTs);
  }

  return (
    <div data-testid="period-header" class="flex items-center gap-2 border-b border-gray-200 pb-1 mt-4">
      <span class="text-sm font-semibold text-gray-700">{label}</span>
    </div>
  );
});

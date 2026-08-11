import { component$ } from "@builder.io/qwik";
import { formatPolishDate } from "~/utils/date";

interface PeriodHeaderProps {
  startTs: number;       // unix ts, 0 = default "Transactions"
  endTs?: number;        // optional — if present, renders "– endDate" suffix
}

function formatDate(ts: number): string {
  const d = new Date(ts * 1000);
  return `${formatPolishDate(d)}, ${d.getFullYear()}`;
}

export default component$<PeriodHeaderProps>(({ startTs, endTs }) => {
  let label: string;
  if (startTs === 0) {
    label = "Transakcje";
  } else if (endTs) {
    label = `${formatDate(startTs)} – ${formatDate(endTs)}`;
  } else {
    label = formatDate(startTs);
  }

  return (
    <div data-testid="period-header" class="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-1 mt-4">
      <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</span>
    </div>
  );
});

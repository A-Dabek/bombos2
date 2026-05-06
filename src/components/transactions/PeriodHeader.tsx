import { component$ } from "@builder.io/qwik";

interface PeriodHeaderProps {
  periodLabel: string;
}

export default component$<PeriodHeaderProps>(({ periodLabel }) => {
  return (
    <div data-testid="period-header" class="flex items-center gap-2 border-b border-gray-200 pb-1 mt-4">
      <span class="text-sm font-semibold text-gray-700">{periodLabel}</span>
    </div>
  );
});
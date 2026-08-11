import { component$ } from "@builder.io/qwik";
import BackButton from "~/components/shared/BackButton";
import DayOfMonthConfigSection from "~/components/shared/DayOfMonthConfigSection";
import PeriodStartButton from "~/components/shared/PeriodStartButton";

export default component$(() => {
  return (
    <div class="p-4">
      <BackButton href="/money/balance" />
      <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Zarządzanie saldem</h1>

      <DayOfMonthConfigSection
        configEndpoint="/api/balance/config"
        saveTestId="balance-config-save"
        dayId="day-of-month"
      />

      <div class="mt-8 border-t border-gray-200 dark:border-gray-800 pt-6">
        <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Rozpoczęcie okresu</h2>
        <PeriodStartButton
          apiEndpoint="/api/balance/admin/run-period-start"
          buttonText="Wykonaj rozpoczęcie okresu"
        />
      </div>
    </div>
  );
});
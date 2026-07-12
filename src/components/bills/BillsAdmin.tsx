import { component$ } from "@builder.io/qwik";
import BackButton from "~/components/shared/BackButton";
import DayOfMonthConfigSection from "~/components/shared/DayOfMonthConfigSection";
import PeriodStartButton from "~/components/shared/PeriodStartButton";
import AutomaticPaymentsAdmin from "./AutomaticPaymentsAdmin";
import PredefinedPaymentsAdmin from "./PredefinedPaymentsAdmin";

export default component$(() => {
  return (
    <div class="p-4">
      <BackButton href="/money/bills" />
      <h1 class="text-xl font-semibold">Zarządzanie rachunkami</h1>

      <DayOfMonthConfigSection
        configEndpoint="/api/bills/config"
        saveTestId="bills-config-save"
        dayId="day-of-month"
      />

      <AutomaticPaymentsAdmin />

      <div class="mt-8 border-t pt-6">
        <h2 class="mb-4 text-lg font-semibold">Rozpoczęcie okresu</h2>
        <PeriodStartButton
          apiEndpoint="/api/bills/admin/run-period-start"
          buttonText="Wykonaj rozpoczęcie okresu"
          successPrefix="Created"
        />
      </div>

      <PredefinedPaymentsAdmin />
    </div>
  );
});

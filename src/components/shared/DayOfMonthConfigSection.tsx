import { component$, useVisibleTask$, useSignal, $, Slot } from "@builder.io/qwik";
import { apiRequest, jsonPost } from "~/lib/api";
import DayOfMonthInput from "./DayOfMonthInput";
import Loader from "./Loader";

interface Props {
  configEndpoint: string;
  saveTestId: string;
  dayTestId?: string;
  dayId?: string;
  extraBody?: Record<string, unknown>;
  onLoaded$?: (data: any) => void;
  onSaved$?: (data: any) => void;
}

export default component$<Props>((props) => {
  const dayOfMonth = useSignal("");
  const error = useSignal<string | null>(null);
  const success = useSignal(false);
  const loading = useSignal(false);

  useVisibleTask$(async () => {
    loading.value = true;
    try {
      const data = await apiRequest<any>(props.configEndpoint);
      dayOfMonth.value = data.day_of_month.toString();
      if (props.onLoaded$) await props.onLoaded$(data);
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  });

  const handleSave = $(async () => {
    if (loading.value) return;
    loading.value = true;
    error.value = null;
    success.value = false;
    try {
      const body = { day_of_month: Number(dayOfMonth.value), ...(props.extraBody ?? {}) };
      const updated = await apiRequest<any>(props.configEndpoint, jsonPost(body));
      dayOfMonth.value = updated.day_of_month.toString();
      if (props.onSaved$) await props.onSaved$(updated);
      success.value = true;
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  });

  return (
    <div>
      {loading.value && (
        <div data-testid="loader" class="flex justify-center py-4">
          <Loader />
        </div>
      )}

      {error.value && (
        <p class="mt-2 text-red-600 dark:text-red-400">{error.value}</p>
      )}

      {success.value && (
        <p data-testid="save-success" class="mt-2 text-green-600 dark:text-green-400">Ustawienia zapisane!</p>
      )}

      <div class="mt-4 flex flex-col gap-3">
        <DayOfMonthInput
          dayOfMonth={dayOfMonth}
          id={props.dayId}
          data-testid={props.dayTestId}
        />

        <Slot />

        <button
          onClick$={handleSave}
          disabled={loading.value}
          data-testid={props.saveTestId}
          class="w-fit rounded bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {loading.value ? "Zapisywanie..." : "Zapisz"}
        </button>
      </div>
    </div>
  );
});

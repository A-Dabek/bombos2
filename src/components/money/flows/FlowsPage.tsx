import { component$, useVisibleTask$, useSignal, $, useContext } from "@builder.io/qwik";
import { apiRequest, jsonPost } from "~/lib/api";
import type { MoneyFlow } from "~/db/flows";
import FlowsForm from "./FlowsForm";
import AdminButton from "~/components/shared/AdminButton";
import Loader from "~/components/shared/Loader";
import DoubleConfirmButton from "~/components/shared/DoubleConfirmButton";
import { RefreshContext } from "~/constants/refresh";

export default component$(() => {
  const flows = useSignal<MoneyFlow[]>([]);
  const loading = useSignal(false);
  const error = useSignal<string | null>(null);
  const description = useSignal("");
  const amount = useSignal("");
  const dayOfMonth = useSignal("");
  const refreshSignal = useContext(RefreshContext);

  const loadData = $(async () => {
    loading.value = true;
    try {
      const data = await apiRequest<{ flows: MoneyFlow[] }>("/api/flows");
      flows.value = data.flows ?? [];
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  });

  useVisibleTask$(async ({ track }) => {
    track(() => refreshSignal.value);
    await loadData();
  });

  const handleAdd = $(async (desc: string, amt: number, day: number) => {
    if (!desc || isNaN(amt) || isNaN(day) || loading.value) return;
    loading.value = true;
    error.value = null;
    try {
      await apiRequest("/api/flows", jsonPost({ description: desc, amount: amt, dayOfMonth: day }));
      await loadData();
      description.value = "";
      amount.value = "";
      dayOfMonth.value = "";
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  });

  const handleDelete = $(async (id: number) => {
    loading.value = true;
    error.value = null;
    try {
      await apiRequest(`/api/flows/${id}`, { method: "DELETE" });
      await loadData();
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  });

  return (
    <div class="p-4">
      <AdminButton href="/money/flows/admin" />
      {error.value && <p class="mt-2 text-red-600 dark:text-red-400">{error.value}</p>}

      {loading.value && flows.value.length === 0 && (
        <div class="flex justify-center py-4">
          <Loader />
        </div>
      )}

      <FlowsForm
        description={description.value}
        amount={amount.value}
        dayOfMonth={dayOfMonth.value}
        loading={loading.value}
        onSubmit$={handleAdd}
      />

      {flows.value.length > 0 && (
        <div class="mt-6 border-t border-gray-100 dark:border-gray-800">
          <ul class="divide-y divide-gray-100 dark:divide-gray-800">
            {flows.value.map((flow) => (
              <li key={flow.id} class="flex items-center py-3 text-sm">
                <span class="w-8 font-mono text-gray-400 dark:text-gray-500">{flow.day_of_month}.</span>
                <span class="flex-1 text-gray-800 dark:text-gray-200 ml-2">{flow.description}</span>
                <span class={flow.amount >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"} title="Kwota">
                  {flow.amount >= 0 ? "+" : ""}{flow.amount}
                </span>
                <DoubleConfirmButton
                  onConfirm$={() => handleDelete(flow.id)}
                  class="ml-4 p-1 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400"
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});

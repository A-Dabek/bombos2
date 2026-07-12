import { component$, useVisibleTask$, useSignal, $, useContext } from "@builder.io/qwik";
import { apiRequest, jsonPost } from "~/lib/api";
import type { MoneyFlow } from "~/db/flows";
import BackButton from "~/components/shared/BackButton";
import Loader from "~/components/shared/Loader";
import DoubleConfirmButton from "~/components/shared/DoubleConfirmButton";
import { RefreshContext } from "~/constants/refresh";
import FlowsForm from "./FlowsForm";

export default component$(() => {
  const flows = useSignal<MoneyFlow[]>([]);
  const loading = useSignal(false);
  const error = useSignal<string | null>(null);
  const editingFlow = useSignal<MoneyFlow | null>(null);
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

  const handleDelete = $(async (id: number) => {
    loading.value = true;
    try {
      await apiRequest(`/api/flows/${id}`, { method: "DELETE" });
      await loadData();
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  });

  const handleUpdate = $(async (desc: string, amt: number, day: number) => {
    if (!editingFlow.value) return;
    loading.value = true;
    try {
      await apiRequest(`/api/flows/${editingFlow.value.id}`, { ...jsonPost({ description: desc, amount: amt, dayOfMonth: day }), method: "PUT" });
      await loadData();
      editingFlow.value = null;
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  });

  return (
    <div class="p-4">
      <BackButton href="/money/flows" />
      <h1 class="text-xl font-bold text-gray-800 mb-4">Zarządzaj przepływami</h1>

      {error.value && <p class="mt-2 text-red-600">{error.value}</p>}

      {loading.value && flows.value.length === 0 && (
        <div class="flex justify-center py-4">
          <Loader />
        </div>
      )}

      {editingFlow.value ? (
        <div class="mb-6 p-4 border rounded bg-gray-50">
          <h2 class="text-lg font-semibold mb-2">Edytuj przepływ</h2>
          <FlowsForm
            description={editingFlow.value.description}
            amount={editingFlow.value.amount.toString()}
            dayOfMonth={editingFlow.value.day_of_month.toString()}
            loading={loading.value}
            submitLabel="Zaktualizuj"
            onSubmit$={handleUpdate}
          />
          <button
            onClick$={() => (editingFlow.value = null)}
            class="mt-2 text-sm text-gray-500 underline"
          >
            Anuluj
          </button>
        </div>
      ) : null}

      <div class="space-y-2">
        {flows.value.map((flow) => (
          <div key={flow.id} class="flex items-center justify-between p-3 bg-white border rounded">
            <div class="flex-1">
              <div class="flex items-center">
                <span class="w-6 font-mono text-gray-400 text-xs">{flow.day_of_month}.</span>
                <span class="font-medium text-gray-800 ml-1">{flow.description}</span>
              </div>
              <div class={`text-sm ${flow.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                {flow.amount >= 0 ? "+" : ""}{flow.amount}
              </div>
            </div>
            <div class="flex space-x-2">
              <button
                onClick$={() => (editingFlow.value = flow)}
                class="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
              >
                Edytuj
              </button>
              <DoubleConfirmButton onConfirm$={() => handleDelete(flow.id)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

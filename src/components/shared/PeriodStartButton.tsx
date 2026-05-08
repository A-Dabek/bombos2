import { component$, useSignal, $, type PropFunction } from "@builder.io/qwik";
import DoubleConfirmButton from "~/components/shared/DoubleConfirmButton";

interface PeriodStartButtonProps {
  apiEndpoint: string;
  buttonText: string;
  successPrefix?: string;
}

export default component$<PeriodStartButtonProps>((props) => {
  const loading = useSignal(false);
  const error = useSignal<string | null>(null);
  const success = useSignal(false);
  const result = useSignal<string | null>(null);

  const handleRun = $(async () => {
    loading.value = true;
    error.value = null;
    success.value = false;
    result.value = null;

    try {
      const res = await fetch(props.apiEndpoint, { method: "POST" });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Failed to run");
      }
      
      // Handle different response formats from different modules
      if (data.added !== undefined) {
        // Allowance: { success, added, newBalance }
        result.value = data.added 
          ? `Dodano kieszonkowe. Saldo: ${data.newBalance} zł` 
          : "Kieszonkowe nie jest potrzebne";
      } else if (data.periodAdded !== undefined) {
        // Bills: { success, periodAdded, paymentsCreated }
        result.value = data.periodAdded 
          ? `${props.successPrefix || "Dodano"} ${data.paymentsCreated} płatności.` 
          : "Rozpoczęcie okresu nie jest potrzebne";
      } else if (data.added !== undefined) {
        // Balance: { success, added }
        result.value = data.added ? "Dodano rozpoczęcie okresu." : "Rozpoczęcie okresu nie jest potrzebne";
      }
      
      success.value = true;
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  });

  const testId = props.buttonText.toLowerCase().replace(/\s+/g, "-");

  return (
    <div>
      {error.value && (
        <p class="mb-2 text-red-600">{error.value}</p>
      )}
      
      {success.value && result.value && (
        <p data-testid={`${testId}-success`} class="mb-2 text-green-600">{result.value}</p>
      )}
      
      <DoubleConfirmButton
        onConfirm$={handleRun}
        text={props.buttonText}
        data-testid={`${testId}-btn`}
        class="px-3 py-1.5 text-sm rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
        disabled={loading.value}
      />
    </div>
  );
});
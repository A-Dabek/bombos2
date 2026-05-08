import { component$, useVisibleTask$, useSignal, $ } from "@builder.io/qwik";
import type { BillsAutomaticPayment } from "~/db/bills";
import Loader from "~/components/shared/Loader";
import TextInput from "~/components/shared/TextInput";
import AutomaticPaymentItem from "./AutomaticPaymentItem";

export default component$(() => {
  // Automatic payments state
  const payments = useSignal<BillsAutomaticPayment[]>([]);
  const newPaymentName = useSignal("");
  const newPaymentSlug = useSignal("");
  const newPaymentAmount = useSignal("");
  const paymentsLoading = useSignal(false);
  const paymentsError = useSignal<string | null>(null);
  const paymentsSuccess = useSignal(false);

  const loadPayments = $(async () => {
    paymentsLoading.value = true;
    paymentsError.value = null;
    try {
      const res = await fetch("/api/bills/automatic-payments");
      if (!res.ok) throw new Error("Failed to load payments");
      const data = await res.json();
      payments.value = data.payments;
    } catch (e: any) {
      paymentsError.value = e.message;
    } finally {
      paymentsLoading.value = false;
    }
  });

  // Load automatic payments on mount
  useVisibleTask$(async () => {
    await loadPayments();
  });

  const handleAddPayment = $(async () => {
    if (paymentsLoading.value) return;
    
    // Validate slug format
    const slugVal = newPaymentSlug.value.trim();
    if (!/^[a-zA-Z0-9_]+$/.test(slugVal)) {
      paymentsError.value = "Slug musi być jednym słowem (litery, cyfry i podkreślenia)";
      return;
    }
    
    const amount = Number(newPaymentAmount.value);
    if (!newPaymentName.value.trim() || !slugVal || isNaN(amount) || amount <= 0) {
      paymentsError.value = "Wymagana nazwa, slug i dodatnia kwota";
      return;
    }

    paymentsLoading.value = true;
    paymentsError.value = null;
    paymentsSuccess.value = false;

    try {
      const res = await fetch("/api/bills/automatic-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPaymentName.value.trim(),
          slug: slugVal,
          amount: amount,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to add payment");
      }

      // Clear form
      newPaymentName.value = "";
      newPaymentSlug.value = "";
      newPaymentAmount.value = "";
      paymentsSuccess.value = true;

      // Reload payments
      await loadPayments();
    } catch (e: any) {
      paymentsError.value = e.message;
    } finally {
      paymentsLoading.value = false;
    }
  });

  const handleDeletePayment = $(async (paymentId: number) => {
    if (paymentsLoading.value) return;
    
    paymentsLoading.value = true;
    paymentsError.value = null;

    try {
      const res = await fetch(`/api/bills/automatic-payments/${paymentId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to delete payment");
      }

      // Reload payments
      await loadPayments();
    } catch (e: any) {
      paymentsError.value = e.message;
    } finally {
      paymentsLoading.value = false;
    }
  });

  return (
    <>
      <hr class="my-6" />
      
      <h2 class="text-lg font-semibold" data-testid="automatic-payments-heading">Płatności automatyczne</h2>
      <p class="mt-1 text-sm text-gray-600">
        Te płatności zostaną automatycznie dodane przy rozpoczęciu nowego okresu rozliczeniowego.
      </p>

      {paymentsLoading.value && payments.value.length === 0 && (
        <div class="flex justify-center py-4">
          <Loader />
        </div>
      )}

      {paymentsError.value && (
        <p class="mt-2 text-red-600">{paymentsError.value}</p>
      )}

      {paymentsSuccess.value && (
        <p class="mt-2 text-green-600">Płatność dodana!</p>
      )}

      {/* Payments List */}
      {payments.value.length > 0 && (
        <div class="mt-4">
          <ul class="space-y-2">
            {payments.value.map((payment) => (
              <AutomaticPaymentItem
                key={payment.id}
                payment={payment}
                isLoading={paymentsLoading.value}
                onDelete$={handleDeletePayment}
              />
            ))}
          </ul>
        </div>
      )}

      {/* Add Payment Form */}
      <div class="mt-4 flex flex-col gap-3">
        <TextInput
          label="Nazwa"
          data-testid="payment-name-input"
          type="text"
          placeholder="np. Czynsz"
          class="mt-1 w-full px-2 py-1 text-sm"
          value={newPaymentName.value}
          onInput$={(e) => (newPaymentName.value = (e.target as HTMLInputElement).value)}
        />

        <TextInput
          label="Slug"
          data-testid="payment-slug-input"
          type="text"
          placeholder="np. czynsz"
          class="mt-1 w-full px-2 py-1 text-sm"
          value={newPaymentSlug.value}
          onInput$={(e) => (newPaymentSlug.value = (e.target as HTMLInputElement).value)}
        />
        <p class="mt-1 text-xs text-gray-500">
          Pojedyncze słowo, tylko litery/cyfry/podkreślenia
        </p>

        <TextInput
          label="Kwota"
          data-testid="payment-amount-input"
          type="number"
          min="1"
          placeholder="np. 1200"
          class="mt-1 w-full px-2 py-1 text-sm"
          value={newPaymentAmount.value}
          onInput$={(e) => (newPaymentAmount.value = (e.target as HTMLInputElement).value)}
        />

        <button
          data-testid="payment-add-button"
          onClick$={handleAddPayment}
          disabled={paymentsLoading.value}
          class="w-fit rounded bg-green-500 px-3 py-1.5 text-sm text-white hover:bg-green-600 disabled:opacity-50"
        >
          {paymentsLoading.value ? "Dodawanie..." : "Dodaj płatność"}
        </button>
      </div>
    </>
  );
});

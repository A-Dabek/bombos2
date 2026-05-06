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
  const deleteConfirmations = useSignal<Set<number>>(new Set());

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
      paymentsError.value = "Slug must be a single word (letters, numbers, underscores only)";
      return;
    }
    
    const amount = Number(newPaymentAmount.value);
    if (!newPaymentName.value.trim() || !slugVal || isNaN(amount) || amount <= 0) {
      paymentsError.value = "Valid name, slug, and positive amount required";
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

  const handleDeleteClick = $((paymentId: number) => {
    if (deleteConfirmations.value.has(paymentId)) {
      // Second click - actually delete
      handleDeletePayment(paymentId);
      const newSet = new Set(deleteConfirmations.value);
      newSet.delete(paymentId);
      deleteConfirmations.value = newSet;
    } else {
      // First click - show confirmation
      const newSet = new Set(deleteConfirmations.value);
      newSet.add(paymentId);
      deleteConfirmations.value = newSet;
      
      // Revert after 2 seconds
      setTimeout(() => {
        const revertSet = new Set(deleteConfirmations.value);
        revertSet.delete(paymentId);
        deleteConfirmations.value = revertSet;
      }, 2000);
    }
  });

  return (
    <>
      <hr class="my-6" />
      
      <h2 class="text-lg font-semibold">Automatic Payments</h2>
      <p class="mt-1 text-sm text-gray-600">
        These payments will be automatically added when a new billing period starts.
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
        <p class="mt-2 text-green-600">Payment added successfully!</p>
      )}

      {/* Payments List */}
      {payments.value.length > 0 && (
        <div class="mt-4">
          <ul class="space-y-2">
            {payments.value.map((payment) => (
              <AutomaticPaymentItem
                key={payment.id}
                payment={payment}
                isConfirming={deleteConfirmations.value.has(payment.id)}
                isLoading={paymentsLoading.value}
                onDeleteClick$={handleDeleteClick}
              />
            ))}
          </ul>
        </div>
      )}

      {/* Add Payment Form */}
      <div class="mt-4 flex flex-col gap-3">
        <TextInput
          label="Name"
          data-testid="payment-name-input"
          type="text"
          placeholder="e.g., Rent"
          class="mt-1 w-full px-2 py-1 text-sm"
          value={newPaymentName.value}
          onInput$={(e) => (newPaymentName.value = (e.target as HTMLInputElement).value)}
        />

        <TextInput
          label="Slug"
          data-testid="payment-slug-input"
          type="text"
          placeholder="e.g., rent"
          class="mt-1 w-full px-2 py-1 text-sm"
          value={newPaymentSlug.value}
          onInput$={(e) => (newPaymentSlug.value = (e.target as HTMLInputElement).value)}
        />
        <p class="mt-1 text-xs text-gray-500">
          Single word, letters/numbers/underscores only
        </p>

        <TextInput
          label="Amount"
          data-testid="payment-amount-input"
          type="number"
          min="1"
          placeholder="e.g., 1200"
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
          {paymentsLoading.value ? "Adding..." : "Add Payment"}
        </button>
      </div>
    </>
  );
});

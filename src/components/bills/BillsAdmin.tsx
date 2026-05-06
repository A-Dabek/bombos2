import { component$, useVisibleTask$, useSignal, $ } from "@builder.io/qwik";
import type { BillsConfig, BillsAutomaticPayment } from "~/db/bills";
import BackButton from "~/components/shared/BackButton";
import Loader from "~/components/shared/Loader";
import DayOfMonthInput from "~/components/shared/DayOfMonthInput";

export default component$(() => {
  const config = useSignal<BillsConfig | null>(null);
  const dayOfMonth = useSignal("");
  const error = useSignal<string | null>(null);
  const success = useSignal(false);
  const loading = useSignal(false);

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

  useVisibleTask$(async () => {
    loading.value = true;
    try {
      const res = await fetch("/api/bills/config");
      if (!res.ok) throw new Error("Failed to load config");
      const data: BillsConfig = await res.json();
      config.value = data;
      dayOfMonth.value = data.day_of_month.toString();
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
      const res = await fetch("/api/bills/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          day_of_month: Number(dayOfMonth.value),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update config");
      }

      const updated = await res.json();
      config.value = updated;
      dayOfMonth.value = updated.day_of_month.toString();
      success.value = true;
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
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
    <div class="p-4">
      <BackButton href="/money/bills" />
      <h1 class="text-xl font-semibold">Bills Admin</h1>

      {loading.value && (
        <div class="flex justify-center py-4">
          <Loader />
        </div>
      )}

      {error.value && (
        <p class="mt-2 text-red-600">{error.value}</p>
      )}

      {success.value && (
        <p data-testid="save-success" class="mt-2 text-green-600">Settings saved successfully!</p>
      )}

      <div class="mt-4 flex flex-col gap-3">
        <DayOfMonthInput
          dayOfMonth={dayOfMonth}
          id="day-of-month"
        />

        <button
          onClick$={handleSave}
          disabled={loading.value}
          class="w-fit rounded bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {loading.value ? "Saving..." : "Save"}
        </button>
      </div>

      {/* Automatic Payments Section */}
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
              <li 
                key={payment.id} 
                data-testid="payment-item"
                class="flex items-center justify-between rounded bg-gray-50 p-2"
              >
                <div>
                  <span class="font-medium">{payment.name}</span>
                  <span class="ml-2 text-sm text-gray-500">({payment.slug})</span>
                  <span class="ml-2 text-sm font-semibold">${payment.amount}</span>
                </div>
                <button
                  data-testid={`payment-delete-${payment.id}`}
                  onClick$={() => handleDeleteClick(payment.id)}
                  disabled={paymentsLoading.value}
                  class="rounded px-2 py-1 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {deleteConfirmations.value.has(payment.id) ? "Confirm?" : "Delete"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Add Payment Form */}
      <div class="mt-4 flex flex-col gap-3">
        <div>
          <label class="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            data-testid="payment-name-input"
            type="text"
            placeholder="e.g., Rent"
            class="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
            bind:value={newPaymentName}
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">
            Slug
          </label>
          <input
            data-testid="payment-slug-input"
            type="text"
            placeholder="e.g., rent"
            class="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
            bind:value={newPaymentSlug}
          />
          <p class="mt-1 text-xs text-gray-500">
            Single word, letters/numbers/underscores only
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">
            Amount
          </label>
          <input
            data-testid="payment-amount-input"
            type="number"
            min="1"
            placeholder="e.g., 1200"
            class="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm"
            bind:value={newPaymentAmount}
          />
        </div>

        <button
          data-testid="payment-add-button"
          onClick$={handleAddPayment}
          disabled={paymentsLoading.value}
          class="w-fit rounded bg-green-500 px-3 py-1.5 text-sm text-white hover:bg-green-600 disabled:opacity-50"
        >
          {paymentsLoading.value ? "Adding..." : "Add Payment"}
        </button>
      </div>
    </div>
  );
});
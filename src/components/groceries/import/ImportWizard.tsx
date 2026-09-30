import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import type { Aisle } from "~/db/shops";
import UploadStep from "./UploadStep";
import ReviewStep from "./ReviewStep";
import type { ImportConfirmItem, ImportDraftItem } from "./types";

export default component$(() => {
  const navigate = useNavigate();
  const step = useSignal<"upload" | "review">("upload");
  const items = useSignal<ImportDraftItem[]>([]);
  const aisles = useSignal<Aisle[]>([]);
  const activeShopId = useSignal<number | null>(null);
  const uploading = useSignal(false);
  const confirming = useSignal(false);
  const error = useSignal<string | null>(null);

  useVisibleTask$(async () => {
    try {
      const settingsResp = await fetch("/api/settings");
      if (!settingsResp.ok) return;
      const settings = await settingsResp.json();
      activeShopId.value = settings.activeShop ?? null;
      if (settings.activeShop == null) return;
      const aislesResp = await fetch(`/api/shops/${settings.activeShop}/aisles`);
      if (aislesResp.ok) {
        const data = await aislesResp.json();
        aisles.value = data.aisles ?? [];
      }
    } catch (e) {
      console.error("Failed to load import context:", e);
    }
  });

  const handleFile$ = $(async (file: File) => {
    uploading.value = true;
    error.value = null;
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await fetch("/api/groceries/import/analyze", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Nie udało się przetworzyć zdjęcia.");
      if (!Array.isArray(data.items) || data.items.length === 0) {
        error.value = "Nie rozpoznano żadnych składników. Spróbuj inne zdjęcie.";
        return;
      }
      items.value = data.items;
      step.value = "review";
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Nie udało się przetworzyć zdjęcia.";
    } finally {
      uploading.value = false;
    }
  });

  const handleConfirm$ = $(async (confirmed: ImportConfirmItem[]) => {
    if (confirmed.length === 0) return;
    confirming.value = true;
    error.value = null;
    try {
      const res = await fetch("/api/groceries/import/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: confirmed, shopId: activeShopId.value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Nie udało się zapisać pozycji.");
      await navigate("/groceries/planning");
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Nie udało się zapisać pozycji.";
    } finally {
      confirming.value = false;
    }
  });

  const handleBack$ = $(() => {
    step.value = "upload";
    items.value = [];
    error.value = null;
  });

  return (
    <div class="p-4">
      {step.value === "upload" ? (
        <UploadStep uploading={uploading.value} error={error.value} onFile$={handleFile$} />
      ) : (
        <ReviewStep
          items={items.value}
          aisles={aisles.value}
          confirming={confirming.value}
          error={error.value}
          onConfirm$={handleConfirm$}
          onBack$={handleBack$}
        />
      )}
    </div>
  );
});

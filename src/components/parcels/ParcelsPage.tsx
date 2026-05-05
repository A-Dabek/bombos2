import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import Loader from "~/components/shared/Loader";
import ParcelSubNav from "./ParcelSubNav";
import ParcelList from "./ParcelList";
import UploadButton from "./UploadButton";
import ParcelLightbox from "./ParcelLightbox";
import type { Parcel } from "./types";

interface Props {
  type: "incoming" | "outgoing";
  title: string;
}

export default component$<Props>(({ type, title }) => {
  const parcels = useSignal<Parcel[]>([]);
  const selectedParcel = useSignal<Parcel | null>(null);
  const isLightboxVisible = useSignal(false);
  const isLoading = useSignal(true);
  const isCompleting = useSignal(false);
  const noteTimeout = useSignal<ReturnType<typeof setTimeout> | null>(null);

  const fetchParcels = $(async () => {
    const res = await fetch(`/api/parcels/${type}`);
    if (res.ok) {
      parcels.value = await res.json();
    }
    isLoading.value = false;
  });

  const selectParcel = $((parcel: Parcel) => {
    selectedParcel.value = parcel;
    isLightboxVisible.value = true;
  });

  const closeLightbox = $(() => {
    isLightboxVisible.value = false;
    setTimeout(() => {
      selectedParcel.value = null;
    }, 300);
  });

  const completeParcel = $(async () => {
    if (!selectedParcel.value) return;
    isCompleting.value = true;
    const res = await fetch(`/api/parcels/${selectedParcel.value.id}/complete`, {
      method: "POST",
    });
    isCompleting.value = false;
    if (res.ok) {
      isLightboxVisible.value = false;
      setTimeout(() => {
        selectedParcel.value = null;
      }, 300);
      await fetchParcels();
    }
  });

  const updateNote = $((id: number, note: string) => {
    parcels.value = parcels.value.map((p) =>
      p.id === id ? { ...p, note } : p,
    );

    if (noteTimeout.value) {
      clearTimeout(noteTimeout.value);
    }
    noteTimeout.value = setTimeout(async () => {
      await fetch(`/api/parcels/${id}/note`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
    }, 300);
  });

  useVisibleTask$(() => {
    fetchParcels();
  });

  return (
    <div>
      <UploadButton
        apiPath={`/api/parcels/${type}`}
        onUpload$={fetchParcels}
      />
      {isLoading.value && parcels.value.length === 0 && (
        <div class="flex items-center justify-center p-8">
          <Loader color="border-blue-500" />
        </div>
      )}
      {!isLoading.value && parcels.value.length === 0 && (
        <div class="p-8 text-center text-gray-500">
          No parcels yet
        </div>
      )}
      {parcels.value.length > 0 && (
        <ParcelList
          parcels={parcels.value}
          onSelect$={selectParcel}
          onNoteChange$={updateNote}
        />
      )}
      {selectedParcel.value && (
        <ParcelLightbox
          parcel={selectedParcel.value}
          isVisible={isLightboxVisible.value}
          isCompleting={isCompleting.value}
          onClose$={closeLightbox}
          onComplete$={completeParcel}
        />
      )}
    </div>
  );
});

export const headTitle = (title: string) => ({
  title,
});

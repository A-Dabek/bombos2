import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
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
  const noteTimeout = useSignal<ReturnType<typeof setTimeout> | null>(null);

  const fetchParcels = $(async () => {
    const res = await fetch(`/api/parcels/${type}`);
    if (res.ok) {
      parcels.value = await res.json();
    }
  });

  const selectParcel = $((parcel: Parcel) => {
    selectedParcel.value = parcel;
  });

  const closeLightbox = $(() => {
    selectedParcel.value = null;
  });

  const completeParcel = $(async () => {
    if (!selectedParcel.value) return;
    const res = await fetch(`/api/parcels/${selectedParcel.value.id}/complete`, {
      method: "POST",
    });
    if (res.ok) {
      selectedParcel.value = null;
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
      <ParcelSubNav />
      <UploadButton
        apiPath={`/api/parcels/${type}`}
        onUpload$={fetchParcels}
      />
      {parcels.value.length === 0 ? (
        <div class="p-8 text-center text-gray-500">
          No parcels yet
        </div>
      ) : (
        <ParcelList
          parcels={parcels.value}
          onSelect$={selectParcel}
          onNoteChange$={updateNote}
        />
      )}
      <ParcelLightbox
        parcel={selectedParcel.value}
        onClose$={closeLightbox}
        onComplete$={completeParcel}
      />
    </div>
  );
});

export const headTitle = (title: string) => ({
  title,
});

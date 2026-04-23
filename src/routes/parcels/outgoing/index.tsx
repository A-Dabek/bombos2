import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import ParcelSubNav from "../../../components/parcels/ParcelSubNav";
import ParcelList from "../../../components/parcels/ParcelList";
import UploadButton from "../../../components/parcels/UploadButton";

interface Parcel {
  id: number;
  type: string;
  imageBase64: string;
  contentType: string;
  createdAt: number;
  completedAt: number | null;
  note: string | null;
}

export default component$(() => {
  const parcels = useSignal<Parcel[]>([]);
  const selectedParcel = useSignal<Parcel | null>(null);
  const noteTimeout = useSignal<ReturnType<typeof setTimeout> | null>(null);

  const fetchParcels = $(async () => {
    const res = await fetch("/api/parcels/outgoing");
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
        apiPath="/api/parcels/outgoing"
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
      {selectedParcel.value && (
        <div
          class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-90 p-4"
          onClick$={closeLightbox}
        >
          <img
            src={`data:${selectedParcel.value.contentType};base64,${selectedParcel.value.imageBase64}`}
            alt="Full size parcel"
            class="max-h-full max-w-full object-contain"
            onClick$={closeLightbox}
          />
          {selectedParcel.value.completedAt === null && (
            <button
              class="mt-4 rounded-lg bg-green-600 px-6 py-3 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              onClick$={(e: Event) => {
                e.stopPropagation();
                completeParcel();
              }}
            >
              Mark as Completed
            </button>
          )}
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: "Outgoing Parcels",
};

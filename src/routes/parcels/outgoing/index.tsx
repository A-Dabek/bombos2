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
}

export default component$(() => {
  const parcels = useSignal<Parcel[]>([]);
  const selectedParcel = useSignal<Parcel | null>(null);

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
        />
      )}
      {selectedParcel.value && (
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
          onClick$={closeLightbox}
        >
          <img
            src={`data:${selectedParcel.value.contentType};base64,${selectedParcel.value.imageBase64}`}
            alt="Full size parcel"
            class="max-h-full max-w-full object-contain"
            onClick$={closeLightbox}
          />
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: "Outgoing Parcels",
};

import { component$, type PropFunction } from "@builder.io/qwik";

interface Parcel {
  id: number;
  type: string;
  imageBase64: string;
  contentType: string;
  createdAt: number;
}

interface Props {
  parcels: Parcel[];
  onSelect$: PropFunction<(parcel: Parcel) => void>;
}

export default component$<Props>((props) => {
  return (
    <div class="grid grid-cols-3 gap-2 p-2 sm:grid-cols-4 md:grid-cols-5">
      {props.parcels.map((parcel) => (
        <button
          key={parcel.id}
          class="aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick$={() => props.onSelect$(parcel)}
        >
          <img
            src={`data:${parcel.contentType};base64,${parcel.imageBase64}`}
            alt="Parcel"
            class="h-full w-full object-cover"
          />
        </button>
      ))}
    </div>
  );
});

import { component$, type PropFunction } from "@builder.io/qwik";
import { HiCheckCircleSolid } from "@qwikest/icons/heroicons";
import type { Parcel } from "./types";

interface Props {
  parcels: Parcel[];
  onSelect$: PropFunction<(parcel: Parcel) => void>;
  onNoteChange$: PropFunction<(id: number, note: string) => void>;
}

export default component$<Props>((props) => {
  return (
    <div class="grid grid-cols-3 gap-2 p-2 sm:grid-cols-4 md:grid-cols-5">
      {props.parcels.map((parcel) => (
        <div key={parcel.id} class="flex flex-col">
          <button
            class={`aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 relative ${parcel.completedAt !== null ? "brightness-50" : ""}`}
            onClick$={() => props.onSelect$(parcel)}
          >
            <img
              src={`data:${parcel.contentType};base64,${parcel.imageBase64}`}
              alt="Parcel"
              class="h-full w-full object-cover"
            />
            {parcel.completedAt !== null && (
              <div class="absolute inset-0 flex items-center justify-center">
                <HiCheckCircleSolid class="h-12 w-12 text-green-500" />
              </div>
            )}
          </button>
          <input
            type="text"
            value={parcel.note ?? ""}
            placeholder="Note..."
            maxLength={100}
            class="mt-1 w-full rounded border border-gray-300 px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            onInput$={(e: InputEvent) => {
              const target = e.target as HTMLInputElement;
              props.onNoteChange$(parcel.id, target.value);
            }}
          />
        </div>
      ))}
    </div>
  );
});

import { component$, type PropFunction } from "@builder.io/qwik";
import { HiCheckCircleSolid } from "@qwikest/icons/heroicons";
import TextInput from "../shared/TextInput";
import type { Parcel } from "./types";

interface Props {
  parcel: Parcel;
  onSelect$: PropFunction<(parcel: Parcel) => void>;
  onNoteChange$: PropFunction<(id: number, note: string) => void>;
}

export const ParcelListItem = component$<Props>((props) => {
  const { parcel } = props;
  return (
    <div class="flex flex-col starting:opacity-0 opacity-100 transition-opacity duration-300">
      <button
        data-testid="parcel-item"
        class={`aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 relative ${parcel.completedAt !== null ? "brightness-50" : ""}`}
        onClick$={() => props.onSelect$(parcel)}
      >
        <img
          data-testid="parcel-image"
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
      <TextInput
        type="text"
        data-testid="parcel-note-input"
        value={parcel.note ?? ""}
        placeholder="Note..."
        maxLength={100}
        class="mt-1 w-full px-1 py-0.5 text-xs focus:ring-1 focus:ring-blue-500"
        onInput$={(e: InputEvent) => {
          const target = e.target as HTMLInputElement;
          props.onNoteChange$(parcel.id, target.value);
        }}
      />
    </div>
  );
});

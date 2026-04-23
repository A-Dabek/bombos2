import { component$, type PropFunction } from "@builder.io/qwik";
import type { Parcel } from "./types";

interface Props {
  parcel: Parcel | null;
  onClose$: PropFunction<() => void>;
  onComplete$?: PropFunction<() => void>;
}

export default component$<Props>((props) => {
  if (!props.parcel) {
    return <div class="hidden" />;
  }

  return (
    <div
      class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-90 p-4"
      onClick$={props.onClose$}
    >
      <img
        src={`data:${props.parcel.contentType};base64,${props.parcel.imageBase64}`}
        alt="Full size parcel"
        class="max-h-full max-w-full object-contain"
        onClick$={props.onClose$}
      />
      {props.onComplete$ && props.parcel.completedAt === null && (
        <button
          class="mt-4 rounded-lg bg-green-600 px-6 py-3 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          onClick$={(e: Event) => {
            e.stopPropagation();
            props.onComplete$?.();
          }}
        >
          Mark as Completed
        </button>
      )}
    </div>
  );
});

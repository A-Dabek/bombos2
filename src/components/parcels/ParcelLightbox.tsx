import { component$, type PropFunction } from "@builder.io/qwik";
import { HiArrowPathSolid } from "@qwikest/icons/heroicons";
import type { Parcel } from "./types";

interface Props {
  parcel: Parcel;
  isVisible: boolean;
  isCompleting: boolean;
  onClose$: PropFunction<() => void>;
  onComplete$?: PropFunction<() => void>;
}

export default component$<Props>((props) => {
  return (
    <div
      class={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-90 p-4 transition-all duration-300 starting:opacity-0 starting:scale-95 ${props.isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
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
          class="mt-4 rounded-lg bg-green-600 px-6 py-3 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={props.isCompleting}
          onClick$={(e: Event) => {
            e.stopPropagation();
            props.onComplete$?.();
          }}
        >
          {props.isCompleting ? (
            <span class="flex items-center gap-2">
              <HiArrowPathSolid class="h-5 w-5 animate-spin" />
              Saving...
            </span>
          ) : (
            "Mark as Completed"
          )}
        </button>
      )}
    </div>
  );
});

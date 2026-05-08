import { component$, type PropFunction } from "@builder.io/qwik";
import Loader from "~/components/shared/Loader";
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
        alt="Pełny rozmiar paczki"
        data-testid="parcel-lightbox-image"
        class="max-h-full max-w-full object-contain"
        onClick$={props.onClose$}
      />
      {props.onComplete$ && props.parcel.completedAt === null && (
        <button
          class="mt-4 rounded-lg bg-green-600 px-6 py-3 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="parcel-lightbox-complete-button"
          disabled={props.isCompleting}
          onClick$={(e: Event) => {
            e.stopPropagation();
            props.onComplete$?.();
          }}
        >
          {props.isCompleting ? (
            <span class="flex items-center gap-2" data-testid="parcel-lightbox-saving">
              <Loader size="sm" color="border-white" />
              Zapisywanie...
            </span>
          ) : (
            "Gotowe!"
          )}
        </button>
      )}
    </div>
  );
});

import { component$, useSignal, type PropFunction } from "@builder.io/qwik";
import { HiArrowPathSolid } from "@qwikest/icons/heroicons";

interface Props {
  apiPath: string;
  onUpload$: PropFunction<() => void>;
}

export default component$<Props>((props) => {
  const inputRef = useSignal<HTMLInputElement | undefined>();
  const isUploading = useSignal(false);

  return (
    <div class="p-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        data-testid="parcel-upload-input"
        class="hidden"
        disabled={isUploading.value}
        onChange$={async (event: Event) => {
          const target = event.target as HTMLInputElement;
          const file = target.files?.[0];
          if (!file) return;

          isUploading.value = true;

          const formData = new FormData();
          formData.append("image", file);

          const res = await fetch(props.apiPath, {
            method: "POST",
            body: formData,
          });

          if (res.ok) {
            props.onUpload$();
          }

          isUploading.value = false;
          target.value = "";
        }}
      />
      <button
        class="w-full rounded-lg bg-blue-600 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        data-testid="parcel-upload-button"
        disabled={isUploading.value}
        onClick$={() => inputRef.value?.click()}
      >
        {isUploading.value ? (
          <span class="flex items-center justify-center gap-2" data-testid="parcel-uploading">
            <HiArrowPathSolid class="h-5 w-5 animate-spin" />
            Uploading...
          </span>
        ) : (
          "Upload Image"
        )}
      </button>
    </div>
  );
});

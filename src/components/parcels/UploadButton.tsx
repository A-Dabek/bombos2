import { component$, useSignal, type PropFunction } from "@builder.io/qwik";

interface Props {
  apiPath: string;
  onUpload$: PropFunction<() => void>;
}

export default component$<Props>((props) => {
  const inputRef = useSignal<HTMLInputElement | undefined>();

  return (
    <div class="p-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        class="hidden"
        onChange$={async (event: Event) => {
          const target = event.target as HTMLInputElement;
          const file = target.files?.[0];
          if (!file) return;

          const formData = new FormData();
          formData.append("image", file);

          const res = await fetch(props.apiPath, {
            method: "POST",
            body: formData,
          });

          if (res.ok) {
            props.onUpload$();
          }

          target.value = "";
        }}
      />
      <button
        class="w-full rounded-lg bg-blue-600 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick$={() => inputRef.value?.click()}
      >
        Upload Image
      </button>
    </div>
  );
});

import { component$, type PropFunction } from "@builder.io/qwik";
import Loader from "~/components/shared/Loader";
import { HiCameraOutline } from "@qwikest/icons/heroicons";

interface UploadStepProps {
  uploading: boolean;
  error: string | null;
  onFile$: PropFunction<(file: File) => void>;
}

export default component$(({ uploading, error, onFile$ }: UploadStepProps) => {
  return (
    <div class="mx-auto max-w-md">
      <h1 class="mb-2 text-xl font-semibold text-gray-800 dark:text-gray-100">
        Import ze zdjęcia
      </h1>
      <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
        Zrób zdjęcie lub wybierz zrzut ekranu listy zakupów. Rozpoznamy składniki i pokażemy
        je do zatwierdzenia.
      </p>

      {error && (
        <p class="mb-4 text-sm text-red-600 dark:text-red-400" data-testid="import-error">
          {error}
        </p>
      )}

      <label
        class={[
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 px-4 py-10 text-center transition-colors",
          uploading
            ? "pointer-events-none opacity-60"
            : "hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950",
        ]}
      >
        <input
          type="file"
          accept="image/*"
          capture="environment"
          class="hidden"
          disabled={uploading}
          data-testid="import-file-input"
          onChange$={(event) => {
            const input = event.target as HTMLInputElement;
            const file = input.files?.[0];
            if (file) onFile$(file);
            input.value = "";
          }}
        />
        {uploading ? (
          <>
            <Loader size="sm" color="border-blue-500" />
            <span class="text-sm text-gray-600 dark:text-gray-300">Analizuję zdjęcie…</span>
          </>
        ) : (
          <>
            <HiCameraOutline class="h-10 w-10 text-blue-500" />
            <span class="text-sm font-medium text-gray-700 dark:text-gray-200">
              Wybierz zdjęcie
            </span>
            <span class="text-xs text-gray-400 dark:text-gray-500">JPG, PNG</span>
          </>
        )}
      </label>

      <div class="mt-6">
        <a href="/groceries/planning" class="text-sm text-blue-500 hover:underline">
          ← Wróć do planowania
        </a>
      </div>
    </div>
  );
});

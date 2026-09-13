import { component$, type PropFunction } from "@builder.io/qwik";

interface LoadMoreButtonProps {
  loading?: boolean;
  onClick$: PropFunction<() => void>;
}

export default component$<LoadMoreButtonProps>((props) => {
  return (
    <div class="mt-4 flex justify-center">
      <button
        type="button"
        data-testid="load-more-btn"
        disabled={props.loading}
        onClick$={props.onClick$}
        class="px-4 py-2 text-sm rounded border border-transparent bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 dark:border-blue-400/40 disabled:opacity-50"
      >
        {props.loading ? "Ładowanie..." : "Więcej"}
      </button>
    </div>
  );
});

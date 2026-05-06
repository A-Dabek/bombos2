import { component$, type Signal } from "@builder.io/qwik";

interface DayOfMonthInputProps {
  dayOfMonth: Signal<string>;
  id?: string;
  "data-testid"?: string;
}

export default component$<DayOfMonthInputProps>((props) => {
  return (
    <div>
      <label for={props.id} class="block text-sm font-medium text-gray-700">
        Day of Month (1-28)
      </label>
      <input
        id={props.id}
        type="number"
        min="1"
        max="28"
        data-testid={props["data-testid"]}
        class="mt-1 rounded border border-gray-300 px-2 py-1 text-sm w-24"
        bind:value={props.dayOfMonth}
      />
    </div>
  );
});

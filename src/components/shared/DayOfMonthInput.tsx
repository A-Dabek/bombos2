import { component$, type Signal } from "@builder.io/qwik";
import TextInput from "./TextInput";

interface DayOfMonthInputProps {
  dayOfMonth: Signal<string>;
  id?: string;
  "data-testid"?: string;
}

export default component$<DayOfMonthInputProps>((props) => {
  return (
    <TextInput
      id={props.id}
      label="Dzień miesiąca (1-28)"
      type="number"
      min="1"
      max="28"
      data-testid={props["data-testid"]}
      class="mt-1 px-2 py-1 text-sm w-24"
      value={props.dayOfMonth.value}
      onInput$={(e) => (props.dayOfMonth.value = (e.target as HTMLInputElement).value)}
    />
  );
});

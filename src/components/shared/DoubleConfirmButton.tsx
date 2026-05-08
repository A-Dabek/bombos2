import { component$, useSignal, $, useVisibleTask$, type PropFunction } from "@builder.io/qwik";
import { HiTrashOutline, HiCheckCircleSolid } from "@qwikest/icons/heroicons";

interface DoubleConfirmButtonProps {
  onConfirm$: PropFunction<() => void>;
  class?: string;
  text?: string;
  "data-testid"?: string;
  disabled?: boolean;
}

export default component$<DoubleConfirmButtonProps>((props) => {
  const isConfirming = useSignal(false);
  const timerId = useSignal<any>(null);

  const handleClick = $(async () => {
    if (isConfirming.value) {
      if (timerId.value) {
        clearTimeout(timerId.value);
        timerId.value = null;
      }
      isConfirming.value = false;
      await props.onConfirm$();
    } else {
      isConfirming.value = true;
      timerId.value = setTimeout(() => {
        isConfirming.value = false;
        timerId.value = null;
      }, 2000);
    }
  });

  useVisibleTask$(({ cleanup }) => {
    cleanup(() => {
      if (timerId.value) clearTimeout(timerId.value);
    });
  });

  return (
    <button
      type="button"
      onClick$={handleClick}
      disabled={props.disabled}
      class={[
        "flex items-center transition-all duration-200",
        isConfirming.value 
          ? "text-green-500"
          : "text-red-500 hover:text-red-700",
        props.class,
      ]}
      data-testid={props["data-testid"] || "delete-btn"}
      aria-label={isConfirming.value ? "Potwierdź" : "Usuń"}
    >
      {isConfirming.value ? (
        <>
          <HiCheckCircleSolid class="w-5 h-5 animate-ping" />
          {props.text && <span class="ml-1">{props.text}</span>}
        </>
      ) : (
        <>
          <HiTrashOutline class="w-5 h-5" />
          {props.text && <span class="ml-1">{props.text}</span>}
        </>
      )}
    </button>
  );
});

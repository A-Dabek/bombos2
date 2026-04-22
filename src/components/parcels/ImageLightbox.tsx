import { component$, type PropFunction } from "@builder.io/qwik";

interface Parcel {
  id: number;
  type: string;
  imageBase64: string;
  contentType: string;
  createdAt: number;
}

interface Props {
  parcel: Parcel | null;
  onClose$: PropFunction<() => void>;
}

export default component$<Props>((props) => {
  if (!props.parcel) {
    return <div class="hidden" />;
  }

  return (
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
      onClick$={props.onClose$}
    >
      <img
        src={`data:${props.parcel.contentType};base64,${props.parcel.imageBase64}`}
        alt="Full size parcel"
        class="max-h-full max-w-full object-contain"
        onClick$={props.onClose$}
      />
    </div>
  );
});

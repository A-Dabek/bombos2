import { component$, type PropFunction } from "@builder.io/qwik";
import type { Parcel } from "./types";
import { ParcelListItem } from "./ParcelListItem";

interface Props {
  parcels: Parcel[];
  onSelect$: PropFunction<(parcel: Parcel) => void>;
  onNoteChange$: PropFunction<(id: number, note: string) => void>;
}

export default component$<Props>((props) => {
  return (
    <div class="grid grid-cols-3 gap-2 p-2 sm:grid-cols-4 md:grid-cols-5">
      {props.parcels.map((parcel) => (
        <ParcelListItem
          key={parcel.id}
          parcel={parcel}
          onSelect$={props.onSelect$}
          onNoteChange$={props.onNoteChange$}
        />
      ))}
    </div>
  );
});

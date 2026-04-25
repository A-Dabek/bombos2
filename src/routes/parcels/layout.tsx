import { component$, Slot } from "@builder.io/qwik";
import ParcelSubNav from "../../components/parcels/ParcelSubNav";

export default component$(() => {
  return (
    <div>
      <ParcelSubNav />
      <Slot />
    </div>
  );
});

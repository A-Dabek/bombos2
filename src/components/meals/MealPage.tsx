import { component$ } from "@builder.io/qwik";
import MealRandomizer from "./MealRandomizer";
import AdminButton from "~/components/shared/AdminButton";

interface MealPageProps {
  category: "dinner" | "supper";
}

export default component$<MealPageProps>((props) => {
  const title = props.category === "dinner" ? "Obiad" : "Kolacja";

  return (
    <div class="relative min-h-screen">
      <MealRandomizer category={props.category} />

      <AdminButton href={`/meals/${props.category}/admin`} />
    </div>
  );
});

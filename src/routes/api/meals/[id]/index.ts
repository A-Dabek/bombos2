import type { RequestHandler } from "@builder.io/qwik-city";
import { deleteMeal } from "~/db/meals";

export const onDelete: RequestHandler = async ({ params, json }) => {
  const id = parseInt(params.id, 10);

  if (isNaN(id)) {
    json(400, { error: "Invalid id" });
    return;
  }

  const deleted = deleteMeal(id);
  if (deleted) {
    json(200, { success: true });
  } else {
    json(404, { error: "Meal not found" });
  }
};
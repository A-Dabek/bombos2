import type { RequestHandler } from "@builder.io/qwik-city";
import { deleteCompletedParcels } from "~/db/parcels";

export const onPost: RequestHandler = async ({ json }) => {
  const deleted = deleteCompletedParcels();
  json(200, { success: true, deleted });
};
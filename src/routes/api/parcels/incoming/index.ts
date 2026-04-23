import { createParcelHandlers } from "../createParcelHandlers.ts";

export const { onGet, onPost } = createParcelHandlers("incoming");

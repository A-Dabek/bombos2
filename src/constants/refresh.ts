import { createContextId, type Signal } from "@builder.io/qwik";

export const RefreshContext = createContextId<Signal<number>>("app.refresh-context");

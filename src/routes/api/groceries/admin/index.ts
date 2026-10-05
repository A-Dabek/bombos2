import type { RequestHandler } from "@builder.io/qwik-city";
import { listMergeCandidates, mergeGroceryProducts } from "~/db/groceries-merge";
import { normalizeProductName } from "~/db/groceries";

export const onGet: RequestHandler = async ({ json }) => {
  json(200, { products: listMergeCandidates() });
};

export const onPost: RequestHandler = async ({ json, parseBody }) => {
  try {
    const body = await parseBody();
    const target = (body as { target?: unknown })?.target;
    const sources = (body as { sources?: unknown })?.sources;

    if (typeof target !== "string" || target.trim().length === 0) {
      json(400, { message: "Produkt docelowy jest wymagany" });
      return;
    }

    if (!Array.isArray(sources) || sources.length < 1 || sources.length > 50) {
      json(400, { message: "Wybierz od 1 do 50 produktów do scalenia" });
      return;
    }

    if (
      !sources.every(
        (source): source is string =>
          typeof source === "string" && source.trim().length > 0,
      )
    ) {
      json(400, { message: "Nieprawidłowe produkty do scalenia" });
      return;
    }

    const candidates = listMergeCandidates();
    const names = new Set(candidates.map((candidate) => candidate.name));
    if (!names.has(target)) {
      json(400, { message: "Nieznany produkt docelowy" });
      return;
    }

    const targetNorm = normalizeProductName(target);
    for (const source of sources) {
      if (!names.has(source)) {
        json(400, { message: `Nieznany produkt: ${source}` });
        return;
      }
      if (normalizeProductName(source) === targetNorm) {
        json(400, { message: "Produkt docelowy nie może być jednym ze źródeł" });
        return;
      }
    }

    const result = mergeGroceryProducts(target, sources);
    json(201, result);
  } catch {
    json(500, { message: "Nie udało się scalić produktów" });
  }
};

export type Unit = "x" | "g" | "kg" | "l" | "ml";

export interface ExtractedIngredient {
  name: string;
  amount?: number;
  unit?: Unit;
  description?: string;
}

export interface ExtractOptions {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  maxTokens?: number;
  reasoningEffort?: string;
  fetchImpl?: typeof fetch;
}

const VALID_UNITS: ReadonlySet<string> = new Set(["x", "g", "kg", "l", "ml"]);

export const RECIPE_IMPORT_SYSTEM_PROMPT = `Jesteś ekstraktorem składników z listy zakupów. Otrzymujesz surowy tekst OCR ze zrzutu ekranu polskiej aplikacji z przepisami/listą zakupów. Zwróć WYŁĄCZNIE obiekt JSON.

ZASADY:
1. Zwróć pole "items" — jeden obiekt na każdy wiersz listy, który jest składnikiem do kupienia. NIE scalaj duplikatów (scalanie robi backend).
2. Pomiń: nagłówki kategorii (np. "Wołowina", "Drób", "Owoce morza", "Produkty mleczne", "Inne"), cały szum interfejsu (godzina, bateria, pasek stanu, "Lista zakupów", "Wg kategorii", "Nowy przepis", checkboxy, litery przy nagłówkach). NIE zwracaj ich jako pozycji i NIE próbuj ustalać kategorii.
3. Pola pozycji: "name" (WYMAGANE), opcjonalnie "amount", "unit", "description". Nie dodawaj innych pól.
4. "name": znormalizowana nazwa, mianownik, liczba pojedyncza gdy naturalne, bez ilości i przymiotników ilościowych. Przykłady: "2 duże cebule" -> "cebula"; "schłodzonej śmietany" -> "śmietana"; "gorzkiej czekolady" -> "czekolada gorzka"; "4jajka" -> "jajka"; "krewetki, sprawione" -> "krewetki".
5. "amount": liczba (number), tylko jeśli da się ją wprost ustalić. Przelicz iloczyn: "2 duże cebule (po 100 g)" -> 200. "1 dag" -> 10 (unit "g"). NIE przeliczaj między g/kg ani l/ml — zostaw jednostkę jak w tekście.
6. "unit": jedno z "x", "g", "kg", "l", "ml". Dla sztuk/liczb użyj "x". Dla miar nieprzeliczalnych (łyżka, łyżeczka, pęczek, garść, opakowanie, ząbek, szczypta) użyj "x" i opisz miarę w "description".
7. Jeśli ilości nie da się ustalić, POMIŃ "amount" i "unit" — wtedy surowy fragment z ilością wpisz do "description".
8. "description": tylko ważne dane, które nie mieszczą się w name/amount/unit (wariant, % zawartości, wielkość, przygotowanie, niejasna ilość, oryginalna miara). Maks. 300 znaków. Nie powtarzaj samej nazwy. Możesz je pominąć.
9. Nie wymyślaj danych, których nie ma w tekście.

PRZYKŁAD FORMATU:
{
  "items": [
    { "name": "cebula", "amount": 200, "unit": "g", "description": "2 duże cebule po 100 g" },
    { "name": "szczypiorek", "description": "% pęczka szczypiorku" },
    { "name": "sól" }
  ]
}`;

interface ChatChoice {
  finish_reason?: string;
  message?: { content?: string | null };
}

interface ChatResponse {
  model?: string;
  choices?: ChatChoice[];
  usage?: unknown;
}

export async function extractIngredients(
  ocrText: string,
  options: ExtractOptions = {},
): Promise<ExtractedIngredient[]> {
  const apiKey = options.apiKey ?? process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured");

  const baseUrl = (options.baseUrl ?? process.env.LLM_BASE_URL ?? "https://openrouter.ai/api/v1").replace(/\/$/, "");
  const model = options.model ?? process.env.LLM_MODEL ?? "deepseek/deepseek-v4.1-flash";
  const maxTokens = options.maxTokens ?? Number(process.env.LLM_MAX_TOKENS ?? 16000);
  const reasoningEffort = options.reasoningEffort ?? process.env.LLM_REASONING_EFFORT ?? "low";
  const doFetch = options.fetchImpl ?? fetch;

  const body = {
    model,
    messages: [
      { role: "system", content: RECIPE_IMPORT_SYSTEM_PROMPT },
      { role: "user", content: `OCR:\n"""\n${ocrText}\n"""` },
    ],
    response_format: { type: "json_object" },
    temperature: 0,
    max_tokens: maxTokens,
    reasoning: { effort: reasoningEffort },
  };

  const request = async () => {
    const res = await doFetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "bombos2",
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`LLM request failed (${res.status}): ${text.slice(0, 500)}`);
    let parsed: ChatResponse;
    try {
      parsed = JSON.parse(text) as ChatResponse;
    } catch {
      throw new Error(`LLM returned non-JSON envelope: ${text.slice(0, 500)}`);
    }
    const choice = parsed.choices?.[0];
    return { content: choice?.message?.content ?? "", finish: choice?.finish_reason };
  };

  let { content, finish } = await request();
  if (!content || finish === "length") {
    ({ content, finish } = await request());
  }
  if (!content) throw new Error(`LLM returned empty content (finish: ${finish ?? "unknown"})`);

  let payload: unknown;
  try {
    payload = JSON.parse(content);
  } catch {
    throw new Error(`LLM content is not valid JSON: ${content.slice(0, 500)}`);
  }

  const rawItems = (payload as { items?: unknown })?.items;
  if (!Array.isArray(rawItems)) throw new Error("LLM response is missing an items array");

  return rawItems.flatMap((item): ExtractedIngredient[] => {
    if (typeof item !== "object" || item === null) return [];
    const record = item as Record<string, unknown>;
    const name = typeof record.name === "string" ? record.name.trim() : "";
    if (!name) return [];
    const result: ExtractedIngredient = { name };

    const amount = record.amount;
    const unit = record.unit;
    if (typeof amount === "number" && Number.isFinite(amount) && amount >= 0) {
      result.amount = amount;
      if (typeof unit === "string" && VALID_UNITS.has(unit)) {
        result.unit = unit as Unit;
      } else {
        result.unit = "x";
      }
    }

    if (typeof record.description === "string") {
      const description = record.description.trim();
      if (description) result.description = description.slice(0, 300);
    }

    return [result];
  });
}

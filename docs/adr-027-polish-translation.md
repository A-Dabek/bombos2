# ADR-027: Polish UI Translation

## Status

Accepted

## Date

2026-05-07

## Context

The entire application UI is in English. The user wants all visible text (labels, buttons, headings, placeholders, empty states, validation messages, page titles, `alt`/`aria-label` attributes) translated to Polish. Code identifiers (variable names, function names, API routes, file names, `data-testid` attributes, DB column values like slugs) remain in English. Routing stays English.

## Decision

Translate all UI-facing strings inline (replace string literals directly in source files). No i18n framework or dictionary file. Rationale: single-language app, no plans for additional languages, inline is simpler and avoids abstraction overhead.

## Scope of changes

Every `.tsx` file in `src/` that contains a UI text literal. Plus `root.tsx` (`lang` attribute) and `utils/date.ts` (English ordinal logic → Polish locale).

## Complete string mapping

### 1. Global / Root

| File | Current | Polish |
|------|---------|--------|
| `src/root.tsx` (line 21) | `<body lang="en">` | `<body lang="pl">` |

### 2. Navigation (`src/routes/layout.tsx`)

| Current | Polish |
|---------|--------|
| Parcels | Paczki |
| Meals | Posiłki |
| Plan | Listy |
| Money | Finanse |
| Shopping | Zakupy |

### 3. Parcels Module

#### `src/components/parcels/ParcelSubNav.tsx`
| Current | Polish |
|---------|--------|
| Incoming | Odbierasz |
| Outgoing | Nadajesz |

#### `src/components/parcels/ParcelsPage.tsx` + routes
| Current | Polish |
|---------|--------|
| No parcels yet | Brak paczek |

Page titles (DocumentHead):
| File | Current | Polish |
|------|---------|--------|
| `routes/parcels/incoming/index.tsx` | Incoming Parcels | Paczki do odbioru |
| `routes/parcels/outgoing/index.tsx` | Outgoing Parcels | Paczki do nadania |

#### `src/components/parcels/UploadButton.tsx`
| Current | Polish |
|---------|--------|
| Upload Image | Dodaj zdjęcie |
| Uploading... | Wysyłanie... |

#### `src/components/parcels/ParcelLightbox.tsx`
| Current | Polish |
|---------|--------|
| Mark as Completed | Gotowe! |
| Saving... | Zapisywanie... |
| alt="Full size parcel" | alt="Pełny rozmiar paczki" |

#### `src/components/parcels/ParcelListItem.tsx`
| Current | Polish |
|---------|--------|
| placeholder="Note..." | placeholder="Notatka..." |
| alt="Parcel" | alt="Paczka" |

#### `src/routes/parcels/admin/index.tsx` (Parcels Admin page)
| Current | Polish |
|---------|--------|
| Parcels Admin | Zarządzanie paczkami |
| Cleanup complete. Deleted {n} parcels. | Sprzątanie zakończone. Usunięto {n} paczek. |
| Run Cleanup | Uprzątnij ogarnięte paczki |
| title: "Parcels Admin" | Zarządzanie paczkami |

### 4. Meals Module

#### `src/components/meals/MealSubNav.tsx`
| Current | Polish |
|---------|--------|
| Dinner | Obiad |
| Supper | Kolacja |

#### `src/components/meals/MealPage.tsx`
| Current | Polish |
|---------|--------|
| Dinner | Obiad |
| Supper | Kolacja |

#### `src/components/meals/MealRandomizer.tsx`
| Current | Polish |
|---------|--------|
| No meals yet | Brak dań |
| Roll | Losuj |
| You're a picky eater | Aleś wybredna! |

#### `src/components/meals/MealAdmin.tsx`
| Current | Polish |
|---------|--------|
| placeholder="Add new dish..." | placeholder="Dodaj nowe danie..." |
| Add | Dodaj |
| No meals yet | Brak dań |

Page titles:
| File | Current | Polish |
|------|---------|--------|
| `routes/meals/dinner/index.tsx` | Dinner - Meals | Obiad - Posiłki |
| `routes/meals/supper/index.tsx` | Supper - Meals | Kolacja - Posiłki |
| `routes/meals/dinner/admin/index.tsx` | Dinner Admin - Meals | Zarządzanie obiadem - Posiłki |
| `routes/meals/supper/admin/index.tsx` | Supper Admin - Meals | Zarządzanie kolacją - Posiłki |

### 5. Plan Module

#### `src/components/plan/PlanLists.tsx`
| Current | Polish |
|---------|--------|
| No lists yet | Brak list |

#### `src/components/plan/PlanAdmin.tsx`
| Current | Polish |
|---------|--------|
| Manage Lists | Zarządzaj listami |
| placeholder="New list title..." | placeholder="Tytuł nowej listy..." |
| Add List | Dodaj listę |
| No lists yet | Brak list |
| aria-label="Move up" | aria-label="Przenieś w górę" |
| aria-label="Move down" | aria-label="Przenieś w dół" |

#### `src/components/plan/PlanForm.tsx`
| Current | Polish |
|---------|--------|
| Add Item | Dodaj pozycję |
| Edit Item | Edytuj pozycję |
| Name * | Nazwa * |
| Description | Opis |
| Urgent | Pilne |
| Cancel | Anuluj |
| Save | Zapisz |
| Next | Dalej |

#### `src/components/plan/PlanAccordionList.tsx`
| Current | Polish |
|---------|--------|
| No items yet | Brak pozycji |
| Add new | Dodaj nową |
| Remove all | Usuń wszystkie |

#### `src/components/plan/PlanItemRow.tsx`
| Current | Polish |
|---------|--------|
| aria-label="Edit" | aria-label="Edytuj" |

Page titles:
| File | Current | Polish |
|------|---------|--------|
| `routes/plan/lists/index.tsx` | Plan Lists | Listy - Plan |
| `routes/plan/admin/index.tsx` | Plan Admin | Zarządzanie - Plan |

### 6. Money Module

#### `src/components/money/MoneySubNav.tsx`
| Current | Polish |
|---------|--------|
| Balance | Wydatki |
| Bills | Rachunki |
| Allowance | Kieszonkowe |

#### `src/components/balance/BalanceAdmin.tsx`
| Current | Polish |
|---------|--------|
| Balance Admin | Zarządzanie wydatkami |
| Settings saved successfully! | Ustawienia zapisane! |
| Save / Saving... | Zapisz / Zapisywanie... |
| Period Start | Rozpoczęcie okresu |
| Run Period Start Check | Wykonaj rozpoczęcie okresu |

#### `src/components/bills/BillsAdmin.tsx`
| Current | Polish |
|---------|--------|
| Bills Admin | Zarządzanie rachunkami |
| Settings saved successfully! | Ustawienia zapisane! |
| Save / Saving... | Zapisz / Zapisywanie... |
| Period Start | Rozpoczęcie okresu |
| Run Period Start Check | Wykonaj rozpoczęcie okresu |
| Predefined Payments | Predefiniowane płatności |
| No predefined payments yet. | Brak predefiniowanych płatności. |
| Name | Nazwa |
| Slug | Slug (stays English) |
| placeholder="e.g. Electricity" | placeholder="np. Prąd" |
| placeholder="e.g. electricity" | placeholder="np. prad" |
| Add Predefined Payment | Dodaj płatność |
| Delete | Usuń |

#### `src/components/bills/AutomaticPaymentsAdmin.tsx`
| Current | Polish |
|---------|--------|
| Automatic Payments | Płatności cykliczne |
| These payments will be automatically added when a new billing period starts. | Te płatności zostaną automatycznie dodane przy rozpoczęciu nowego okresu rozliczeniowego. |
| Payment added successfully! | Płatność dodana! |
| Name | Nazwa |
| Slug | Slug (stays English) |
| Amount | Kwota |
| placeholder="e.g., Rent" | placeholder="np. Czynsz" |
| placeholder="e.g., rent" | placeholder="np. czynsz" |
| placeholder="e.g., 1200" | placeholder="np. 1200" |
| Single word, letters/numbers/underscores only | Pojedyncze słowo, tylko litery/cyfry/podkreślenia |
| Add Payment / Adding... | Dodaj płatność / Dodawanie... |
| Delete | Usuń |

#### `src/components/bills/AutomaticPaymentItem.tsx`
| Current | Polish |
|---------|--------|
| Delete | Usuń |

#### `src/components/bills/BillsTransactionForm.tsx`
| Current | Polish |
|---------|--------|
| Select predefined payment (optional) | Wybierz płatność (opcjonalnie) |
| placeholder="Description" | placeholder="Opis" |
| placeholder="Amount (negative for expense)" | placeholder="Kwota (ujemna = wydatek)" |
| Add / Adding... | Dodaj / Dodawanie... |

#### `src/components/allowance/AllowanceAdmin.tsx`
| Current | Polish |
|---------|--------|
| Allowance Admin | Zarządzanie kieszonkowym |
| Settings saved successfully! | Ustawienia zapisane! |
| Monthly Amount | Miesięczna kwota |
| Save / Saving... | Zapisz / Zapisywanie... |
| Manual Check | Ręczne sprawdzenie |
| Run Allowance Check | Wykonaj sprawdzenie kieszonkowego |

#### `src/components/allowance/AllowanceTransactionLine.tsx`
| Current | Polish |
|---------|--------|
| title="Delete" | title="Usuń" |

Page titles:
| File | Current | Polish |
|------|---------|--------|
| `routes/money/index.tsx` | Money | Finanse |
| `routes/money/balance/index.tsx` | Balance - Money | Wydatki - Finanse |
| `routes/money/balance/admin/index.tsx` | Balance Admin - Money | Zarządzanie wydatkami - Finanse |
| `routes/money/bills/index.tsx` | Bills - Money | Rachunki - Finanse |
| `routes/money/bills/admin/index.tsx` | Bills Admin - Money | Zarządzanie rachunkami - Finanse |
| `routes/money/allowance/index.tsx` | Allowance - Money | Kieszonkowe - Finanse |
| `routes/money/allowance/admin/index.tsx` | Allowance Admin - Money | Zarządzanie kieszonkowym - Finanse |

### 7. Shopping Module

#### `src/routes/shopping/index.tsx`
| Current | Polish |
|---------|--------|
| Shopping | Zakupy |
| Placeholder for shopping module. | Miejsce na moduł zakupów. |
| title: "Shopping" | Zakupy |

### 8. Shared Components

#### `src/components/shared/BackButton.tsx`
| Current | Polish |
|---------|--------|
| Back | Wróć |

#### `src/components/shared/AdminButton.tsx`
| Current | Polish |
|---------|--------|
| aria-label="Admin" | aria-label="Zarządzanie" |

#### `src/components/shared/DoubleConfirmButton.tsx`
| Current | Polish |
|---------|--------|
| aria-label="Confirm" | aria-label="Potwierdź" |
| aria-label="Delete" | aria-label="Usuń" |

#### `src/components/shared/DayOfMonthInput.tsx`
| Current | Polish |
|---------|--------|
| label="Day of Month (1-28)" | label="Dzień miesiąca (1-28)" |

#### `src/components/transactions/TransactionForm.tsx`
| Current | Polish |
|---------|--------|
| placeholder="Description" | placeholder="Opis" |
| placeholder="Amount (negative for expense)" | placeholder="Kwota (ujemna = wydatek)" |
| Add / Adding... | Dodaj / Dodawanie... |

### 9. Date / Locale changes

#### `src/root.tsx`
`<body lang="en">` → `<body lang="pl">`

#### `src/components/transactions/PeriodHeader.tsx`
| Current | Polish |
|---------|--------|
| `toLocaleString("en-US", ...)` | `toLocaleString("pl-PL", ...)` |
| "Transactions" (startTs === 0 label) | "Transakcje" |
| `getOrdinal()` suffix removed (Polish dates: "1 maja 2026") | Format: `{day} {month} {year}` via `pl-PL` locale |

**Note**: The `getOrdinal()` function in `src/utils/date.ts` becomes unused and can be removed.

#### `src/components/shared/PeriodStartButton.tsx`
| Current | Polish |
|---------|--------|
| `Added allowance. Balance: $${data.newBalance}` | `Dodano kieszonkowe. Saldo: ${data.newBalance} zł` |
| `No allowance needed` | `Kieszonkowe nie jest potrzebne` |
| `${props.successPrefix || "Added"} ${data.paymentsCreated} payments.` | `${props.successPrefix || "Dodano"} ${data.paymentsCreated} płatności.` |
| `No period-start needed` | `Rozpoczęcie okresu nie jest potrzebne` |
| `Added period-start.` | `Dodano rozpoczęcie okresu.` |

### 10. `src/utils/date.ts`

The `getOrdinal()` function (English ordinal suffixes: st, nd, rd, th) becomes unused. Function declaration + body can be removed. Verify no other callers exist.

## What stays English

- All routing paths (e.g. `/parcels/incoming`, `/meals/dinner`)
- Code identifiers (variable names, function names, DB column names)
- `data-testid` attribute values (exception: `PeriodStartButton.tsx` derives testId from Polish `buttonText` — see mapping below)
- DB slug values (e.g. `"electricity"`, `"rent"`)
- The word "Slug" as a field label stays as "Slug" (user confirmed)
- App name "Bombos 2.5" stays as-is
- Error messages from API responses (server-side, not UI-defined)
- `Alt` text on decorative images stays English (user did not request, but UI-critical ones like parcel images translated above)

## Acceptance criteria

1. Every string listed in the mapping above is translated to the Polish equivalent.
2. `data-testid` values remain unchanged (exception: `PeriodStartButton.tsx` generates testId dynamically from Polish `buttonText`, see §PeriodStartButton mapping).
3. Routing paths remain unchanged.
4. All `.tsx` literals are changed inline — no i18n framework, no dictionary file.
5. `lang="pl"` on `<body>`.
6. Date formatting in `PeriodHeader.tsx` uses Polish locale (`pl-PL`).
7. `getOrdinal()` function is removed from `src/utils/date.ts` (no remaining callers).

## Tests

No new tests needed — existing E2E tests use `data-testid` selectors which stay English, so they continue to pass. The visual content of pages changes but the functional behavior is identical. Run full suite to confirm no regressions:

- `pnpm build` — verifies TypeScript compilation
- `pnpm e2e` — verifies all E2E tests still pass (test selectors unchanged)
- `pnpm test.db` — verifies DB unit tests pass (no DB changes)
- `pnpm build.types` — TypeScript check

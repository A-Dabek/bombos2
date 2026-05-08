export function formatPolishDate(date: Date): string {
  return date.toLocaleDateString("pl-PL", { day: "numeric", month: "long" });
}
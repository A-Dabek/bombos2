export function normalizeProductName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "");
}

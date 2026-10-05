import { test, expect } from "vitest";
import { resolveOcrOptions, stripSpuriousUnit9 } from "./ocr-options.ts";

test("resolveOcrOptions returns defaults", () => {
  expect(resolveOcrOptions({})).toEqual({
    scale: 2,
    psm: "6",
    binarize: false,
    stripSpuriousUnit9: false,
    maxWidth: 4000,
  });
});

test("resolveOcrOptions parses and clamps OCR_SCALE", () => {
  expect(resolveOcrOptions({ OCR_SCALE: "3" }).scale).toBe(3);
  expect(resolveOcrOptions({ OCR_SCALE: "abc" }).scale).toBe(2);
  expect(resolveOcrOptions({ OCR_SCALE: "9" }).scale).toBe(4);
  expect(resolveOcrOptions({ OCR_SCALE: "0" }).scale).toBe(1);
});

test("resolveOcrOptions parses OCR_PSM by name or number", () => {
  expect(resolveOcrOptions({ OCR_PSM: "SPARSE_TEXT" }).psm).toBe("11");
  expect(resolveOcrOptions({ OCR_PSM: "sparse_text" }).psm).toBe("11");
  expect(resolveOcrOptions({ OCR_PSM: "single_block" }).psm).toBe("6");
  expect(resolveOcrOptions({ OCR_PSM: "6" }).psm).toBe("6");
  expect(resolveOcrOptions({ OCR_PSM: "bogus" }).psm).toBe("6");
});

test("resolveOcrOptions parses truthy booleans", () => {
  expect(resolveOcrOptions({ OCR_BINARIZE: "true" }).binarize).toBe(true);
  expect(resolveOcrOptions({ OCR_BINARIZE: "0" }).binarize).toBe(false);
  expect(resolveOcrOptions({ OCR_STRIP_SPURIOUS_9: "1" }).stripSpuriousUnit9).toBe(true);
  expect(resolveOcrOptions({ OCR_STRIP_SPURIOUS_9: "yes" }).stripSpuriousUnit9).toBe(true);
});

test("stripSpuriousUnit9 removes a trailing 9 before a unit", () => {
  expect(stripSpuriousUnit9("109 g")).toBe("10 g");
  expect(stripSpuriousUnit9("250 ml")).toBe("250 ml");
  expect(stripSpuriousUnit9("19 kg")).toBe("1 kg");
  expect(stripSpuriousUnit9("2 dag")).toBe("2 dag");
});

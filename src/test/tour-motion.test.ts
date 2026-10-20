import { describe, expect, it } from "vitest";
import { tourMotion } from "@/lib/tour-motion";

describe("movimento panorâmico", () => {
  it("move a imagem lentamente da esquerda para a direita", () => {
    expect(tourMotion(false).autoRotate).toBeGreaterThan(0);
    expect(tourMotion(false).autoRotate).toBeLessThanOrEqual(2);
  });
  it("retoma o movimento após a navegação manual", () => {
    expect(tourMotion(false).autoRotateInactivityDelay).toBe(4000);
  });
  it("suaviza a desaceleração manual", () => {
    expect(tourMotion(false).friction).toBeLessThan(0.08);
  });
  it("respeita a preferência por redução de movimento", () => {
    expect(tourMotion(true).autoRotate).toBe(false);
    expect(tourMotion(true).autoRotateInactivityDelay).toBe(-1);
  });
});
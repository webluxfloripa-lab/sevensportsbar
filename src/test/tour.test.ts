import { describe, expect, it } from "vitest";
import { scenes, sceneById } from "@/data/tour";

describe("mapa do tour", () => {
  it("tem 22 ambientes", () => expect(scenes).toHaveLength(22));
  it("todas as setas levam a cenas existentes e têm retorno", () => {
    for (const s of scenes)
      for (const l of s.links) {
        const dest = sceneById(l.to);
        expect(dest, `${s.id}->${l.to}`).toBeDefined();
        expect(dest!.links.some((b) => b.to === s.id), `${l.to}->${s.id}`).toBe(true);
      }
  });
  it("nenhuma cena tem setas sobrepostas (menos de 12° de distância)", () => {
    for (const s of scenes)
      s.links.forEach((a, i) =>
        s.links.slice(i + 1).forEach((b) => {
          const dy = Math.abs((((a.yaw - b.yaw) % 360) + 540) % 360 - 180);
          expect(dy + Math.abs(a.pitch - b.pitch), `cena ${s.id}`).toBeGreaterThanOrEqual(12);
        }),
      );
  });
});

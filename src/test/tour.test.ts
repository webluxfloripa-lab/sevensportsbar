import { describe, expect, it } from "vitest";
import { scenes, sceneById } from "@/data/tour";

describe("mapa do tour", () => {
  it("tem 22 ambientes", () => expect(scenes).toHaveLength(22));
  it("recupera o acesso ao telão pelo bar e preserva o retorno", () => {
    expect(sceneById('10')?.links.some(l => l.to === '5')).toBe(true);
    expect(sceneById('5')?.links.some(l => l.to === '10')).toBe(true);
  });
  it("mantém pelo menos 19 graus entre os retornos do salão à recepção e ao lounge", () => {
    const links = sceneById('4')?.links ?? [];
    const reception = links.find(l => l.to === '21');
    const lounge = links.find(l => l.to === '3');
    expect(reception).toBeDefined();
    expect(lounge).toBeDefined();
    if (!reception || !lounge) return;
    expect(Math.abs(reception.yaw - lounge.yaw)).toBeGreaterThanOrEqual(19);
  });
  it("a entrada leva à recepção e permite voltar", () => {
    expect(sceneById('2')?.links.some(l => l.to === '21')).toBe(true);
    expect(sceneById('21')?.links.some(l => l.to === '2')).toBe(true);
  });
  it("recepção, sofá e salão possuem conexões de ida e volta", () => {
    for (const [from, to] of [['21', '3'], ['21', '4'], ['3', '4']] as const) {
      expect(sceneById(from)?.links.some(l => l.to === to)).toBe(true);
      expect(sceneById(to)?.links.some(l => l.to === from)).toBe(true);
    }
  });
  it("todas as setas levam a cenas existentes e têm retorno", () => {
    for (const s of scenes)
      for (const l of s.links) {
        const dest = sceneById(l.to);
        expect(dest, `${s.id}->${l.to}`).toBeDefined();
        expect(dest?.links.some((b) => b.to === s.id), `${l.to}->${s.id}`).toBe(true);
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

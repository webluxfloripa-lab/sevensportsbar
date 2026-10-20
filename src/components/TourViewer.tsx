import { useEffect, useRef, useState } from "react";
import { scenes, sceneById, type TourScene } from "@/data/tour";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window { pannellum?: any }
}

function loadPannellum(): Promise<any> {
  if (window.pannellum) return Promise.resolve(window.pannellum);
  return new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-pnlm]')) {
      const l = document.createElement("link");
      l.rel = "stylesheet"; l.href = "/vendor/pannellum.css"; l.setAttribute("data-pnlm", "1");
      document.head.appendChild(l);
    }
    const s = document.createElement("script");
    s.src = "/vendor/pannellum.js";
    s.onload = () => resolve(window.pannellum);
    s.onerror = reject;
    document.body.appendChild(s);
  });
}

const STORAGE = "tour360-ajustes";
type Overrides = Record<string, { yaw: number; pitch: number }>;

function buildConfig(list: TourScene[], ov: Overrides, first: string) {
  const sc: Record<string, any> = {};
  for (const s of list) {
    sc[s.id] = {
      type: "equirectangular",
      panorama: s.image,
      yaw: s.yaw, pitch: s.pitch, hfov: 100, minPitch: -62, maxPitch: 80,
      hotSpots: s.links.map((l) => {
        const o = ov[`${s.id}>${l.to}`];
        return {
          type: "scene", sceneId: l.to,
          yaw: o?.yaw ?? l.yaw, pitch: o?.pitch ?? l.pitch,
          cssClass: "tour-arrow",
          createTooltipFunc: (div: HTMLElement) => {
            div.setAttribute("aria-label", `Ir para ${sceneById(l.to)?.name}`);
            div.title = sceneById(l.to)?.name ?? "";
          },
        };
      }),
    };
  }
  return { default: { firstScene: first, sceneFadeDuration: 600, autoLoad: true, showControls: false, compass: false, friction: 0.08, mouseZoom: "fullscreenonly", touchPanSpeedCoeffFactor: 1.2 }, scenes: sc };
}

export default function TourViewer({ embed, initialScene }: { embed: boolean; initialScene: string }) {
  const el = useRef<HTMLDivElement>(null);
  const viewer = useRef<any>(null);
  const history = useRef<string[]>([]);
  const [current, setCurrent] = useState(initialScene);
  const [menu, setMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [ov, setOv] = useState<Overrides>({});
  const [editLink, setEditLink] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    let saved: Overrides = {};
    try { saved = JSON.parse(localStorage.getItem(STORAGE) || "{}"); } catch { /* vazio */ }
    setOv(saved);
    let alive = true;
    loadPannellum().then((p) => {
      if (!alive || !el.current) return;
      viewer.current = p.viewer(el.current, buildConfig(scenes, saved, initialScene));
      viewer.current.on("load", () => setLoading(false));
      viewer.current.on("scenechange", (id: string) => { setLoading(true); setCurrent((prev) => { history.current.push(prev); return id; }); });
    });
    return () => { alive = false; viewer.current?.destroy?.(); };
  }, [initialScene]);

  const go = (id: string) => { if (id !== current) viewer.current?.loadScene(id); setMenu(false); };
  const back = () => { const p = history.current.pop(); if (p) { viewer.current?.loadScene(p); history.current.pop(); } };
  const zoom = (d: number) => viewer.current?.setHfov(viewer.current.getHfov() + d);
  const full = () => viewer.current?.toggleFullscreen();

  const scene = sceneById(current)!;
  useEffect(() => { setEditLink(scene?.links[0]?.to ?? ""); }, [current]); // eslint-disable-line react-hooks/exhaustive-deps

  const capture = () => {
    const v = viewer.current; if (!v || !editLink) return;
    const key = `${current}>${editLink}`;
    const yaw = Math.round(v.getYaw()), pitch = Math.round(v.getPitch());
    const next = { ...ov, [key]: { yaw, pitch } };
    setOv(next); localStorage.setItem(STORAGE, JSON.stringify(next));
    v.removeHotSpot?.(undefined);
    // recarrega a cena com a nova posição
    const cfg = buildConfig(scenes, next, current);
    v.destroy(); viewer.current = window.pannellum.viewer(el.current, cfg);
    viewer.current.on("load", () => setLoading(false));
    viewer.current.on("scenechange", (id: string) => { setLoading(true); setCurrent((prev) => { history.current.push(prev); return id; }); });
    viewer.current.setYaw(yaw); viewer.current.setPitch(pitch);
    setInfo(`Seta ${current} → ${editLink} registrada em yaw ${yaw}°, pitch ${pitch}°.`);
  };
  const exportMap = () => {
    const out = scenes.map((s) => ({ ...s, links: s.links.map((l) => ({ ...l, ...(ov[`${s.id}>${l.to}`] ?? {}) })) }));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: "application/json" }));
    a.download = "tour-ajustado.json"; a.click();
  };
  const reset = () => { localStorage.removeItem(STORAGE); location.reload(); };

  const filtered = scenes.filter((s) => (s.name + s.group).toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <section className={embed ? "relative h-dvh w-full" : "relative h-[78dvh] min-h-[420px] w-full"} aria-label="Passeio virtual panorâmico">
        <div ref={el} className="absolute inset-0 bg-background" />
        {loading && (
          <div role="status" className="pointer-events-none absolute inset-0 grid place-items-center">
            <span className="tour-spinner" aria-label="Carregando ambiente" />
          </div>
        )}
        <button onClick={() => setMenu(true)} aria-expanded={menu} className="tour-glass absolute right-3 top-3 z-10 rounded-full px-4 py-2.5 text-sm font-medium">
          ☷ Ambientes
        </button>
        <div className="tour-glass absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full p-1">
          {[
            ["←", "Voltar ao ponto anterior", back],
            ["⌂", "Voltar ao início", () => go("1")],
            ["−", "Diminuir zoom", () => zoom(10)],
            ["+", "Aumentar zoom", () => zoom(-10)],
            ["⛶", "Tela cheia", full],
          ].map(([icon, label, fn]) => (
            <button key={label as string} onClick={fn as () => void} aria-label={label as string} title={label as string} className="tour-ctrl">{icon as string}</button>
          ))}
        </div>

        {menu && (
          <aside className="tour-drawer absolute inset-y-0 right-0 z-20 flex w-full max-w-sm flex-col p-4" aria-label="Lista de ambientes">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-2xl">Os ambientes</h2>
              <button onClick={() => setMenu(false)} aria-label="Fechar ambientes" className="tour-ctrl">×</button>
            </div>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar ambiente…" aria-label="Buscar ambiente" className="mb-3 rounded-lg border border-border bg-input px-3 py-2.5 text-sm" />
            <ul className="grid flex-1 grid-cols-2 content-start gap-2 overflow-y-auto">
              {filtered.map((s) => (
                <li key={s.id}>
                  <button onClick={() => go(s.id)} aria-current={s.id === current} className="tour-thumb w-full text-left">
                    <img src={s.thumb} alt={s.name} loading="lazy" className="aspect-[2/1] w-full rounded-md object-cover" />
                    <span className="block px-1 pt-1 text-[11px] uppercase tracking-wider text-primary">{s.group}</span>
                    <span className="block px-1 pb-1 text-xs leading-tight">{s.id}. {s.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </section>

      {!embed && (
        <details className="mx-auto my-8 max-w-3xl rounded-xl border border-border bg-card p-5 text-sm">
          <summary className="cursor-pointer font-medium">Conferência do mapa e ajuste de setas</summary>
          <p className="mt-3 text-muted-foreground">Gire a imagem até a passagem ficar no centro, escolha a conexão e posicione a seta. Os ajustes ficam neste navegador até você baixar o mapa.</p>
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1">
              <span>Conexão de "{scene?.name}"</span>
              <select value={editLink} onChange={(e) => setEditLink(e.target.value)} className="rounded-md border border-border bg-input px-3 py-2">
                {scene?.links.map((l) => <option key={l.to} value={l.to}>→ {l.to}. {sceneById(l.to)?.name}</option>)}
              </select>
            </label>
            <button onClick={capture} className="tour-btn">Posicionar seta no centro da visão</button>
            <button onClick={exportMap} className="tour-btn-ghost">Baixar mapa ajustado</button>
            <button onClick={reset} className="tour-btn-ghost">Descartar ajustes</button>
          </div>
          {info && <p className="mt-3 text-primary" role="status">{info}</p>}
        </details>
      )}
    </>
  );
}

import { useEffect, useRef, useState } from "react";
import { scenes, sceneById, type TourScene } from "@/data/tour";
import { Button } from "@/components/ui/button";
import { Pause, Play } from "lucide-react";
import { tourMotion, TOUR_ROTATION_SPEED } from "@/lib/tour-motion";

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


function buildConfig(list: TourScene[], first: string) {
  const sc: Record<string, any> = {};
  for (const s of list) {
    sc[s.id] = {
      type: "equirectangular",
      panorama: s.image,
      yaw: s.yaw, pitch: s.pitch, hfov: 100, minPitch: -62, maxPitch: 80,
      hotSpots: s.links.map((l) => {
        return {
          type: "scene", sceneId: l.to,
          yaw: l.yaw, pitch: l.pitch,
          cssClass: "tour-arrow published-arrow",
          createTooltipFunc: (div: HTMLElement) => {
            div.setAttribute("aria-label", `Ir para ${sceneById(l.to)?.name}`);
            div.title = l.label || sceneById(l.to)?.name || "";
            div.style.setProperty('--arrow-rotation', `${l.rotation ?? 0}deg`);
            div.style.setProperty('--arrow-size', `${l.size ?? 52}px`);
            div.style.setProperty('--arrow-opacity', String(l.opacity ?? 1));
            div.style.setProperty('--arrow-color', `var(--${l.tone === 'foreground' ? 'foreground' : 'primary'})`);
            div.classList.toggle('plain', l.style === 'plain');
          },
        };
      }),
    };
  }
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return { default: { firstScene: first, sceneFadeDuration: reducedMotion ? 0 : 900, autoLoad: true, showControls: false, compass: false, ...tourMotion(reducedMotion), mouseZoom: "fullscreenonly" }, scenes: sc };
}

export default function TourViewer({ embed, initialScene, list: loadedScenes }: { embed: boolean; initialScene: string; list?: TourScene[] | null }) {
  const list = loadedScenes ?? scenes;
  const el = useRef<HTMLDivElement>(null);
  const viewer = useRef<any>(null);
  const history = useRef<string[]>([]);
  const playingRef = useRef(true);
  const [playing, setPlaying] = useState(true);
  const [current, setCurrent] = useState(initialScene);
  const [menu, setMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    playingRef.current = !preference.matches;
    setPlaying(playingRef.current);
    const applyPreference = () => {
      playingRef.current = !preference.matches;
      setPlaying(playingRef.current);
      if (playingRef.current) viewer.current?.startAutoRotate(TOUR_ROTATION_SPEED, viewer.current.getPitch());
      else viewer.current?.stopAutoRotate();
    };
    preference.addEventListener("change", applyPreference);
    let alive = true;
    loadPannellum().then((p) => {
      if (!alive || !el.current) return;
      viewer.current = p.viewer(el.current, buildConfig(list, initialScene));
      viewer.current.on("load", () => { setLoading(false); if (!playingRef.current) viewer.current?.stopAutoRotate(); });
      viewer.current.on("scenechange", (id: string) => { setLoading(true); setCurrent((prev) => { history.current.push(prev); return id; }); });
    });
    return () => { alive = false; preference.removeEventListener("change", applyPreference); viewer.current?.destroy?.(); };
  }, [initialScene, list]);

  const go = (id: string) => { if (id !== current) viewer.current?.loadScene(id); setMenu(false); };
  const back = () => { const p = history.current.pop(); if (p) { viewer.current?.loadScene(p); history.current.pop(); } };
  const zoom = (d: number) => viewer.current?.setHfov(viewer.current.getHfov() + d, 600);
  const full = () => viewer.current?.toggleFullscreen();
  const togglePlayback = () => {
    playingRef.current = !playingRef.current;
    setPlaying(playingRef.current);
    if (playingRef.current) viewer.current?.startAutoRotate(TOUR_ROTATION_SPEED, viewer.current.getPitch());
    else viewer.current?.stopAutoRotate();
  };

  const filtered = list.filter((s) => (s.name + s.group).toLowerCase().includes(query.toLowerCase()));

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
          <Button variant="ghost" size="icon" onClick={togglePlayback} aria-label={playing ? "Pausar movimento automático" : "Iniciar movimento automático"} title={playing ? "Pausar movimento automático" : "Iniciar movimento automático"} className="tour-ctrl">
            {playing ? <Pause /> : <Play />}
          </Button>
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


    </>
  );
}

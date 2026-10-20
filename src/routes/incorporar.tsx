import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { scenes } from "@/data/tour";

export const Route = createFileRoute("/incorporar")({
  head: () => ({
    meta: [
      { title: "Incorporar o Tour 360° · Seven Sports Bar" },
      { name: "description", content: "Gere o código para colocar o tour virtual 360° em qualquer site, com escolha do ambiente inicial." },
      { property: "og:title", content: "Incorporar o Tour 360° · Seven Sports Bar" },
      { property: "og:description", content: "Código pronto para copiar e colar o tour panorâmico em outra página." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Incorporar,
});

function Incorporar() {
  const [origin, setOrigin] = useState("");
  const [scene, setScene] = useState(1);
  const [status, setStatus] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const src = `${origin}/?embed=1&scene=${scene}`;
  const code = `<iframe src="${src}" title="Tour virtual 360°" style="display:block;width:100%;aspect-ratio:16/9;min-height:420px;border:0" allow="fullscreen; gyroscope; accelerometer" allowfullscreen loading="lazy"></iframe>`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setStatus("Código copiado."); } catch { setStatus("Selecione o texto e copie manualmente."); }
  };
  return (
    <main className="mx-auto min-h-dvh max-w-4xl px-4 py-8 text-foreground">
      <Link to="/" className="text-sm text-primary">← Voltar ao tour</Link>
      <h1 className="mt-4 font-display text-4xl">Incorporar o tour</h1>
      <p className="mt-2 text-muted-foreground">Escolha o ambiente inicial, copie o código e cole no seu site.</p>
      <label className="mt-6 flex max-w-xs flex-col gap-1 text-sm">
        Ambiente inicial (1 a {scenes.length})
        <input type="number" min={1} max={scenes.length} value={scene} onChange={(e) => setScene(Math.min(scenes.length, Math.max(1, Number(e.target.value) || 1)))} className="rounded-md border border-border bg-input px-3 py-2" />
      </label>
      <textarea readOnly value={code} aria-label="Código para incorporar" className="mt-4 h-28 w-full rounded-lg border border-border bg-card p-3 font-mono text-xs" />
      <div className="mt-2 flex items-center gap-3">
        <button onClick={copy} className="tour-btn">Copiar código</button>
        <span role="status" className="text-sm text-primary">{status}</span>
      </div>
      <h2 className="mt-8 font-display text-2xl">Prévia</h2>
      {origin && <iframe key={src} src={src} title="Prévia do tour virtual 360°" className="mt-3 aspect-video min-h-[360px] w-full rounded-xl border border-border" allow="fullscreen; gyroscope; accelerometer" allowFullScreen />}
    </main>
  );
}

import { useEffect, useRef, useState } from 'react';
import { scenes } from '@/data/tour';
import type { EditableArrow } from '@/lib/admin-rules';
import { loadPannellum } from '@/lib/pannellum-loader';
import { Button } from '@/components/ui/button';

/* eslint-disable @typescript-eslint/no-explicit-any */
const clampPitch = (pitch: number) => Math.max(-62, Math.min(80, pitch));
const wrapYaw = (yaw: number) => ((yaw + 540) % 360) - 180;

export default function AdminPanorama({ sceneId, arrows, selected, placing, preview, onSelect, onPlace, onMove, onNavigate }: {
  sceneId: string; arrows: EditableArrow[]; selected: string; placing: boolean; preview: boolean;
  onSelect: (id: string) => void; onPlace: (pitch: number, yaw: number) => void;
  onMove: (id: string, pitch: number, yaw: number) => void; onNavigate: (id: string) => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const viewer = useRef<any>(null);
  // Pannellum only accepts hotspot changes after the panorama finished loading.
  const ready = useRef(false);
  const [loading, setLoading] = useState(true), [failed, setFailed] = useState(false), [attempt, setAttempt] = useState(0);
  const props = useRef({ arrows, selected, placing, preview, onSelect, onPlace, onMove, onNavigate });
  props.current = { arrows, selected, placing, preview, onSelect, onPlace, onMove, onNavigate };
  const drag = useRef<{ id: string; pitch: number; yaw: number; x: number; y: number; moved: boolean } | null>(null);

  const refresh = () => {
    const v = viewer.current; if (!v || !ready.current) return;
    try {
      for (const id of (v.getConfig().hotSpots ?? []).map((h: any) => h.id)) v.removeHotSpot(id);
      for (const a of props.current.arrows) v.addHotSpot({ id: a.id, yaw: a.yaw, pitch: a.pitch, cssClass: 'tour-arrow admin-arrow', createTooltipFunc: (div: HTMLElement) => decorate(v, div, a) });
    } catch (error) {
      console.error('Falha ao desenhar as setas do ambiente', error);
    }
  };

  const decorate = (v: any, div: HTMLElement, a: EditableArrow) => {
    div.dataset['arrowId'] = a.id;
    div.classList.toggle('selected', props.current.selected === a.id);
    div.classList.toggle('plain', a.style === 'plain');
    div.setAttribute('role', 'button');
    div.setAttribute('aria-label', a.label || `Seta para ${scenes.find(s => s.id === a.to)?.name ?? 'outro ambiente'}`);
    div.style.setProperty('--arrow-rotation', `${a.rotation}deg`);
    div.style.setProperty('--arrow-size', `${a.size}px`);
    div.style.setProperty('--arrow-opacity', String(a.opacity));
    div.style.setProperty('--arrow-color', `var(--${a.tone})`);
    div.addEventListener('pointerdown', e => {
      if (props.current.preview) return;
      e.preventDefault(); e.stopPropagation(); div.setPointerCapture(e.pointerId);
      drag.current = { id: a.id, pitch: a.pitch, yaw: a.yaw, x: e.clientX, y: e.clientY, moved: false };
      props.current.onSelect(a.id);
    });
    div.addEventListener('pointermove', e => {
      const d = drag.current; if (!d || d.id !== a.id) return;
      e.preventDefault(); e.stopPropagation();
      const coords = v.mouseEventToCoords(e);
      d.pitch = clampPitch(coords[0]); d.yaw = wrapYaw(coords[1]);
      d.moved ||= Math.hypot(e.clientX - d.x, e.clientY - d.y) > 3;
      const hot = (v.getConfig().hotSpots ?? []).find((h: any) => h.id === d.id);
      if (hot) { hot.pitch = d.pitch; hot.yaw = d.yaw; v.setYaw(v.getYaw()); }
    });
    const finish = (e: PointerEvent) => {
      const d = drag.current; if (!d || d.id !== a.id) return;
      e.stopPropagation(); drag.current = null;
      if (div.hasPointerCapture(e.pointerId)) div.releasePointerCapture(e.pointerId);
      if (d.moved && e.type !== 'pointercancel') props.current.onMove(d.id, d.pitch, d.yaw);
      else refresh();
    };
    div.addEventListener('pointerup', finish); div.addEventListener('pointercancel', finish);
    div.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); if (props.current.preview) props.current.onNavigate(a.to); });
  };

  useEffect(() => {
    let alive = true;
    let observer: ResizeObserver | undefined;
    const container = el.current;
    ready.current = false; drag.current = null;
    setLoading(true); setFailed(false);
    const place = (e: MouseEvent) => {
      const v = viewer.current;
      if (!props.current.placing || !v || !ready.current || (e.target as HTMLElement).closest('.admin-arrow,.pnlm-controls')) return;
      const [pitch, yaw] = v.mouseEventToCoords(e);
      props.current.onPlace(clampPitch(pitch), wrapYaw(yaw));
    };
    loadPannellum().then(pannellum => {
      const scene = scenes.find(s => s.id === sceneId);
      if (!alive || !container || !scene) return;
      const v = pannellum.viewer(container, { type: 'equirectangular', panorama: scene.image, yaw: scene.yaw, pitch: scene.pitch, hfov: 100, minPitch: -62, maxPitch: 80, autoLoad: true, showControls: true, autoRotate: 0, mouseZoom: true, hotSpots: [] });
      viewer.current = v;
      v.on('load', () => { if (!alive) return; ready.current = true; setLoading(false); refresh(); });
      v.on('error', () => { if (alive) { setLoading(false); setFailed(true); } });
      observer = new ResizeObserver(() => { if (ready.current) viewer.current?.resize(); });
      observer.observe(container);
      container.addEventListener('click', place);
    }).catch(() => { if (alive) { setLoading(false); setFailed(true); } });
    return () => {
      alive = false; ready.current = false; drag.current = null;
      observer?.disconnect(); container?.removeEventListener('click', place);
      try { viewer.current?.destroy(); } catch { /* viewer already torn down */ }
      viewer.current = null;
    };
  }, [sceneId, attempt]);

  useEffect(() => { if (!drag.current) refresh(); }, [arrows, selected, preview]);

  return <div className="absolute inset-0">
    <div ref={el} className={`admin-panorama ${placing ? 'placing' : ''}`} aria-label="Editor panorâmico" />
    {loading && !failed && <div role="status" className="pointer-events-none absolute inset-0 grid place-items-center"><span className="tour-spinner" aria-label="Carregando ambiente" /></div>}
    {failed && <div role="alert" className="absolute inset-0 grid place-items-center bg-background/80 p-6 text-center">
      <div className="grid gap-3"><p className="text-sm text-muted-foreground">Não foi possível exibir este ambiente.</p><Button onClick={() => setAttempt(n => n + 1)}>Tentar novamente</Button></div>
    </div>}
  </div>;
}

import { useEffect, useRef } from 'react';
import { scenes } from '@/data/tour';
import type { EditableArrow } from '@/lib/admin-rules';

export default function AdminPanorama({ sceneId, arrows, selected, placing, preview, onSelect, onPlace, onMove, onNavigate }: {
  sceneId: string; arrows: EditableArrow[]; selected: string; placing: boolean; preview: boolean;
  onSelect: (id: string) => void; onPlace: (pitch: number, yaw: number) => void;
  onMove: (id: string, pitch: number, yaw: number) => void; onNavigate: (id: string) => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const viewer = useRef<any>(null);
  const props = useRef({ arrows, selected, placing, preview, onSelect, onPlace, onMove, onNavigate });
  props.current = { arrows, selected, placing, preview, onSelect, onPlace, onMove, onNavigate };
  const drag = useRef<{ id: string; pitch: number; yaw: number; x: number; y: number; moved: boolean } | null>(null);
  const refresh = () => {
    const v = viewer.current; if (!v) return;
    for (const id of v.getConfig().hotSpots?.map((h: any) => h.id) ?? []) v.removeHotSpot(id);
    for (const a of props.current.arrows) v.addHotSpot({ id: a.id, yaw: a.yaw, pitch: a.pitch, cssClass: 'tour-arrow admin-arrow', createTooltipFunc: (div: HTMLElement) => {
      div.dataset['arrowId'] = a.id;
      div.classList.toggle('selected', props.current.selected === a.id);
      div.classList.toggle('plain', a.style === 'plain');
      div.setAttribute('aria-label', a.label || `Seta para ${scenes.find(s => s.id === a.to)?.name}`);
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
        d.pitch = Math.max(-62, Math.min(80, coords[0])); d.yaw = ((coords[1] + 540) % 360) - 180;
        d.moved ||= Math.hypot(e.clientX - d.x, e.clientY - d.y) > 3;
        const hot = v.getConfig().hotSpots.find((h: any) => h.id === d.id);
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
    } });
  };
  useEffect(() => {
    let alive = true;
    let observer: ResizeObserver | undefined;
    async function init() {
      if (!window.pannellum) await new Promise<void>((resolve, reject) => {
        if (!document.querySelector('link[data-pnlm]')) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/vendor/pannellum.css'; l.dataset['pnlm'] = '1'; document.head.append(l); }
        const s = document.createElement('script'); s.src = '/vendor/pannellum.js'; s.onload = () => resolve(); s.onerror = () => reject(); document.body.append(s);
      });
      const scene = scenes.find(s => s.id === sceneId); if (!alive || !el.current || !scene) return;
      viewer.current = window.pannellum.viewer(el.current, { type: 'equirectangular', panorama: scene.image, yaw: scene.yaw, pitch: scene.pitch, hfov: 100, minPitch: -62, maxPitch: 80, autoLoad: true, showControls: true, autoRotate: 0, mouseZoom: true });
      viewer.current.on('load', refresh);
      observer = new ResizeObserver(() => viewer.current?.resize());
      observer.observe(el.current);
      el.current.addEventListener('click', place);
    }
    const place = (e: MouseEvent) => {
      if (!props.current.placing || !viewer.current || (e.target as HTMLElement).closest('.admin-arrow,.pnlm-controls')) return;
      const [pitch, yaw] = viewer.current.mouseEventToCoords(e);
      props.current.onPlace(Math.max(-62, Math.min(80, pitch)), ((yaw + 540) % 360) - 180);
    };
    void init();
    return () => { alive = false; observer?.disconnect(); el.current?.removeEventListener('click', place); viewer.current?.destroy(); viewer.current = null; };
  }, [sceneId]);
  useEffect(() => { if (!drag.current) refresh(); }, [arrows, selected, preview]);
  return <div ref={el} className={`admin-panorama ${placing ? 'placing' : ''}`} aria-label="Editor panorâmico" />;
}
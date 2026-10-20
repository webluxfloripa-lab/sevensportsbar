import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ClientOnly } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { Plus, Save, Upload, Download, Undo2, Redo2, Eye, Send, Copy, Trash2, ArrowLeftRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { scenes } from '@/data/tour';
import { arrowSchema, configSchema, type EditableConfig, type EditableArrow } from '@/lib/admin-rules';
import { saveAdminTour, publishAdminTour, restoreAdminVersion, getAdminState } from '@/lib/admin.functions';

const Panorama = lazy(() => import('./AdminPanorama'));
export default function TourEditor({ initial, revision: firstRevision, onExpired }: { initial: EditableConfig; revision: string | null; onExpired: () => void }) {
  const [config, setConfig] = useState(initial), [saved, setSaved] = useState(initial);
  const [revision, setRevision] = useState(firstRevision);
  const [sceneId, setSceneId] = useState('1'), [selected, setSelected] = useState('');
  const [placing, setPlacing] = useState(false), [preview, setPreview] = useState(false);
  const [query, setQuery] = useState(''), [status, setStatus] = useState(''), [busy, setBusy] = useState(false);
  const [versions, setVersions] = useState<{ id: string; created_at: string }[]>([]);
  const past = useRef<EditableConfig[]>([]), future = useRef<EditableConfig[]>([]);
  const file = useRef<HTMLInputElement>(null);
  const saveFn = useServerFn(saveAdminTour), publishFn = useServerFn(publishAdminTour), restoreFn = useServerFn(restoreAdminVersion), stateFn = useServerFn(getAdminState);
  const row = config.find(s => s.id === sceneId), arrow = row?.links.find(l => l.id === selected);
  const dirty = JSON.stringify(config) !== JSON.stringify(saved);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const commit = (next: EditableConfig) => { past.current.push(config); future.current = []; setConfig(next); setStatus('Alterações pendentes'); };
  const update = (changes: Partial<EditableArrow>) => commit(config.map(s => s.id === sceneId ? { ...s, links: s.links.map(l => l.id === selected ? { ...l, ...changes } : l) } : s));
  const selectScene = (id: string) => { setSceneId(id); setSelected(''); setPlacing(false); };
  const undo = () => { const next = past.current.pop(); if (next) { future.current.push(config); setConfig(next); } };
  const redo = () => { const next = future.current.pop(); if (next) { past.current.push(config); setConfig(next); } };
  const execute = async (work: () => Promise<void>) => {
    if (busy) return; setBusy(true); setStatus('Processando…');
    try { await work(); } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Não foi possível concluir.');
      const state = await stateFn(); if (!state.authenticated) onExpired();
    } finally { setBusy(false); }
  };
  const save = () => execute(async () => { const result = await saveFn({ data: { config: configSchema.parse(config), revision } }); setRevision(result.revision); setSaved(config); setStatus('Rascunho salvo'); });
  const publish = () => { if (dirty || !revision) { setStatus('Salve o rascunho antes de publicar.'); return; } if (!confirm('Publicar estas setas no tour público?')) return;
    void execute(async () => { await publishFn({ data: { revision } }); setStatus('Tour publicado'); const state = await stateFn(); if (state.authenticated) setVersions(state.versions); });
  };
  const exportConfig = () => execute(async () => { const state = await stateFn(); if (!state.authenticated) { onExpired(); return; } const url = URL.createObjectURL(new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = 'seven-tour.json'; a.click(); URL.revokeObjectURL(url); setStatus('Configuração exportada'); });
  const importConfig = async (f?: File) => { if (!f) return; if (f.size > 1_000_000) { setStatus('Arquivo muito grande.'); return; }
    try { const next = configSchema.parse(JSON.parse(await f.text())); if (confirm('Carregar esta configuração como rascunho para pré-visualização?')) { commit(next); setPreview(true); } } catch { setStatus('Arquivo inválido. Nenhuma alteração aplicada.'); }
  };
  useEffect(() => { void stateFn().then(state => { if (state.authenticated) setVersions(state.versions); }); }, []);
  const controls = <>
    {(['rotation', 'yaw', 'pitch', 'size', 'opacity'] as const).map(key => {
      const ranges = { rotation: [-180, 180, 1], yaw: [-180, 180, .1], pitch: [-62, 80, .1], size: [32, 88, 1], opacity: [.3, 1, .05] };
      const names = { rotation: 'Orientação', yaw: 'Posição horizontal', pitch: 'Posição vertical', size: 'Tamanho', opacity: 'Opacidade' };
      const [min, max, step] = ranges[key];
      return <label key={key} className="grid gap-2 text-sm">{names[key]}<div className="flex gap-2"><input aria-label={names[key]} type="range" min={min} max={max} step={step} value={arrow?.[key] ?? min} onChange={e => update({ [key]: Number(e.target.value) })} className="min-w-0 flex-1 accent-primary" /><input aria-label={`${names[key]} numérica`} type="number" min={min} max={max} step={step} value={arrow?.[key] ?? min} onChange={e => update({ [key]: Math.max(min, Math.min(max, Number(e.target.value))) })} className="admin-input w-20" /></div></label>;
    })}
  </>;
  return <div className="admin-editor">
    <div className="admin-toolbar">
      <Button onClick={() => { setPlacing(!placing); setPreview(false); }} disabled={busy}><Plus />{placing ? 'Cancelar' : 'Adicionar seta'}</Button>
      <Button variant="outline" onClick={undo} disabled={!past.current.length || busy} aria-label="Desfazer" title="Desfazer"><Undo2 /></Button>
      <Button variant="outline" onClick={redo} disabled={!future.current.length || busy} aria-label="Refazer" title="Refazer"><Redo2 /></Button>
      <Button variant={preview ? 'secondary' : 'outline'} onClick={() => { setPreview(!preview); setPlacing(false); }}><Eye />{preview ? 'Editar' : 'Pré-visualizar'}</Button>
      <Button variant="outline" onClick={save} disabled={busy}><Save />Salvar</Button>
      <Button onClick={publish} disabled={busy || dirty || !revision}><Send />Publicar</Button>
      <span className="text-xs text-muted-foreground" role="status">{status || (dirty ? 'Alterações pendentes' : 'Sem alterações pendentes')}</span>
    </div>
    <div className="admin-workspace">
      <aside className="admin-scenes">
        <input type="search" aria-label="Buscar ambiente" placeholder="Buscar ambiente" value={query} onChange={e => setQuery(e.target.value)} className="admin-input w-full" />
        <div className="hidden md:grid gap-2 mt-3">{scenes.filter(s => s.name.toLowerCase().includes(query.toLowerCase())).map(s => <Button key={s.id} variant="ghost" onClick={() => selectScene(s.id)} aria-current={s.id === sceneId} className="h-auto w-full justify-start whitespace-normal p-2 text-left"><img src={s.thumb} alt="" className="w-14 aspect-video rounded object-cover" loading="lazy" /><span className="min-w-0 text-xs">{s.id}. {s.name}</span></Button>)}</div>
        <select aria-label="Ambiente atual" value={sceneId} onChange={e => selectScene(e.target.value)} className="admin-input w-full md:hidden">{scenes.filter(s => s.name.toLowerCase().includes(query.toLowerCase())).map(s => <option key={s.id} value={s.id}>{s.id}. {s.name}</option>)}</select>
      </aside>
      <div className="admin-stage">
        <ClientOnly><Suspense fallback={<div role="status">Carregando ambiente…</div>}><Panorama sceneId={sceneId} arrows={row?.links ?? []} selected={selected} placing={placing} preview={preview} onSelect={setSelected} onNavigate={selectScene} onPlace={(pitch, yaw) => {
          const id = crypto.randomUUID(); const a = arrowSchema.parse({ id, to: scenes.find(s => s.id !== sceneId)?.id ?? '1', pitch, yaw }); commit(config.map(s => s.id === sceneId ? { ...s, links: [...s.links, a] } : s)); setSelected(id); setPlacing(false);
        }} onMove={(id, pitch, yaw) => commit(config.map(s => s.id === sceneId ? { ...s, links: s.links.map(a => a.id === id ? { ...a, pitch, yaw } : a) } : s))} /></Suspense></ClientOnly>
      </div>
      <aside className={`admin-properties ${arrow && !preview ? 'open' : ''}`}>
        <div className="flex items-center justify-between"><h2 className="font-display text-2xl">{preview ? 'Pré-visualização' : 'Setas do ambiente'}</h2>{arrow && <Button variant="ghost" size="icon" aria-label="Fechar propriedades" onClick={() => setSelected('')}><X /></Button>}</div>
        {!arrow && <div className="grid gap-2 mt-3">{row?.links.map(a => <Button key={a.id} variant="outline" onClick={() => setSelected(a.id)}>{scenes.find(s => s.id === a.to)?.name}</Button>)}</div>}
        {arrow && !preview && <div className="grid gap-4 mt-4">
          <label className="grid gap-1 text-sm">Destino<select className="admin-input" value={arrow.to} onChange={e => update({ to: e.target.value })}>{scenes.map(s => <option key={s.id} value={s.id}>{s.id}. {s.name}</option>)}</select></label>
          {controls}
          <label className="grid gap-1 text-sm">Identificação<input className="admin-input" maxLength={100} value={arrow.label} onChange={e => update({ label: e.target.value })} /></label>
          <label className="grid gap-1 text-sm">Estilo<select className="admin-input" value={arrow.style} onChange={e => update({ style: e.target.value as EditableArrow['style'] })}><option value="circle">Circular</option><option value="plain">Sem círculo</option></select></label>
          <label className="grid gap-1 text-sm">Cor<select className="admin-input" value={arrow.tone} onChange={e => update({ tone: e.target.value as EditableArrow['tone'] })}><option value="primary">Dourada</option><option value="foreground">Clara</option></select></label>
          <div className="flex flex-wrap gap-2"><Button variant="outline" aria-label="Duplicar seta" title="Duplicar seta" onClick={() => { const a = { ...arrow, id: crypto.randomUUID(), yaw: ((arrow.yaw + 555) % 360) - 180 }; commit(config.map(s => s.id === sceneId ? { ...s, links: [...s.links, a] } : s)); setSelected(a.id); }}><Copy /></Button>
          <Button variant="outline" onClick={() => { const dest = arrow.to; selectScene(dest); setPlacing(true); setStatus(`Selecione a posição da seta de retorno para ${sceneId}.`); }}><Plus />Retorno</Button>
          <Button variant="outline" aria-label="Inverter conexão" title="Inverter conexão" onClick={() => { if (!confirm('Mover a conexão para o ambiente de destino? Ajuste sua posição depois.')) return; commit(config.map(s => s.id === sceneId ? { ...s, links: s.links.filter(a => a.id !== arrow.id) } : s.id === arrow.to ? { ...s, links: [...s.links, { ...arrow, to: sceneId }] } : s)); selectScene(arrow.to); }}><ArrowLeftRight /></Button>
          <Button variant="destructive" aria-label="Excluir seta" title="Excluir seta" onClick={() => { if (confirm('Excluir esta seta do rascunho?')) { commit(config.map(s => s.id === sceneId ? { ...s, links: s.links.filter(a => a.id !== selected) } : s)); setSelected(''); } }}><Trash2 /></Button></div>
          <Button onClick={save} disabled={busy}><Save />Salvar rascunho</Button>
        </div>}
      </aside>
    </div>
    <footer className="admin-toolbar">
      <Button variant="ghost" onClick={exportConfig} disabled={busy}><Download />Exportar</Button>
      <Button variant="ghost" onClick={() => file.current?.click()} disabled={busy}><Upload />Importar</Button><input ref={file} type="file" accept="application/json,.json" className="hidden" onChange={e => { void importConfig(e.target.files?.[0]); e.target.value = ''; }} />
      <Button variant="ghost" onClick={() => { if (confirm('Descartar alterações não salvas?')) commit(saved); }} disabled={!dirty || busy}>Descartar</Button>
      <select aria-label="Restaurar versão publicada" value="" className="admin-input max-w-full" disabled={busy || !versions.length} onChange={e => { const id = e.target.value; if (id && confirm('Recuperar esta versão como rascunho?')) void execute(async () => { commit(await restoreFn({ data: { id } })); setStatus('Versão recuperada. Salve para manter o rascunho.'); }); }}><option value="">Versões publicadas</option>{versions.map(v => <option key={v.id} value={v.id}>{new Date(v.created_at).toLocaleString('pt-BR')}</option>)}</select>
    </footer>
  </div>;
}
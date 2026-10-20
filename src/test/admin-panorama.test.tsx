import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import AdminPanorama from '@/components/AdminPanorama';
import { originalConfig } from '@/lib/admin-rules';

type FakeViewer = { loaded: boolean; handlers: Record<string, () => void>; added: number };
const viewers: FakeViewer[] = [];

// Mirrors Pannellum: changing hotspots before the panorama loads throws.
function fakeViewer() {
  const state: FakeViewer = { loaded: false, handlers: {}, added: 0 };
  const config: { hotSpots?: { id: string }[] } = {};
  viewers.push(state);
  return {
    on: (event: string, fn: () => void) => { state.handlers[event] = () => { if (event === 'load') { state.loaded = true; config.hotSpots = []; } fn(); }; },
    getConfig: () => config,
    addHotSpot: (h: { id: string }) => { if (!config.hotSpots) throw new TypeError("Cannot read properties of undefined (reading 'push')"); config.hotSpots.push(h); state.added++; },
    removeHotSpot: (id: string) => { if (!config.hotSpots) throw new TypeError('not loaded'); config.hotSpots = config.hotSpots.filter(h => h.id !== id); },
    resize: vi.fn(), destroy: vi.fn(), mouseEventToCoords: () => [0, 0], getYaw: () => 0, setYaw: vi.fn(),
  };
}
const props = { selected: '', placing: false, preview: false, onSelect: vi.fn(), onPlace: vi.fn(), onMove: vi.fn(), onNavigate: vi.fn() };
const config = originalConfig();
const flush = () => act(async () => { await Promise.resolve(); });

describe('editor panorâmico ao trocar de ambiente', () => {
  beforeEach(() => {
    viewers.length = 0;
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
    window.pannellum = { viewer: vi.fn(fakeViewer) };
  });
  afterEach(() => { cleanup(); delete window.pannellum; vi.unstubAllGlobals(); });

  it('não quebra a página quando o novo ambiente ainda está carregando', async () => {
    const view = render(<AdminPanorama sceneId="1" arrows={config[0]!.links} {...props} />);
    await flush();
    act(() => viewers[0]!.handlers['load']!());
    expect(() => view.rerender(<AdminPanorama sceneId="6" arrows={config[5]!.links} {...props} />)).not.toThrow();
    await flush();
    expect(viewers).toHaveLength(2);
    expect(viewers[1]!.added).toBe(0);
    act(() => viewers[1]!.handlers['load']!());
    expect(viewers[1]!.added).toBe(config[5]!.links.length);
  });
});

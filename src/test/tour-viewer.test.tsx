import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import TourViewer from '@/components/TourViewer';
import { scenes } from '@/data/tour';

describe('tour sem dados de carregamento', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    window.pannellum = { viewer: vi.fn(() => ({ on: vi.fn(), destroy: vi.fn() })) };
  });
  afterEach(() => { cleanup(); delete window.pannellum; vi.unstubAllGlobals(); });
  it.each([undefined, null])('preserva os 20 ambientes quando os dados estão %s', list => {
    render(<TourViewer embed initialScene="1" list={list} />);
    fireEvent.click(screen.getByRole('button', { name: /Ambientes/ }));
    expect(screen.getAllByRole('img')).toHaveLength(20);
  });
  it('usa os dados publicados quando disponíveis', () => {
    render(<TourViewer embed initialScene="1" list={scenes.slice(0, 1)} />);
    fireEvent.click(screen.getByRole('button', { name: /Ambientes/ }));
    expect(screen.getAllByRole('img')).toHaveLength(1);
  });
});
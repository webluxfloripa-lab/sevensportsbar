import { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

/** Keeps a panorama failure inside its own area instead of blanking the whole page. */
export default class PanoramaBoundary extends Component<{ children: ReactNode; resetKey: string }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override componentDidCatch(error: unknown) { console.error('Falha no visualizador do ambiente', error); }
  override componentDidUpdate(previous: { resetKey: string }) {
    if (previous.resetKey !== this.props.resetKey && this.state.failed) this.setState({ failed: false });
  }
  override render() {
    if (!this.state.failed) return this.props.children;
    return <div role="alert" className="absolute inset-0 grid place-items-center p-6 text-center">
      <div className="grid gap-3">
        <p className="text-sm text-muted-foreground">Não foi possível exibir este ambiente.</p>
        <Button onClick={() => this.setState({ failed: false })}>Tentar novamente</Button>
      </div>
    </div>;
  }
}

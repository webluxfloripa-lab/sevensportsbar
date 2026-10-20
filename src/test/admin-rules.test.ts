import { describe, it, expect } from 'vitest';
import { configSchema, originalConfig } from '@/lib/admin-rules';
describe('administração segura do tour', () => {
  it('preserva todos os ambientes', () => expect(configSchema.safeParse(originalConfig().slice(1)).success).toBe(false));
  it('não publica destino inexistente', () => { const c = originalConfig(); const a = c[0]?.links[0]; if (!a) throw new Error('Mapa sem seta'); a.to = '999'; expect(configSchema.safeParse(c).success).toBe(false); });
  it('não aceita posição fora do panorama', () => { const c = originalConfig(); const a = c[0]?.links[0]; if (!a) throw new Error('Mapa sem seta'); a.pitch = 81; expect(configSchema.safeParse(c).success).toBe(false); });
  it('aceita múltiplas setas e conexão sem retorno obrigatório', () => { const c = originalConfig(); const s = c[0], a = s?.links[0]; if (!s || !a) throw new Error('Mapa sem seta'); s.links.push({ ...a, id: 'nova-seta', to: '20' }); expect(configSchema.safeParse(c).success).toBe(true); });
});

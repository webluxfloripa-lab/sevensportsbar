import { describe, it, expect } from 'vitest';
import { ADMIN_SESSION_SECONDS, configSchema, originalConfig, sessionIsValid } from '@/lib/admin-rules';
describe('administração segura do tour', () => {
  it('recusa sessão inexistente', () => expect(sessionIsValid(undefined, 100)).toBe(false));
  it('recusa sessão expirada, inclusive no instante da expiração', () => expect(sessionIsValid(100, 100)).toBe(false));
  it('mantém sessão válida antes da expiração', () => expect(sessionIsValid(101, 100)).toBe(true));
  it('limita a sessão a quatro horas', () => expect(ADMIN_SESSION_SECONDS).toBe(14400));
  it('preserva os 20 ambientes', () => expect(configSchema.safeParse(originalConfig().slice(1)).success).toBe(false));
  it('não publica destino inexistente', () => { const c = originalConfig(); const a = c[0]?.links[0]; if (!a) throw new Error('Mapa sem seta'); a.to = '999'; expect(configSchema.safeParse(c).success).toBe(false); });
  it('não aceita posição fora do panorama', () => { const c = originalConfig(); const a = c[0]?.links[0]; if (!a) throw new Error('Mapa sem seta'); a.pitch = 81; expect(configSchema.safeParse(c).success).toBe(false); });
  it('aceita múltiplas setas e conexão sem retorno obrigatório', () => { const c = originalConfig(); const s = c[0], a = s?.links[0]; if (!s || !a) throw new Error('Mapa sem seta'); s.links.push({ ...a, id: 'nova-seta', to: '20' }); expect(configSchema.safeParse(c).success).toBe(true); });
});
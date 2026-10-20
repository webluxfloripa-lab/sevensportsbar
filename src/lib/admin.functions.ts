import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { configSchema, originalConfig, ADMIN_SESSION_SECONDS } from './admin-rules';

export const loginAdmin = createServerFn({ method: 'POST' }).inputValidator(z.object({ password: z.string().min(1).max(256) })).handler(async ({ data }) => {
  const expected = process.env['SEVEN_ADMIN_PASSWORD'];
  const secret = process.env['SEVEN_SESSION_SECRET'];
  if (!expected || !secret) return { ok: false, message: 'Acesso indisponível. Tente novamente mais tarde.' };
  const { createHash, timingSafeEqual, randomUUID } = await import('node:crypto');
  const match = timingSafeEqual(createHash('sha256').update(data.password).digest(), createHash('sha256').update(expected).digest());
  if (!match) return { ok: false, message: 'Senha incorreta.' };
  const { adminSession } = await import('./admin-session.server');
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const token = randomUUID(), expiresAt = Date.now() + ADMIN_SESSION_SECONDS * 1000;
  const { error } = await supabaseAdmin.from('tour_admin_sessions').insert({ id: token, expires_at: new Date(expiresAt).toISOString() });
  if (error) return { ok: false, message: 'Não foi possível entrar. Tente novamente.' };
  await (await adminSession(secret)).update({ token, expiresAt });
  return { ok: true, message: '' };
});
export const getAdminState = createServerFn({ method: 'GET' }).handler(async () => {
  const secret = process.env['SEVEN_SESSION_SECRET'];
  if (!secret) return { authenticated: false as const };
  const { requireAdmin } = await import('./admin-session.server');
  try {
    const session = await requireAdmin(secret);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data, error } = await supabaseAdmin.from('tour_configuration').select('*').eq('id', 'draft').maybeSingle();
    const versions = await supabaseAdmin.from('tour_versions').select('id,created_at').order('created_at', { ascending: false }).limit(30);
    if (error || versions.error) throw new Error('Falha na leitura.');
    return { authenticated: true as const, config: data ? configSchema.parse(data.scenes) : originalConfig(), revision: data?.revision ?? null, versions: versions.data ?? [], expiresAt: session.data.expiresAt };
  } catch { return { authenticated: false as const }; }
});
export const logoutAdmin = createServerFn({ method: 'POST' }).handler(async () => {
  const secret = process.env['SEVEN_SESSION_SECRET'];
  if (!secret) return;
  const { adminSession } = await import('./admin-session.server');
  const session = await adminSession(secret);
  if (session.data.token) {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    await supabaseAdmin.from('tour_admin_sessions').delete().eq('id', session.data.token);
  }
  await session.clear();
});
export const saveAdminTour = createServerFn({ method: 'POST' }).inputValidator(z.object({ config: configSchema, revision: z.string().uuid().nullable() })).handler(async ({ data }) => {
  const secret = process.env['SEVEN_SESSION_SECRET'];
  if (!secret) throw new Error('Acesso indisponível.');
  const { requireAdmin } = await import('./admin-session.server'); await requireAdmin(secret);
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { randomUUID } = await import('node:crypto');
  const row = { scenes: data.config, revision: randomUUID(), updated_at: new Date().toISOString() };
  const result = data.revision
    ? await supabaseAdmin.from('tour_configuration').update(row).eq('id', 'draft').eq('revision', data.revision).select('revision').maybeSingle()
    : await supabaseAdmin.from('tour_configuration').insert({ id: 'draft', ...row }).select('revision').single();
  if (result.error || !result.data) throw new Error('Não foi possível salvar. Recarregue para conferir a versão mais recente.');
  return result.data;
});
export const publishAdminTour = createServerFn({ method: 'POST' }).inputValidator(z.object({ revision: z.string().uuid() })).handler(async ({ data }) => {
  const secret = process.env['SEVEN_SESSION_SECRET']; if (!secret) throw new Error('Acesso indisponível.');
  const { requireAdmin } = await import('./admin-session.server'); await requireAdmin(secret);
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { error } = await supabaseAdmin.rpc('publish_seven_tour', { expected_revision: data.revision });
  if (error) throw new Error('Não foi possível publicar. Salve e tente novamente.');
  return { ok: true };
});
export const restoreAdminVersion = createServerFn({ method: 'POST' }).inputValidator(z.object({ id: z.string().uuid() })).handler(async ({ data }) => {
  const secret = process.env['SEVEN_SESSION_SECRET']; if (!secret) throw new Error('Acesso indisponível.');
  const { requireAdmin } = await import('./admin-session.server'); await requireAdmin(secret);
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const result = await supabaseAdmin.from('tour_versions').select('scenes').eq('id', data.id).single();
  if (result.error) throw new Error('Não foi possível recuperar a versão.');
  return configSchema.parse(result.data.scenes);
});
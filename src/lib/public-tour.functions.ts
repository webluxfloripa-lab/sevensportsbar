import { createServerFn } from '@tanstack/react-start';
import { scenes } from '@/data/tour';
import { configSchema } from './admin-rules';

export const getPublishedTour = createServerFn({ method: 'GET' }).handler(async () => {
  const { createClient } = await import('@supabase/supabase-js');
  const url = process.env['SUPABASE_URL'], key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) return scenes;
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => {
    const headers = new Headers(init?.headers); if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization'); headers.set('apikey', key); return fetch(input, { ...init, headers });
  } } });
  const { data } = await client.from('tour_configuration').select('scenes').eq('id', 'published').maybeSingle();
  const parsed = configSchema.safeParse(data?.scenes);
  if (!parsed.success) return scenes;
  return scenes.map(s => ({ ...s, links: parsed.data.find(row => row.id === s.id)?.links ?? s.links }));
});
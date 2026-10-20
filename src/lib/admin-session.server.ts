import { useSession, setResponseHeader } from '@tanstack/react-start/server';
import { supabaseAdmin } from '@/integrations/supabase/client.server';
import { sessionIsValid, ADMIN_SESSION_SECONDS } from './admin-rules';

export async function adminSession(secret: string) {
  setResponseHeader('Cache-Control', 'no-store');
  return useSession<{ token?: string; expiresAt?: number }>({ name: 'seven-admin', password: secret, maxAge: ADMIN_SESSION_SECONDS, cookie: { httpOnly: true, secure: true, sameSite: 'strict', path: '/' } });
}
export async function requireAdmin(secret: string) {
  const session = await adminSession(secret);
  if (!session.data.token || !sessionIsValid(session.data.expiresAt, Date.now())) throw new Error('Sessão encerrada. Entre novamente.');
  const { data, error } = await supabaseAdmin.from('tour_admin_sessions').select('expires_at').eq('id', session.data.token).maybeSingle();
  if (error || !data || Date.parse(data.expires_at) <= Date.now()) throw new Error('Sessão encerrada. Entre novamente.');
  return session;
}
import { useSession, setResponseHeader } from '@tanstack/react-start/server';

// Sessão administrativa permanente: vale até o usuário clicar em "Sair".
// Sem expiração por tempo e sem registro temporário no banco.
const ADMIN_SESSION_SECONDS = 60 * 60 * 24 * 30;

export async function adminSession(secret: string) {
  setResponseHeader('Cache-Control', 'no-store');
  return useSession<{ loggedIn?: boolean }>({ name: 'seven-admin', password: secret, maxAge: ADMIN_SESSION_SECONDS, cookie: { httpOnly: true, secure: true, sameSite: 'strict', path: '/' } });
}
export async function requireAdmin(secret: string) {
  const session = await adminSession(secret);
  if (session.data.loggedIn !== true) throw new Error('Sessão encerrada. Entre novamente.');
  return session;
}

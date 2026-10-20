import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAdminState, loginAdmin, logoutAdmin } from '@/lib/admin.functions';
import TourEditor from '@/components/TourEditor';

export const Route = createFileRoute('/admin')({
  loader: () => getAdminState(),
  head: () => ({ meta: [
    { title: 'Painel administrativo · Seven Sports Bar' },
    { name: 'description', content: 'Acesso restrito à edição do tour virtual Seven Sports Bar.' },
    { property: 'og:title', content: 'Painel administrativo · Seven Sports Bar' },
    { property: 'og:description', content: 'Área administrativa protegida do Seven Sports Bar.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex,nofollow' },
  ] }), component: Admin,
});
function Admin() {
  const state = Route.useLoaderData(), router = useRouter();
  const login = useServerFn(loginAdmin), logout = useServerFn(logoutAdmin);
  const [password, setPassword] = useState(''), [visible, setVisible] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const [locked, setLocked] = useState(false);
  if (state.authenticated && !locked) return <main className="min-h-dvh bg-background">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4"><div><h1 className="font-display text-2xl text-primary">Seven Sports Bar</h1><span className="text-xs text-muted-foreground">Administração do tour 360°</span></div><Button variant="outline" disabled={busy} onClick={async () => { setBusy(true); try { await logout(); setLocked(true); await router.invalidate(); } finally { setBusy(false); } }}><LogOut />Sair do painel</Button></header>
    <TourEditor initial={state.config} revision={state.revision} onExpired={() => { setLocked(true); setMessage('Sessão encerrada. Entre novamente.'); void router.invalidate(); }} />
  </main>;
  return <main className="grid min-h-dvh place-items-center px-6 py-12 bg-background">
    <section className="w-full max-w-sm">
      <div className="mb-10 text-center"><span className="text-xs uppercase text-primary">Tour virtual 360°</span><h1 className="font-display text-4xl mt-2">Seven Sports Bar</h1></div>
      <div className="mb-6 flex items-center gap-3 border-b border-border pb-5"><LockKeyhole className="text-primary" /><h2 className="text-lg font-medium">Painel administrativo</h2></div>
      <form onSubmit={async e => { e.preventDefault(); if (busy) return; setBusy(true); setMessage(''); try { const result = await login({ data: { password } }); setPassword(''); setVisible(false); if (result.ok) { setLocked(false); await router.invalidate(); } else setMessage(result.message); } catch { setMessage('Não foi possível entrar. Tente novamente.'); } finally { setBusy(false); } }} className="grid gap-5">
        <label className="grid gap-2 text-sm">Senha de administrador<div className="relative"><input required type={visible ? 'text' : 'password'} autoComplete="current-password" maxLength={256} value={password} onChange={e => setPassword(e.target.value)} className="admin-input h-12 w-full pr-12" /><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1 h-10 w-10" onClick={() => setVisible(!visible)} aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}>{visible ? <EyeOff /> : <Eye />}</Button></div></label>
        {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
        <Button type="submit" className="h-12 w-full" disabled={busy}><LockKeyhole />{busy ? 'Entrando…' : 'Entrar no painel'}</Button>
      </form>
    </section>
  </main>;
}
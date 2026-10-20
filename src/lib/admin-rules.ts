import { z } from 'zod';
import { scenes } from '@/data/tour';

export const ADMIN_SESSION_SECONDS = 60 * 60 * 4;
export const arrowSchema = z.object({
  id: z.string().min(1).max(80), to: z.string(), yaw: z.number().min(-180).max(180),
  pitch: z.number().min(-62).max(80), rotation: z.number().min(-180).max(180).default(0),
  size: z.number().min(32).max(88).default(52), opacity: z.number().min(.3).max(1).default(1),
  style: z.enum(['circle', 'plain']).default('circle'),
  tone: z.enum(['primary', 'foreground']).default('primary'), label: z.string().max(100).default(''),
});
export type EditableArrow = z.infer<typeof arrowSchema>;
export const configSchema = z.array(z.object({ id: z.string(), links: z.array(arrowSchema).max(100) })).length(scenes.length).superRefine((rows, ctx) => {
  const ids = new Set(rows.map(s => s.id));
  if (ids.size !== scenes.length || scenes.some(s => !ids.has(s.id))) ctx.addIssue({ code: 'custom', message: `Os ${scenes.length} ambientes devem ser preservados.` });
  const arrows = new Set<string>();
  for (const row of rows) for (const l of row.links) {
    if (!ids.has(l.to) || arrows.has(l.id)) ctx.addIssue({ code: 'custom', message: 'Destino inválido ou seta duplicada.' });
    arrows.add(l.id);
  }
});
export type EditableConfig = z.infer<typeof configSchema>;
export const originalConfig = (): EditableConfig => scenes.map(s => ({ id: s.id, links: s.links.map((l, i) => arrowSchema.parse({ ...l, id: `${s.id}-${i}` })) }));
export function sessionIsValid(expiresAt: number | undefined, now: number) { return typeof expiresAt === 'number' && expiresAt > now; }
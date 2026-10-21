import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { z } from "zod";
import ogSofa from "@/assets/og-sofa.jpg.asset.json";
import { getPublishedTour } from '@/lib/public-tour.functions';
import { scenes } from '@/data/tour';

const SITE = "https://sevensportsbar.lovable.app";
const OG_IMAGE = `${SITE}${ogSofa.url}`;

const TourViewer = lazy(() => import("@/components/TourViewer"));

const search = z.object({
  embed: z.coerce.string().optional(),
  scene: z.coerce.number().int().min(1).max(scenes.length).optional().catch(undefined),
});

export const Route = createFileRoute("/")({
  loader: () => getPublishedTour(),
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Tour Virtual 360° · Seven Sports Bar" },
      { name: "description", content: "Percorra em 360° a fachada, o lounge, o restaurante e bar com telão e diversas TVs, os jogos eletrônicos e os ambientes dedicados ao poker." },
      { property: "og:title", content: "Tour Virtual 360° · Seven Sports Bar" },
      { property: "og:description", content: "Explore cada ambiente em visão panorâmica, direto do celular ou computador." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: `${SITE}/` },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Lounge com sofá Chesterfield de couro caramelo e quadros na parede" },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: `${SITE}/` }],

  }),
  component: Index,
});

function Index() {
  const { embed, scene } = Route.useSearch();
  const list = Route.useLoaderData();
  const isEmbed = embed === "1";
  const fallback = <div className={isEmbed ? "h-dvh bg-background" : "h-[78dvh] min-h-[420px] bg-background"} />;
  const viewer = (
    <ClientOnly fallback={fallback}>
      <Suspense fallback={fallback}>
        <TourViewer embed={isEmbed} initialScene={String(scene ?? 1)} list={list} />
      </Suspense>
    </ClientOnly>
  );
  if (isEmbed) return <main>{viewer}</main>;
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="flex items-center justify-between px-4 py-3 md:px-8">
        <span className="flex items-center gap-2 font-display text-xl tracking-wide text-primary">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-primary text-xs text-primary">360°</span>
          Seven Sports Bar · Tour Virtual
        </span>
      </header>
      <main>
        {viewer}
        <section className="mx-auto max-w-3xl px-4 py-10 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-seven-green">O Seven, de todos os ângulos.</span>
          <h1 className="mt-2 font-display text-5xl tracking-wide text-seven-green md:text-6xl">Entre e explore.</h1>
          <p className="mt-4 text-seven-green">Percorra a fachada, o lounge, a área do restaurante e bar, com telão e diversas TVs, o espaço de jogos eletrônicos e os ambientes dedicados ao poker.</p>
          <p className="mt-3 text-seven-green">É uma experiência que vai muito além do esperado.</p>
          <p className="mt-3 font-semibold text-seven-green">Dê o play e descubra o Seven por dentro.</p>
        </section>
      </main>
    </div>
  );
}

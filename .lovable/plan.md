# Recriar o Tour Virtual 360° (20 ambientes)

## O que será entregue
- Página principal (`/`) com o tour 360° em tela cheia: as 20 panorâmicas originais, sem cortes e sem perda de qualidade.
- Setas de navegação que levam aos mesmos destinos do mapa original (MAPA.md). Setas das cenas 6 e 18 separadas para não ficarem uma em cima da outra, e as conexões 2↔4, 11↔13 e 12↔13 revisadas uma de cada vez, olhando a foto.
- Sem título nem contador "08 / 20" por cima da imagem. Os nomes continuam no menu de miniaturas.
- Controles: zoom, tela cheia, voltar ao início, menu de miniaturas (fácil de usar no celular).
- Modo para incorporar em outro site (`?embed=1&scene=N`) e uma página `/incorporar` com o código do iframe pronto para copiar.
- Painel "Ajuste de setas" (escondido no modo incorporado): coloca a seta no centro da visão atual e baixa o mapa ajustado, para você poder refinar depois.
- Tudo em português, com SEO (título, descrição, sitemap, robots) e respeito a quem prefere menos movimento na tela.

## Detalhes técnicos
- Baixar `tour-fonte.zip`. Enviar as 20 imagens e as miniaturas pelo lovable-assets e criar ponteiros `.asset.json`.
- Portar `tour.json` para `src/data/tour.ts` (cenas, títulos, hotspots com yaw/pitch). Só ajustar yaw/pitch nas conexões citadas.
- Pannellum (MIT) carregado só no navegador, via import dinâmico dentro de `<ClientOnly>` e com CSS próprio.
- Rotas: `src/routes/index.tsx` (tour) e `src/routes/incorporar.tsx`. Cada uma com seu próprio `head()`.
- Visual escuro e premium, com tokens em `styles.css`.
- Teste: todas as conexões são de ida e volta e todos os destinos existem.

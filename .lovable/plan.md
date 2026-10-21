# Texto verde Seven + logo nas TVs e no telão

## 1. Texto de apresentação (abaixo do tour)
- Todo o bloco fica em verde Seven: "O Seven, de todos os ângulos.", "Entre e explore.", os dois parágrafos e a frase final.
- A frase "Dê o play e descubra o Seven por dentro." volta só como texto, sem botão.

## 2. TVs e telão com a logo
- Recorto a logo enviada (o símbolo "&" claro) a partir do print, sem o fundo do Instagram.
- Nas fotos com TVs e telão (Salão · mesas frontais 4 e 5, Bar 10 e outras onde aparecem telas), cada tela recebe fundo preto com a logo da Seven centralizada, acompanhando a perspectiva da tela.
- A edição é feita por recorte e encaixe na própria foto (sem gerar imagem nova), preservando o resto do ambiente.
- Nomes dos ambientes, setas e configurações ficam iguais; só troca a foto de cada ambiente editado no tour publicado.

## 3. Conferência
- Confiro cada tela editada no tour ao vivo, no celular e no computador.
- Testes automáticos e publicação do site no final.

## Observação
- O print tem baixa resolução (cerca de 790 px). Nas telas grandes, como o telão, a logo pode ficar um pouco suave. Se houver o arquivo original da logo (PNG ou SVG), o resultado fica mais nítido.

## Detalhes técnicos
- Texto: classes `text-seven-green` em src/routes/index.tsx.
- Logo: extrair o símbolo por limiar de cor (PIL), gerar PNG transparente.
- Telas: localizar os 4 cantos de cada tela no equirretangular, aplicar homografia (cv2) para encaixar painel preto + logo; subir com lovable-assets; atualizar URLs em tour.json e nos registros draft/published (nova revisão).

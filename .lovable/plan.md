# Correção das setas: área dos jogos (7, 8, 9) e mezanino

## Objetivo
Cada seta deve ficar no piso, no caminho natural que a pessoa faria andando, e nunca sobre balcões, mesas ou máquinas. Ela também precisa levar ao ambiente que aparece na foto naquela direção.

## O que será feito
1. **Jogos: Arcade basquete (7), Air hockey (8) e Mural (9), mais Simulador (6) e Cockpit (22)**
   - Olhar cada foto e localizar o brinquedo azulado e a passagem até ele.
   - Corrigir a seta do brinquedo azulado, que hoje não leva para lá: ela vai apontar para o ambiente certo e ficar no piso, na frente dele.
   - Revisar todas as setas de ida e volta entre 6, 7, 8, 9 e 22, alinhando cada uma no sentido do caminho.
2. **Mezanino: Mesa de pôquer (12), Balcão (13), Arcos (15), Corredor central (16) e Apoio (17)**
   - Colocar cada seta no corredor, no sentido de quem caminha, e girar o ícone para essa direção.
   - Conferir que todas as setas têm ida e volta.
   - Remover a seta que leva do Corredor central (16) à Fachada (1), que parece ter sido um engano.
3. **Verificação:** abrir cada ambiente no navegador, clicar em cada seta e conferir o destino. Depois, rodar os testes automáticos.
4. **Publicação:** salvar como rascunho, publicar o tour e publicar o site.

## Detalhes técnicos
- Os valores de yaw, pitch e rotação serão medidos olhando as fotos equiretangulares (análise por imagem e capturas do Playwright).
- As alterações vão para `src/data/tour.json` e para os registros draft/published no Cloud, com uma nova versão guardada no histórico.
- Os testes em `src/test/tour.test.ts` continuam exigindo ida e volta e setas sem sobreposição.

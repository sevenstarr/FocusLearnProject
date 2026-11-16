# FocusLearn — guia rápido de marca

## Ideia

Quatro cantos definem uma área de atenção; o ponto central representa a pessoa e a tarefa do momento. O sistema liga o modo foco ao conjunto de ferramentas de estudo sem desenhar literalmente um livro, relógio ou gráfico.

## Arquivos principais

- `focuslearn-symbol.svg` — símbolo colorido mestre.
- `focuslearn-symbol-small.svg` — desenho com aberturas ampliadas para tamanhos pequenos.
- `focuslearn-horizontal.svg` — assinatura horizontal.
- `focuslearn-stacked.svg` — assinatura empilhada.
- `exports/` — versões preta, branca e monocromática, além de PNGs de apresentação.
- `web/` — favicon, ícones PWA/Apple e trecho HTML para instalação.

Use SVG em interfaces e materiais digitais sempre que possível. Use PNG quando a plataforma não aceitar SVG.

## Área de proteção e tamanhos

Mantenha ao redor do símbolo uma margem mínima igual ao diâmetro do ponto central. Para a assinatura, preserve ao menos essa margem em todos os lados. Não reduza o símbolo mestre abaixo de 24 px; use `focuslearn-symbol-small.svg` entre 16 e 23 px. A assinatura horizontal deve ter pelo menos 160 px de largura em tela. Em impressão, mantenha o símbolo acima de 6 mm e a assinatura acima de 32 mm.

## Cores

| Papel | HEX | RGB | CMYK aproximado* |
|---|---|---|---|
| Azul principal — símbolo e texto | `#2563EB` | 37, 99, 235 | 84, 58, 0, 8 |
| Turquesa — ponto de foco | `#14B8A6` | 20, 184, 166 | 89, 0, 10, 28 |
| Azul claro para o modo escuro | `#60A5FA` | 96, 165, 250 | 62, 34, 0, 2 |
| Fundo claro | `#F8FAFC` | 248, 250, 252 | 2, 1, 0, 1 |

\*Conversões CMYK são aproximações para referência; confirme o perfil de cor com a gráfica. A turquesa funciona como acento e não deve ser usada em texto pequeno sobre branco.

## Aplicação

- Preferida: símbolo azul `#2563EB` com ponto turquesa em fundo branco ou `#F8FAFC`.
- No app em modo escuro, use azul claro `#60A5FA` para o símbolo e turquesa claro `#67E8F9` para o ponto. Para fundos muito escuros fora do app, use a versão branca.
- Uma cor: use os arquivos `*-black.svg`, `*-white.svg` ou `*-mono-*.svg`.
- Preserve o círculo e os quatro cantos como formas sólidas, sem contorno adicional.

## Tipografia

O lettering das assinaturas usa formas vetoriais baseadas em Segoe UI Bold, convertidas em contornos no SVG. Para texto de interface, mantenha a tipografia do produto (sans-serif do sistema). Não recrie a assinatura digitando o nome em outra fonte.

## Evite

Não estique, comprima, gire, aplique sombra ou gradiente; não altere a distância entre símbolo e nome; não troque as cores fora das variantes fornecidas; não coloque sobre fundos carregados sem uma área lisa de apoio.

## Limite de uso

Esta entrega define uma direção visual, mas não inclui busca de disponibilidade de marca. Faça uma pesquisa profissional de marcas antes de registrar ou usar a identidade em escala comercial.

# Danger Ghost - Project Briefing

## Visão Geral
**Danger Ghost** é um jogo online multiplayer de plataforma RPG 2D. O jogo é acessível via navegador Web e também possui um aplicativo Android nativo. A experiência do jogador é focada em velocidade, exploração de masmorras (33 níveis) e evolução de atributos.

## A Atmosfera e a Marca
- **Estética:** O jogo abraça um estilo visual retro hacker/vaporwave, misturado com gráficos clássicos de RPG 2D em pixel art. Elementos como "glassmorphism", neon (especialmente a cor rosa e roxa), e fontes monoespaçadas são muito presentes na UI.
- **Lore Básico:** Os jogadores são "Fantasmas" explorando masmorras geradas. Cada fantasma ("Ghost") é um personagem único que pode evoluir, distribuir pontos e desbravar níveis.

## Ciclo Principal (Core Gameplay Loop)
1. **O Início:** O jogador faz login. Na primeira vez, um Fantasma é gerado automaticamente para ele.
2. **Exploração:** O jogador percorre o cenário platformer usando comandos de movimento tradicionais (WASD/Setas, pulo, pulo triplo).
3. **Progressão (RPG):** Durante o gameplay, o fantasma ganha experiência. Pontos de atributo (VIT, AGI, INT, POW, MAG) podem ser distribuídos para fortalecer o personagem.
4. **Social & Cross-play:** O jogador pode ver e interagir com outros jogadores na mesma fase, independente se o outro está no PC ou no celular.

## Diferenciais Técnicos
- **Simplicidade do Motor:** Não há Unity ou Godot. O motor foi construído do zero no Canvas HTML5, garantindo que o jogo seja extremamente rápido e leve de rodar e de modificar.
- **Cross-Platform Genuíno:** Uma base de código (o backend) atende clientes distintos (Web2 via navegador e aplicativo mobile via Capacitor) de forma simultânea.

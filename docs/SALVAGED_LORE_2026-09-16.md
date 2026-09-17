# Lore Resgatado — 16/09/2026

**Origem:** `danger ghost/skills/lore_mastery.md`, seções 2 e 4, extraídas antes da purga de referências à blockchain DeSo.

**Por que este arquivo existe:** o `lore_mastery.md` misturava duas coisas de naturezas diferentes — instruções de processo/Web3 (que morreram junto com a DeSo) e conteúdo narrativo real e ainda não usado no jogo (pilares estéticos, o mapeamento atributo→ficção, e as fichas de lore dos chefes). A parte Web3 foi apagada; a parte narrativa está aqui.

**Status:** matéria-prima, não canon publicado. Nada abaixo está escrito hoje em `js/game/ghostdex_data.js` nem em qualquer texto visível ao jogador. Antes de promover qualquer trecho a canon, confira consistência com as ~100 espécies já existentes na Ghostdex (padrão de nomenclatura, categoria, habitat) e com os números reais de HP/dano em `js/game/engine.js` — as fórmulas citadas na seção 2 abaixo foram escritas a partir do código de 2026 e podem ter mudado desde então.

**Nota sobre blockchain:** nenhum trecho aqui depende da DeSo. A DeSo saiu do jogo por completo (ver `CLAUDE.md` §1). "Blockchain" como *lore* — dados fantasmas que escaparam de uma rede morta — continua sendo uma imagem válida do mundo; blockchain como *mecânica* não existe e não deve ser reintroduzida a partir deste documento. A blockchain proprietária prevista para depois do Episódio 2 (`CLAUDE.md` §2) é outra coisa, ainda não iniciada.

---

## 1. Os Três Pilares Temáticos

A fusão que sustenta o mundo de *Danger Ghost*:

1. **A Estética Neo RJ (Beco Pro / Klara Kopi)** — cultura urbana carioca (skate na Praça XV, grafite, pixação, a música urbana da banda *Chemical Noise*) mesclada com a decadência industrial de Neo Tokyo: neon magenta e ciano saturados, fumaça densa, cabos expostos, telas digitais.
2. **O Sobrenatural Cibernético (Gótico-Cyberpunk)** — os "Ftasmas" como entidades digitais espectrais, remanescentes de consciência na rede, habitando o vazio existencial de "Lugar Nenhum" (Nowhere).
3. **Mecânicas de RPG como Extensão da Lore** — atributos (VIT, AGI, INT, POW, MAG) e runas (Fogo, Gelo, Eletricidade, Veneno, Arcano) têm explicação física e filosófica dentro do mundo, não são só números.

---

## 2. Tonalidade e Worldbuilding

- **Tom:** melancólico, existencial, "street-smart", industrial, neon-noir.
- **Conceito de Lugar Nenhum:** o ciberespaço residual onde as consciências desgastadas dos skatistas e artistas urbanos se materializam como Ftasmas.
- **Fusão de linguagem:** gíria de skate carioca combinada com vocabulário de infraestrutura de rede, criptografia e falha de sistema (glitch).

> Registro de escopo: este tom é o da Ghostdex e do material de flavor. O texto funcional do jogo (erro de login, confirmação de save) é deliberadamente seco e direto — não misture os dois registros sem pedido explícito.

---

## 3. Mapeamento Atributo → Ficção

### Atributos
- **VIT (Vitalidade)** — coesão espectral: por quanto tempo o fantasma sustenta forma física no mundo material antes de dissipar.
- **AGI (Agilidade)** — redução de densidade molecular; é o que explica pulos múltiplos e alteração de velocidade.
- **INT (Inteligência)** — afinidade com a rede; melhora regeneração e eficiência de mana espectral.
- **POW (Poder)** — concentração de energia cinética de impacto.
- **MAG (Magia)** — canalização de anomalias do código em forma de projétil (Spectral Spark, Plasma Orb).

### Runas
- **Fogo (Runa 1)** — sobrecarga térmica de microcircuitos.
- **Gelo/Frio (Runa 2)** — zero absoluto digital: lentidão de processamento.
- **Eletricidade (Runa 3)** — pulso eletromagnético (EMP) que atordoa.
- **Veneno (Runa 4)** — malware corrosivo que consome dados em background.
- **Arcano (Runa 5)** — código bruto não compilado; dano alto por corrupção.

---

## 4. Fichas de Chefes e Cenários

### 4.1. Cactus — Glitch Beast de nível alto
- **ID do Codex:** `boss_cactus`
- **Nome completo:** *Cactus, a Sentinela Corrompida da Memória Secundária*
- **Lore:** originado de uma partição corrompida de um servidor abandonado de modelagem botânica dos anos 90, o Cactus se materializa em Lugar Nenhum como uma monstruosidade espinhosa de dados rígidos. Absorve a estática de rádio da Praça XV e dispara agulhas de silício criptografadas contra qualquer fantasma que tente atravessar os limites do sistema.
- **Alinhamento com a mecânica:**
  - *Resiliência* — a maior base de HP do jogo (fórmula registrada à época: 9 × nível), justificada pela rigidez da modelagem poligonal obsoleta.
  - *Comportamento* — espinhos causam dano físico cortante e envenenamento lento por malware.

### 4.2. Crow — Net Watcher
- **ID do Codex:** `boss_crow`
- **Nome completo:** *Crow, o Corvo Sentinela da Banda Larga*
- **Lore:** um crawler automatizado que escapou do controle da infraestrutura de telecomunicações do Rio Antigo. Patrulha os céus de Lugar Nenhum caçando vazamentos de dados de usuários. Manifesta-se como um corvo cibernético envolto em fibra óptica e névoa neon.
- **Alinhamento com a mecânica:**
  - *Resiliência* — base de HP leve (fórmula registrada à época: 4 × nível), compensada por voo ágil e teleportes baseados em reencaminhamento de pacotes.

### 4.3. O Mistério do Level 26 — Matrix / BecoPro Staging
- **Lore:** o nível 26 não é uma fase convencional. É a "BecoPro Staging Area", um glitch proposital inserido no código por Beco Pro durante a exposição "Lugar Nenhum". As paredes físicas dão lugar a cascatas de bits binários verde-saturados rolando em alta velocidade. O nível funciona como portal de staging, onde o fantasma adquire consciência das regras de criptografia do mundo.

---

## 5. Pontas Soltas para uma Sessão Futura

- As três fichas acima são chefes/cenários que **existem no código** mas cuja lore nunca chegou à Ghostdex nem a nenhum texto in-game. Promovê-las é trabalho de escrita, não de engenharia.
- O nome "Ftasma" (com F) aparece na fonte original. Decidir se é grafia intencional do mundo ou erro de digitação antes de usar em texto visível ao jogador.
- A ligação entre o Level 26 e a exposição "Lugar Nenhum" cruza com outro projeto do workspace. Confirmar com o usuário antes de tratar essa conexão como canon do jogo.

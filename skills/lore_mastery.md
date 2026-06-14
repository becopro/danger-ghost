# Skill: Maestria de Lore, Escrita Narrativa e Integração de RPG (Gótico-Cyberpunk)
## Especialidade: Senior Lore Master (senior-lore-master)

---

## 1. Introdução: O Papel da Narrativa no Ecossistema DragaMP

Em ecossistemas de jogos AAA e Web3, a lore não é apenas um adorno estético, mas o tecido que une mecânicas de jogo (RPG), colecionáveis digitais (NFTs na DeSo) e a experiência de imersão do jogador (worldbuilding). 

Para o jogo *Danger Ghost*, o **senior-lore-master** deve orquestrar a fusão temática entre:
1. **A Estética Neo RJ (Beco Pro / Klara Kopi)**: A cultura urbana carioca (skateboarding na Praça XV, grafite, pixação, música urbana da banda *Chemical Noise*) mesclada com a decadência industrial de Neo Tokyo (luzes neon magenta/ciano saturadas, fumaça densa, cabos expostos, telas digitais).
2. **O Sobrenatural Cibernético (Gótico-Cyberpunk)**: Os "Ftasmas" como entidades digitais espectrais ou remanescentes de consciência na rede, habitando o vazio existencial de "Lugar Nenhum" (Nowhere).
3. **Mecânicas RPG como Extensão da Lore**: Onde os atributos (VIT, AGI, INT, POW, MAG) e as runas (Fogo, Gelo, Eletricidade, Veneno, Arcano) possuem explicações físicas e filosóficas no mundo do jogo.

---

## 2. Pilares de Habilidades Recomendadas para o Agente de Lore

Para modelar o lore no ecossistema DragaMP de forma estruturada, o `senior-lore-master` deve ser equipado com as seguintes competências:

### 2.1. Escrita Narrativa e Worldbuilding Gótico-Cyberpunk (`skill-lore-worldbuilding`)
- **Tonalidade**: Melancólica, existencial, "street-smart", industrial e neon-noir. 
- **Conceito de Lugar Nenhum**: O ciberespaço residual onde as consciências desgastadas dos jogadores de skate e artistas urbanos se materializam como "Ftasmas" (Ghosts).
- **Fusão de Linguagem**: Gírias de skate cariocas combinadas com termos de infraestrutura de rede, criptografia e falhas de sistema (glitch).

### 2.2. Alinhamento de RPG Narrativo-Mecânico (`skill-rpg-alignment`)
- **Atributos de RPG**:
  - **VIT (Vitalidade)**: Coesão espectral do fantasma (capacidade de manter a forma física no mundo material antes de dissipar).
  - **AGI (Agilidade)**: Redução de densidade molecular do fantasma (explicando pulos múltiplos e velocidade alterada).
  - **INT (Inteligência)**: Afinidade com a rede (melhora regeneração e eficiência de mana espectral).
  - **POW (Poder)**: Concentração de energia cinética de impacto.
  - **MAG (Magia)**: Canalização de anomalias do código em forma de projéteis (Spectral Spark, Plasma Orb).
- **Runas Temáticas**:
  - *Fogo (Runa 1)*: Sobrecarga térmica de microcircuitos.
  - *Gelo/Frio (Runa 2)*: Absoluto zero digital (lentidão no processamento).
  - *Eletricidade (Runa 3)*: Pulsos Eletromagnéticos (EMP) que atordoam inimigos.
  - *Veneno (Runa 4)*: Malware corrosivo que consome dados em background.
  - *Arcano (Runa 5)*: Código bruto não compilado que causa alto dano por corrupção.

### 2.3. Arquitetura de Codex e Documentação de Entidades (`skill-codex-architecture`)
Modelagem dos monstros e cenários de forma modular em formatos estruturados (JSON/Markdown) para que outros desenvolvedores e geradores de conteúdo visual os utilizem como guia definitivo.

---

## 3. Blueprint do Codex: Serialização de Entidades (JSON Schema)

O Codex não deve ser apenas texto corrido. Ele deve ser estruturado deterministicamente para que a Engine do jogo ou o frontend do inventário possa ler e associar metadados aos cards de personagens e NFTs da DeSo.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CodexEntry",
  "type": "object",
  "properties": {
    "entityId": { "type": "string" },
    "name": { "type": "string" },
    "faction": { "type": "string", "enum": ["Spectres", "GlitchBeasts", "NetWatchers"] },
    "loreDescription": { "type": "string" },
    "technicalStatsAlignment": {
      "type": "object",
      "properties": {
        "vit": { "type": "string", "description": "Explicação narrativa para a vida/resiliência do monstro" },
        "pow": { "type": "string", "description": "Origem física da força/dano" }
      },
      "required": ["vit", "pow"]
    },
    "metadata": {
      "type": "object",
      "properties": {
        "associatedAsset": { "type": "string", "description": "Caminho do sprite ou NFT" },
        "desoNFTPostHash": { "type": "string" }
      }
    }
  },
  "required": ["entityId", "name", "faction", "loreDescription", "technicalStatsAlignment"]
}
```

---

## 4. Exemplos Práticos de Codex Narrativo (Danger Ghost)

Abaixo estão as fichas definitivas de lore para os principais chefes e mecânicas encontradas no código do jogo (como o Boss Crow, Boss Cactus e o nível secreto 26).

### 4.1. Chefe: **Cactus (Glitch Beast de Nível Alto)**
- **ID do Codex**: `boss_cactus`
- **Nome**: *Cactus, a Sentinela Corrompida da Memória Secundária*
- **Lore**: 
  Originado de uma antiga partição corrompida de um servidor abandonado de modelagem botânica dos anos 90, o Cactus se materializa em Lugar Nenhum como uma monstruosidade espinhosa de dados rígidos. Ele absorve a estática de rádio da Praça XV, disparando agulhas de silício criptografadas contra qualquer fantasma que tente atravessar os limites do sistema.
- **Alinhamento de Mecânicas**:
  - *Resiliência*: Possui a base de HP mais alta do jogo (fórmula: $9 \times \text{level}$) devido à rigidez da sua modelagem poligonal obsoleta.
  - *Comportamento*: Seus espinhos causam dano físico cortante e envenenamento lento por malware.

### 4.2. Chefe: **Crow (Net Watcher)**
- **ID do Codex**: `boss_crow`
- **Nome**: *Crow, o Corvo Sentinela da Banda Larga*
- **Lore**: 
  Um programa de varredura automatizado (crawler) que escapou do controle da infraestrutura de telecomunicações do Rio Antigo. O Corvo patrulha os céus de Lugar Nenhum buscando vazamentos de dados de usuários. Ele se manifesta com a aparência de um corvo cibernético envolto em cabos de fibra óptica e névoa neon.
- **Alinhamento de Mecânicas**:
  - *Resiliência*: Base de HP leve ($4 \times \text{level}$), porém compensada por voo ágil e teleportes baseados em reencaminhamento de pacotes.

### 4.3. O Mistério do **Level 26 (Matrix/BecoPro Staging)**
- **Lore**: 
  O nível 26 de Danger Ghost não é uma fase convencional. É o "BecoPro Staging Area", um "glitch" proposital inserido no código do jogo por Beco Pro durante a exposição "Lugar Nenhum". As paredes físicas são substituídas por cascatas de bits binários verde-saturados que rolam em alta velocidade (simulando a tela do Matrix Background). O nível serve como um portal de staging onde o fantasma adquire consciência das regras de criptografia do ecossistema DragaMP.

---

## 5. Integração Web3: Metadados Lore on-chain

Para criar verdadeiro valor colecionável no ecossistema DeSo, o `senior-lore-master` deve trabalhar em conjunto com o `senior-web3-dev` para serializar trechos da história diretamente no `PostExtraData` no momento em que um Ghost ou Screenshot é mintado como NFT.

### Exemplo de Estrutura de Metadados de Lore no PostExtraData:
```json
{
  "DangerGhost_CharacterID": "dg_xyz8827a",
  "DangerGhost_LorePiece": "atob('RXN0ZSBmYW50YXNtYSByZW5hc2NldSBkb3Mgc3ByYXlzIGRhIFByYcOnYSBYVi4uLg==')",
  "DangerGhost_LoreSignature": "0xabcde12345..."
}
```
Isso garante que cada NFT seja único não apenas por seus atributos de RPG, mas por conter um fragmento exclusivo de narrativa e lore criptografado on-chain.

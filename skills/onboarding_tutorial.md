# Skill: Tutorial Interativo e UX de Onboarding
## Especialidade: Senior Onboarding & Tutorial Specialist (senior-tutorial-expert)

---

## 1. Introdução: O Desafio do Onboarding em um Platformer com RPG

Para que um jogo atinja o padrão Triple-A (AAA), a experiência inicial do usuário (FTUE - First-Time User Experience) deve ser impecável. Jogos que misturam mecânicas de plataforma retrô com progressão de atributos de RPG, como *Danger Ghost*, sofrem de alta taxa de rejeição inicial por sobrecarga cognitiva (cognitive overload).

O monólito atual exibe instruções em texto estático na tela inicial (`DrawStartScreen`) e usa pop-ups intrusivos (`alert()`, `prompt()`) que quebram o fluxo e o gamefeel:

```javascript
// Exemplo do comportamento atual intrusivo e estático
alert("⚠️ ACCESS DENIED (TOKEN-GATING): This feature is exclusively for $DangerGhost Coin Holders!");
var pw = prompt("ENTER VIP PASSWORD");
```

O papel do **senior-tutorial-expert** é substituir essa abordagem por um sistema de **Integração Dinâmica Contextual**, onde o jogador aprende a jogar jogando.

---

## 2. Pilares de Habilidades Recomendadas para o Agente de Tutorial

Propomos o mapeamento e modelagem de três competências avançadas no ecossistema DragaMP:

### 2.1. Design de Tutorial Ativo e Progressivo (`skill-active-onboarding`)
- **Anti-Wall of Text**: Banir textos estáticos longos. As mecânicas de movimento básico (andar, pular) e combate devem ser liberadas e ensinadas em estágios (Progressive Disclosure).
- **Time Dilation (Câmera Lenta)**: Reduzir temporariamente a velocidade física do jogo ($\Delta t$) para dar tempo ao usuário de reagir à instrução visual sem frustração (efeito Bullet Time ao ensinar o primeiro pulo triplo ou magia).
- **Zonas de Gatilho (Trigger Zones)**: Sensores invisíveis no mapa que disparam instruções baseadas na coordenada X/Y do jogador.

### 2.2. Sistema de Dicas Reativas e Contextuais (`skill-context-hints`)
- **Detecção de Frustração**: Monitoramento de inputs em tempo real. Se o jogador falha em subir uma plataforma após 3 tentativas ou fica parado em frente a um obstáculo por mais de 5 segundos, o jogo renderiza uma dica visual.
- **Destaque Visual Dinâmico**: Renderização de círculos de foco ou flechas piscando no canvas apontando para portas, colecionáveis ou elementos HUD.

### 2.3. Overlays Gráficos no Canvas (`skill-canvas-overlay`)
- Desenhar caixas de diálogo estilizadas na camada de topo do canvas sem interferir na renderização de física dos sprites inferiores.
- Alinhamento de coordenadas responsivo que se adapta a redimensionamentos da tela do navegador.

---

## 3. Blueprint Técnico: Sistema de Gatilhos de Tutorial (TypeScript)

Para evitar poluir a lógica de movimento do herói, os eventos do tutorial devem rodar em um sistema desacoplado baseado em gatilhos (`Trigger Zones`) que escutam o estado do jogo.

```typescript
// src/tutorial/TutorialManager.ts

export interface TriggerZone {
    x: number;
    w: number;
    triggered: boolean;
    instructionText: string;
    actionCheck: (input: any) => boolean; // Condição para completar o passo
}

export class TutorialManager {
    private zones: TriggerZone[] = [];
    private activeZone: TriggerZone | null = null;
    private displayTimer: number = 0;

    constructor() {
        this.setupZones();
    }

    private setupZones(): void {
        this.zones.push({
            x: 100, // Coordenada X no mapa
            w: 48,
            triggered: false,
            instructionText: "PRESSIONE 'D' PARA AVANÇAR E 'W' PARA PULAR",
            actionCheck: (input) => input.moveRight === true
        });

        this.zones.push({
            x: 350,
            w: 48,
            triggered: false,
            instructionText: "PRESSIONE 'W' TRÊS VEZES NO AR PARA O PULO TRIPLO",
            actionCheck: (input) => input.jumpsPerformed >= 3
        });
        
        this.zones.push({
            x: 600,
            w: 48,
            triggered: false,
            instructionText: "PRESSIONE 'V' PARA DISPARAR UMA FAÍSCA ESPECTRAL",
            actionCheck: (input) => input.hasCastSpark === true
        });
    }

    /**
     * Monitora a posição do jogador para ativar os popups
     */
    public update(playerX: number, inputState: any, dt: number): void {
        // Se houver tutorial ativo, verifica se o usuário realizou a ação pedida
        if (this.activeZone) {
            if (this.activeZone.actionCheck(inputState)) {
                this.activeZone = null; // Passo concluído
                this.displayTimer = 0;
            }
            return;
        }

        // Verificar se o jogador entrou em uma nova zona
        for (const zone of this.zones) {
            if (!zone.triggered && playerX >= zone.x && playerX <= zone.x + zone.w) {
                zone.triggered = true;
                this.activeZone = zone;
                this.displayTimer = 5.0; // Mostrar mensagem por até 5 segundos
                break;
            }
        }

        if (this.displayTimer > 0) {
            this.displayTimer -= dt;
            if (this.displayTimer <= 0) {
                this.activeZone = null; // Auto-hide
            }
        }
    }

    /**
     * Renderiza o painel do tutorial de forma elegante no canvas
     */
    public draw(ctx: CanvasRenderingContext2D, canvasWidth: number): void {
        if (!this.activeZone) return;

        ctx.save();
        
        // Renderizar caixa de diálogo com bordas neon magenta/ciano
        const rectW = 400;
        const rectH = 50;
        const rectX = (canvasWidth - rectW) / 2;
        const rectY = 40;

        // Fundo preto translúcido
        ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
        ctx.fillRect(rectX, rectY, rectW, rectH);

        // Borda neon dupla (Estética Cyberpunk)
        ctx.strokeStyle = "#FF00FF";
        ctx.lineWidth = 2;
        ctx.strokeRect(rectX, rectY, rectW, rectH);
        
        ctx.strokeStyle = "#00FFFF";
        ctx.lineWidth = 1;
        ctx.strokeRect(rectX + 2, rectY + 2, rectW - 4, rectH - 4);

        // Texto instrucional centralizado
        ctx.font = "bold 12px 'Courier New'";
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.activeZone.instructionText, rectX + rectW / 2, rectY + rectH / 2);

        ctx.restore();
    }
}
```

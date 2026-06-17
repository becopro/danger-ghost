# Skill: Tutorial Interativo, UX de Onboarding e Integração Web3
## Especialidade: Senior Onboarding & Tutorial Specialist (senior-tutorial-expert)

---

## 1. Introdução: O Desafio do Onboarding em Jogos Web3/RPG

Para que um jogo atinja o padrão Triple-A (AAA), a experiência inicial do usuário (FTUE - First-Time User Experience) deve ser impecável. Jogos que misturam mecânicas de plataforma retrô, progressão de atributos de RPG e autenticação Web3 (como *Danger Ghost* via DeSo) sofrem de uma alta taxa de rejeição inicial devido à sobrecarga cognitiva (cognitive overload).

O monólito atual exibe instruções em texto estático na tela inicial (`DrawStartScreen`) e usa pop-ups intrusivos (`alert()`, `prompt()`) que quebram o fluxo e o gamefeel:

```javascript
// Exemplo do comportamento atual intrusivo e estático
alert("⚠️ ACCESS DENIED (TOKEN-GATING): This feature is exclusively for $DangerGhost Coin Holders!");
var pw = prompt("ENTER VIP PASSWORD");
```

O papel do **senior-tutorial-expert** é substituir essa abordagem por um sistema de **Integração Dinâmica Contextual**, onde o jogador aprende a jogar jogando, e o fluxo de carteira Web3 é introduzido de forma fluida e assistida.

---

## 2. Pilares de Habilidades Recomendadas para o Agente de Tutorial

Propomos o mapeamento e modelagem de quatro competências avançadas no ecossistema DragaMP:

### 2.1. Design de Tutorial Ativo e Progressivo (`skill-active-onboarding`)
- **Anti-Wall of Text**: Banir textos estáticos longos. As mecânicas de movimento básico (andar, pular) e combate devem ser liberadas e ensinadas em estágios (Progressive Disclosure).
- **Time Dilation (Câmera Lenta)**: Reduzir temporariamente a velocidade física do jogo ($\Delta t$) para dar tempo ao usuário de reagir à instrução visual sem frustração (efeito Bullet Time ao ensinar o primeiro pulo triplo ou magia).
- **Zonas de Gatilho (Trigger Zones)**: Sensores invisíveis no mapa que disparam instruções baseadas na coordenada X/Y do jogador.

### 2.2. Sistema de Dicas Reativas e Contextuais (`skill-context-hints`)
- **Detecção de Frustração**: Monitoramento de inputs em tempo real. Se o jogador falha em subir uma plataforma após 3 tentativas ou fica parado em frente a um obstáculo por mais de 5 segundos, o jogo renderiza uma dica visual.
- **Destaque Visual Dinâmico**: Renderização de círculos de foco ou flechas piscando no canvas apontando para portas, colecionáveis ou elementos HUD.

### 2.3. Onboarding Web3 Facilitado (`skill-web3-onboarding-ux`)
- **Fluxo Assistido de Conexão**: Explicação passo a passo em pop-ups customizados dentro do DOM (sem usar `alert` nativo) sobre por que o iframe da DeSo está abrindo e como as taxas de rede funcionam.
- **Fallback para Visitantes**: Permitir jogar os níveis iniciais localmente antes de forçar o login na carteira, reduzindo a fricção de entrada e demonstrando valor de jogo primeiro.

### 2.4. Overlays Gráficos no Canvas (`skill-canvas-overlay`)
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

---

## 4. Blueprint de Experiência: Conexão Assistida Web3/DeSo (HTML/CSS)

Para evitar que o usuário aborte o login ao se deparar com a tela de aprovação de transações on-chain, o onboarding deve contar com um guia explicativo em sobreposição no HTML antes de acionar a carteira.

```html
<!-- Componente UI de Onboarding Web3 (Inserido de forma não obstrutiva no RPG Panel) -->
<div id="web3WelcomePanel" style="
    background: #0f0a18; 
    border: 2px solid #00FFFF; 
    border-radius: 8px; 
    padding: 15px; 
    box-shadow: 0 0 15px rgba(0, 255, 255, 0.4); 
    max-width: 320px; 
    font-family: 'Courier New', monospace; 
    color: #FFF;
">
    <h4 style="color: #00FF00; margin-top: 0; text-align: center; font-size: 14px;">🔑 EVOLUÇÃO ON-CHAIN</h4>
    <p style="font-size: 11px; line-height: 1.4; color: #BBB;">
        Danger Ghost utiliza a blockchain descentralizada <b>DeSo</b> para salvar permanentemente o nível, atributos e itens do seu herói na forma de um NFT exclusivo na sua carteira.
    </p>
    <div style="background: rgba(0, 255, 255, 0.1); border-left: 3px solid #00FFFF; padding: 6px; font-size: 10px; margin-bottom: 12px;">
        💡 <b>Como funciona:</b> Ao clicar em salvar, um pop-up de identidade seguro da DeSo será aberto. Você assina a transação localmente e seus dados são criptografados na rede.
    </div>
    <button onclick="TriggerWalletConnection()" style="
        width: 100%; 
        padding: 8px; 
        background: #00FF00; 
        color: #000; 
        font-weight: bold; 
        border: none; 
        border-radius: 4px; 
        cursor: pointer;
        font-family: 'Courier New';
    ">
        CONECTAR E JOGAR
    </button>
</div>
```

### Script de Fallback e Transição
```javascript
function TriggerWalletConnection() {
    // 1. Ocultar painel de explicação com transição suave
    document.getElementById("web3WelcomePanel").style.display = "none";
    
    // 2. Disparar fluxo original do Iframe e Popup da DeSo
    if (typeof window.LoginDeSo === "function") {
        window.LoginDeSo();
    }
}
```

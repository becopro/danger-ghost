# Skill: Arquitetura Limpa, SOLID e Desacoplamento de Monólitos Canvas
## Especialidade: Senior Application Developer (senior-app-dev)

---

## 1. Introdução: O Monólito Bloqueante do Danger Ghost

No desenvolvimento de jogos 2D para a web em nível profissional (AAA), a estrutura de arquivos e o acoplamento do estado são fatores determinantes para a manutenibilidade, extensibilidade e performance do jogo. 

A arquitetura original do *Danger Ghost* concentra mais de 4.300 linhas de código no `index.html`. Isso viola praticamente todos os princípios de design de software limpo:
*   **Violação do SRP (Princípio da Responsabilidade Única)**: O arquivo inicial gerencia renderização em canvas, loop físico, rede HTTP, listeners de teclas, salvamento Web3 e renderização de elementos de interface do usuário (DOM).
*   **Escopo Global Poluído**: Variáveis globais mutáveis (`g_gameState`, `g_score`, `DeSoGhost`) controlam as regras de transição. Sob lag ou interrupções de rede, essas variáveis podem entrar em estados inconsistentes (Race Conditions).
*   **Acoplamento Forte (Tight Coupling)**: Alterações nos assets gráficos ou nas fórmulas do RPG forçam a modificação de lógicas físicas e rotinas de rede no mesmo arquivo.

---

## 2. A Estrutura de Arquitetura Limpa (SOLID)

Para converter o monólito em um sistema extensível, devemos aplicar a **Clean Architecture** (Arquitetura Limpa), separando o núcleo de regras do jogo das tecnologias de entrega (Canvas, DOM, APIs de Blockchain).

```mermaid
graph TD
    subgraph Drivers & Infrastructure (Camada Externa)
        Canvas[Canvas 2D Renderer]
        Identity[DeSo Identity Iframe]
        DOMUI[DOM Panels & Layout]
        Kbd[Keyboard Event Listeners]
    end

    subgraph Adapters & Controllers (Camada de Adaptação)
        GI[InputManagerAdapter]
        GR[CanvasRenderAdapter]
        GW[Web3SaveAdapter]
        GU[DOMUIController]
    end

    subgraph Core Logic (Camada de Domínio / Regras de Negócio)
        Engine[DangerGhostGameEngine]
        State[GameStateManager]
        Physics[AAAPhysicsEngine]
        RPG[RPGProgressionSystem]
    end

    Canvas --> GR
    DOMUI --> GU
    Kbd --> GI
    Identity --> GW

    GR --> Engine
    GI --> Engine
    GW --> RPG
    GU --> State

    Engine --> Physics
    Engine --> RPG
    Engine --> State
```

### 2.1. Princípio da Inversão de Dependência (DIP)
O motor central do jogo (`DangerGhostGameEngine`) não deve depender diretamente de classes concretas de renderização de canvas ou listeners de teclado. Em vez disso, ele deve interagir com **interfaces abstratas**. Isso nos permite, no futuro, trocar a engine de renderização (ex: do Canvas 2D nativo para o Phaser ou PixiJS) sem alterar uma única linha da lógica física ou de RPG do jogo.

---

## 3. Estruturação Modular do Projeto (TypeScript)

Recomendamos a seguinte árvore de diretórios para a refatoração do código:

```text
src/
├── core/                  # Entidades de Domínio e Regras de Negócio
│   ├── GameEngine.ts      # Loop central e coordenação de sistemas
│   ├── GameState.ts       # Máquina de estados finita do jogo
│   ├── Physics.ts         # Motor de física desacoplado
│   └── RPGSystem.ts       # Atributos e progressão de heróis
├── interfaces/            # Contratos de abstração (DIP)
│   ├── IRenderer.ts       # Interface gráfica
│   ├── IInput.ts          # Interface de controle (teclado/joystick)
│   └── ISaveStorage.ts    # Interface de persistência (Local/Blockchain)
├── adapters/              # Conversores para o ecossistema externo
│   ├── Canvas2DRender.ts  # Implementação do IRenderer em Canvas
│   ├── KeyboardInput.ts   # Implementação do IInput capturando eventos
│   └── DeSoBlockchain.ts  # Implementação do ISaveStorage via DeSo Node
└── main.ts                # Inicialização e Injeção de Dependências
```

---

## 4. Implementação de Referência (TypeScript)

Abaixo estão as classes abstratas e a injeção que unifica as peças de maneira SOLID.

### 4.1. Definindo as Interfaces de Abstração (`src/interfaces/`)

```typescript
// src/interfaces/IRenderer.ts
export interface IRenderer {
    clear(): void;
    drawSprite(assetKey: string, x: number, y: number, width: number, height: number): void;
    drawText(text: string, x: number, y: number, color: string, fontSize: string): void;
    resize(width: number, height: number): void;
}

// src/interfaces/IInput.ts
export interface IInput {
    initialize(): void;
    destroy(): void;
    getMovementVector(): { dx: number; dy: number };
    isActionTriggered(actionName: string): boolean;
}

// src/interfaces/ISaveStorage.ts
export interface ISaveStorage<T> {
    save(characterId: string, state: T): Promise<boolean>;
    load(characterId: string): Promise<T | null>;
    listCharacters(ownerId: string): Promise<T[]>;
}
```

### 4.2. Implementando o Motor de Jogo Desacoplado (`src/core/`)

```typescript
// src/core/GameEngine.ts
import { IRenderer } from "../interfaces/IRenderer";
import { IInput } from "../interfaces/IInput";
import { GameState, GameStateManager } from "./GameState";
import { PhysicsEngine, Box } from "./Physics";

export class GameEngine {
    private renderer: IRenderer;
    private input: IInput;
    private stateManager: GameStateManager;
    private physics: PhysicsEngine;
    
    private playerBox: Box;
    private lastTime: number = 0;
    private isRunning: boolean = false;

    constructor(
        renderer: IRenderer,
        input: IInput,
        stateManager: GameStateManager,
        physics: PhysicsEngine
    ) {
        this.renderer = renderer;
        this.input = input;
        this.stateManager = stateManager;
        this.physics = physics;

        this.playerBox = { x: 48, y: 150, w: 24, h: 24, vx: 0, vy: 0 };
    }

    public start(): void {
        this.input.initialize();
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    public stop(): void {
        this.isRunning = false;
        this.input.destroy();
    }

    private loop(currentTime: number): void {
        if (!this.isRunning) return;

        const deltaTime = (currentTime - this.lastTime) / 1000; // converter para segundos
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame((t) => this.loop(t));
    }

    private update(dt: number): void {
        if (this.stateManager.getCurrentState() !== GameState.PLAYING) {
            return;
        }

        // 1. Processar Inputs usando a abstração
        const movement = this.input.getMovementVector();
        const speed = 180; // pixels por segundo
        this.playerBox.vx = movement.dx * speed;

        if (this.input.isActionTriggered("jump") && this.playerBox.vy === 0) {
            this.playerBox.vy = -350; // Aceleração instantânea do pulo
        }

        // 2. Simular Física Desacoplada (Delta-Time)
        const mockPlatforms: Box[] = [{ x: 0, y: 240, w: 640, h: 60, vx: 0, vy: 0 }];
        
        this.physics.update(
            dt, 
            this.playerBox, 
            mockPlatforms, 
            (isGrounded) => {
                if (isGrounded) this.playerBox.vy = 0;
            }
        );
    }

    private render(): void {
        this.renderer.clear();
        
        const state = this.stateManager.getCurrentState();
        if (state === GameState.PLAYING) {
            // Desenhar jogador utilizando a abstração do renderer
            this.renderer.drawSprite(
                "character_ghost", 
                this.playerBox.x, 
                this.playerBox.y, 
                this.playerBox.w, 
                this.playerBox.h
            );
            
            this.renderer.drawText("SCORE: 0000", 10, 25, "#00FF00", "16px");
        } else if (state === GameState.START_SCREEN) {
            this.renderer.drawText("DANGER GHOST", 320, 150, "#FF00FF", "40px");
        }
    }
}
```

### 4.3. Inicialização e Injeção de Dependência (`src/main.ts`)

O ponto de entrada configura quais tecnologias serão injetadas no motor de jogo. Se quisermos mudar o input para um controlador de gamepad ou testar o motor em um ambiente Headless (como no QA), basta injetar uma classe Mock.

```typescript
// src/main.ts
import { GameEngine } from "./core/GameEngine";
import { GameStateManager } from "./core/GameState";
import { PhysicsEngine } from "./core/Physics";
import { Canvas2DRender } from "./adapters/Canvas2DRender";
import { KeyboardInput } from "./adapters/KeyboardInput";

// 1. Instanciar os drivers concretos de infraestrutura
const canvasElement = document.getElementById("gameCanvas") as HTMLCanvasElement;
const renderer = new Canvas2DRender(canvasElement);
const input = new KeyboardInput();

// 2. Instanciar o motor lógico
const stateManager = new GameStateManager();
const physics = new PhysicsEngine(60); // Física fixada em 60 sub-ticks por segundo

// 3. Injetar dependências via Construtor
const game = new GameEngine(renderer, input, stateManager, physics);

// 4. Iniciar loop do jogo
game.start();
```

---

## 5. Gerenciamento de Estado no Canvas (Canvas State-Machine)

Para jogos AAA baseados em HTML5 Canvas, a máquina de estados deve ser isolada e protegida contra mutações externas involuntárias.

### 5.1. Implementando uma Máquina de Estados Segura
Evite comparar strings soltas ou alterar estados por atribuição direta. Use encapsulamento estrito com Enums e assinaturas de eventos:

```typescript
// src/core/GameState.ts

export enum GameState {
    START_SCREEN,
    CUTSCENE,
    PLAYING,
    PAUSED,
    GAME_OVER,
    VICTORY
}

export type StateChangeCallback = (oldState: GameState, newState: GameState) => void;

export class GameStateManager {
    private currentState: GameState = GameState.START_SCREEN;
    private listeners: Set<StateChangeCallback> = new Set();

    public getCurrentState(): GameState {
        return this.currentState;
    }

    public subscribe(callback: StateChangeCallback): () => void {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback); // Função de unsubscribe
    }

    public transitionTo(nextState: GameState): void {
        if (this.currentState === nextState) return;

        // Validação de transições de estados permitidas
        if (!this.isValidTransition(this.currentState, nextState)) {
            throw new Error(`[State Machine] Transição inválida de ${GameState[this.currentState]} para ${GameState[nextState]}`);
        }

        const previousState = this.currentState;
        this.currentState = nextState;

        // Notificar ouvintes (ex: tocar sons ou atualizar UI do DOM)
        this.listeners.forEach((listener) => listener(previousState, nextState));
    }

    private isValidTransition(current: GameState, next: GameState): boolean {
        switch (current) {
            case GameState.START_SCREEN:
                return next === GameState.PLAYING || next === GameState.CUTSCENE;
            case GameState.CUTSCENE:
                return next === GameState.PLAYING || next === GameState.GAME_OVER;
            case GameState.PLAYING:
                return next === GameState.PAUSED || next === GameState.GAME_OVER || next === GameState.VICTORY;
            case GameState.PAUSED:
                return next === GameState.PLAYING || next === GameState.GAME_OVER;
            case GameState.GAME_OVER:
            case GameState.VICTORY:
                return next === GameState.START_SCREEN || next === GameState.PLAYING;
            default:
                return false;
        }
    }
}
```

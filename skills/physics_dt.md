# Skill: Física Delta-Time, Sub-stepping e Colisão Swept AABB
## Especialidade: Senior Game Developer (senior-game-dev)

---

## 1. Introdução: O Problema do Loop Frame-Bound

No atual estado de *Danger Ghost*, a simulação física é atualizada de forma acoplada ao frame rate (Frame-Bound Loop). A alteração da posição e a aplicação da gravidade ocorrem de maneira discreta a cada tick de um `setInterval` (que varia de $33\text{ms}$ a $16\text{ms}$ quando o botão de Fast Forward `T` é acionado):

```javascript
// Exemplo do comportamento atual
yPos += ySpeed; 
ySpeed += gravity;
```

Essa abordagem acarreta três falhas críticas em nível AAA:
1. **Velocidade Variável**: Em computadores com telas de alta taxa de atualização (144Hz ou 240Hz), se o loop rodar com `requestAnimationFrame` direto sem limitação, o jogo acelerará proporcionalmente. Se houver lag (queda de FPS), o jogo rodará em "câmera lenta".
2. **Efeito Túnel (Tunneling)**: Quando a velocidade de um projétil ou do herói é superior às suas dimensões físicas divididas pelo intervalo de tempo, o objeto pula inteiramente através de um obstáculo sólido entre dois frames.
3. **Instabilidade da Gravidade**: A integração numérica simples de Euler é extremamente sensível a variações do passo de tempo ($\Delta t$), fazendo com que a altura de pulos e a gravidade percebida variem conforme a performance da máquina.

---

## 2. Fundamentos Matemáticos

Para corrigir essas instabilidades, devemos desacoplar a física da taxa de renderização e implementar a **Integração de Euler Semi-Implícita (Euler-Cromer)** combinada com um **Acumulador de Tempo Fixo** e detecção de colisão **Swept AABB**.

### 2.1. Integração Semi-Implícita de Euler
Em vez de integrar a posição usando a velocidade antiga, calculamos primeiro a nova velocidade com a aceleração atual e, em seguida, atualizamos a posição com a nova velocidade:

$$v(t + \Delta t) = v(t) + a(t) \cdot \Delta t$$
$$x(t + \Delta t) = x(t) + v(t + \Delta t) \cdot \Delta t$$

Esta formulação conserva energia mecânica em sistemas orbitais e oscilatórios muito melhor do que a integração clássica de Euler (Explícita).

### 2.2. O Loop com Acumulador (Fixed Timestep)
Para manter a estabilidade física idêntica em qualquer hardware, a renderização usa o $\Delta t$ variável do sistema, mas a física consome fatias de tempo fixas ($dt$) acumuladas. 

A cada frame, o tempo decorrido é adicionado a um `accumulator`:

$$\text{accumulator} \leftarrow \text{accumulator} + \Delta t_{\text{render}}$$

O motor de física então executa passos fixos de simulação de tamanho $dt$ enquanto o acumulador permitir:

$$\text{while} \quad \text{accumulator} \ge dt \quad \text{do} \quad \text{Simular}(dt), \quad \text{accumulator} \leftarrow \text{accumulator} - dt$$

Para evitar a **Espiral da Morte** (quando a física demora mais para simular um passo do que o próprio passo físico, gerando um loop infinito que trava o jogo sob lag severo), limitamos o tempo acumulado máximo por frame (tipicamente $0.25$ segundos).

---

## 3. Colisão Avançada: Swept AABB (Axis-Aligned Bounding Box)

A colisão estática (AABB clássica) apenas responde à pergunta: "Estamos nos sobrepondo *agora*?". O **Swept AABB** calcula a trajetória contínua do objeto em movimento projetando o seu vetor velocidade em relação a um obstáculo estático. 

Isso nos permite descobrir o momento exato em que a colisão começou ($t_{\text{entry}}$) e terminou ($t_{\text{exit}}$) como uma fração do frame (entre $0.0$ e $1.0$).

### 3.1. Matemática de Swept AABB

Dado um objeto móvel $B_1$ com velocidade $\vec{v} = (vx, vy)$ e um objeto estático $B_2$:

1. **Distâncias de Entrada e Saída (eixos $x$ e $y$):**
   - Se $vx > 0$:
     $$x_{\text{entry}} = B_2.x - (B_1.x + B_1.w)$$
     $$x_{\text{exit}} = (B_2.x + B_2.w) - B_1.x$$
   - Se $vx < 0$:
     $$x_{\text{entry}} = (B_2.x + B_2.w) - B_1.x$$
     $$x_{\text{exit}} = B_2.x - (B_1.x + B_1.w)$$

2. **Tempos de Colisão por Eixo:**
   $$t_{\text{entry}, x} = \frac{x_{\text{entry}}}{vx}, \quad t_{\text{exit}, x} = \frac{x_{\text{exit}}}{vx}$$
   $$t_{\text{entry}, y} = \frac{y_{\text{entry}}}{vy}, \quad t_{\text{exit}, y} = \frac{y_{\text{exit}}}{vy}$$

3. **Tempo de Entrada e Saída Global:**
   $$t_{\text{entry}} = \max(t_{\text{entry}, x}, t_{\text{entry}, y})$$
   $$t_{\text{exit}} = \min(t_{\text{exit}, x}, t_{\text{exit}, y})$$

4. **Condições de Colisão:**
   Haverá colisão se e somente se:
   - $t_{\text{entry}} < t_{\text{exit}}$
   - $0.0 \le t_{\text{entry}} < 1.0$
   - Os intervalos de projeção nos eixos se sobrepõem.

5. **Vetor Normal da Colisão ($\vec{n}$):**
   Identifica qual face colidiu. Se $t_{\text{entry}, x} > t_{\text{entry}, y}$, a colisão ocorreu no eixo $x$ (normal horizontal $\vec{n} = (1, 0)$ ou $(-1, 0)$). Caso contrário, ocorreu no eixo $y$ ($\vec{n} = (0, 1)$ ou $(0, -1)$).

---

## 4. Implementação de Referência (TypeScript)

Abaixo está o módulo completo de simulação física que deve ser integrado ao Danger Ghost.

```typescript
// src/physics/Engine.ts

export interface Box {
    x: number;
    y: number;
    w: number;
    h: number;
    vx: number;
    vy: number;
}

export interface CollisionResult {
    time: number; // Fração do frame (0 a 1). 1 significa que não houve colisão.
    normalX: number; // Direção normal da colisão em X (-1, 0, 1)
    normalY: number; // Direção normal da colisão em Y (-1, 0, 1)
}

export class PhysicsEngine {
    private readonly dt: number; // Passo de tempo fixo (ex: 1/60 = 0.01666)
    private accumulator: number = 0;
    private readonly maxFrameTime: number = 0.25; // Prevenção contra espiral da morte
    private gravity: number = 980; // pixels por segundo quadrado

    constructor(fps: number = 60) {
        this.dt = 1 / fps;
    }

    /**
     * Calcula o tempo exato de colisão contínua entre duas caixas AABB
     */
    public sweptAABB(b1: Box, b2: Box): CollisionResult {
        let xEntryDist: number, yEntryDist: number;
        let xExitDist: number, yExitDist: number;

        // Calcular a distância até a colisão nos eixos X e Y
        if (b1.vx > 0) {
            xEntryDist = b2.x - (b1.x + b1.w);
            xExitDist = (b2.x + b2.w) - b1.x;
        } else {
            xEntryDist = (b2.x + b2.w) - b1.x;
            xExitDist = b2.x - (b1.x + b1.w);
        }

        if (b1.vy > 0) {
            yEntryDist = b2.y - (b1.y + b1.h);
            yExitDist = (b2.y + b2.h) - b1.y;
        } else {
            yEntryDist = (b2.y + b2.h) - b1.y;
            yExitDist = b2.y - (b1.y + b1.h);
        }

        // Calcular tempos de colisão em cada eixo
        let xEntry = -Infinity, yEntry = -Infinity;
        let xExit = Infinity, yExit = Infinity;

        if (b1.vx !== 0) {
            xEntry = xEntryDist / b1.vx;
            xExit = xExitDist / b1.vx;
        }
        if (b1.vy !== 0) {
            yEntry = yEntryDist / b1.vy;
            yExit = yExitDist / b1.vy;
        }

        // Encontrar o tempo de entrada e saída global
        const entryTime = Math.max(xEntry, yEntry);
        const exitTime = Math.min(xExit, yExit);

        // Se não houver colisão
        if (entryTime > exitTime || xEntry < 0.0 && yEntry < 0.0 || xEntry > 1.0 || yEntry > 1.0) {
            return { time: 1.0, normalX: 0, normalY: 0 };
        }

        // Calcular direções normais de resposta
        let normalX = 0;
        let normalY = 0;

        if (xEntry > yEntry) {
            if (xEntryDist < 0.0) {
                normalX = 1.0;
            } else {
                normalX = -1.0;
            }
        } else {
            if (yEntryDist < 0.0) {
                normalY = 1.0;
            } else {
                normalY = -1.0;
            }
        }

        return { time: entryTime, normalX, normalY };
    }

    /**
     * Atualiza o loop físico usando acumulador e sub-stepping fixo
     */
    public update(
        elapsedTimeSeconds: number,
        player: Box,
        platforms: Box[],
        onGroundedChanged: (grounded: boolean) => void
    ): void {
        // Prevenir espiral da morte limitando o delta time processado
        if (elapsedTimeSeconds > this.maxFrameTime) {
            elapsedTimeSeconds = this.maxFrameTime;
        }

        this.accumulator += elapsedTimeSeconds;

        while (this.accumulator >= this.dt) {
            // Aplicar gravidade (aceleração externa)
            player.vy += this.gravity * this.dt;

            // Criar caixa expandida contendo o movimento planejado neste sub-passo
            const movementBox: Box = {
                x: player.vx > 0 ? player.x : player.x + player.vx * this.dt,
                y: player.vy > 0 ? player.y : player.y + player.vy * this.dt,
                w: player.w + Math.abs(player.vx * this.dt),
                h: player.h + Math.abs(player.vy * this.dt),
                vx: player.vx * this.dt,
                vy: player.vy * this.dt
            };

            let earliestCollision: CollisionResult = { time: 1.0, normalX: 0, normalY: 0 };
            let targetPlatform: Box | null = null;

            // Filtrar colisões potenciais na vizinhança
            for (const plat of platforms) {
                // Verificação rápida de sobreposição AABB da caixa expandida para otimização
                if (
                    movementBox.x < plat.x + plat.w &&
                    movementBox.x + movementBox.w > plat.x &&
                    movementBox.y < plat.y + plat.h &&
                    movementBox.y + movementBox.h > plat.y
                ) {
                    const testBox: Box = {
                        x: player.x,
                        y: player.y,
                        w: player.w,
                        h: player.h,
                        vx: player.vx * this.dt,
                        vy: player.vy * this.dt
                    };
                    const col = this.sweptAABB(testBox, plat);
                    if (col.time < earliestCollision.time) {
                        earliestCollision = col;
                        targetPlatform = plat;
                    }
                }
            }

            // Mover o jogador com base no tempo até a colisão
            player.x += player.vx * this.dt * earliestCollision.time;
            player.y += player.vy * this.dt * earliestCollision.time;

            // Resposta de colisão (Deflexão / Deslizamento)
            if (earliestCollision.time < 1.0 && targetPlatform) {
                // Se colidiu no eixo Y
                if (earliestCollision.normalY !== 0) {
                    player.vy = 0; // Zerar velocidade vertical (impacto com solo ou teto)
                    if (earliestCollision.normalY < 0) {
                        onGroundedChanged(true); // Colisão vinda de baixo (pé no chão)
                    }
                }
                
                // Se colidiu no eixo X
                if (earliestCollision.normalX !== 0) {
                    player.vx = 0; // Zerar velocidade horizontal (impacto com parede)
                }

                // Tempo restante do frame após colisão
                const remainingTime = 1.0 - earliestCollision.time;
                
                // Deslizar horizontalmente ou verticalmente no tempo residual
                player.x += player.vx * this.dt * remainingTime;
                player.y += player.vy * this.dt * remainingTime;
            } else {
                // Caso não tenha havido colisões no sub-passo
                onGroundedChanged(false);
            }

            this.accumulator -= this.dt;
        }
    }
}
```

---

## 5. Normalização de Movimentos Multidirecionais (8-Way)

Se o jogo utilizar teclado com controle multidirecional simultâneo (ex: `W` + `D`), a magnitude da velocidade sem tratamento geométrico é multiplicada por $\sqrt{2} \approx 1.414$, conferindo $41.4\%$ de velocidade extra injusta na diagonal.

### 5.1. Solução Vetorial
Sempre que detectar múltiplos inputs direcionais, o vetor velocidade do herói deve ser normalizado:

```typescript
// Implementação dentro do Input Handler
let dx = 0;
let dy = 0;

if (keys.Left)  dx -= 1;
if (keys.Right) dx += 1;
if (keys.Up)    dy -= 1;
if (keys.Down)  dy += 1;

let vx = 0;
let vy = 0;

if (dx !== 0 && dy !== 0) {
    // Vetor unitário para diagonal: 1 / sqrt(2) ≈ 0.7071
    const length = Math.sqrt(dx * dx + dy * dy);
    vx = (dx / length) * playerSpeed;
    vy = (dy / length) * playerSpeed;
} else {
    vx = dx * playerSpeed;
    vy = dy * playerSpeed;
}
```

Isso garante velocidade idêntica independente do sentido de deslocamento.

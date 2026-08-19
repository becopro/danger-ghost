# Product Requirements Document (PRD)

*Última revisão: 18 de Agosto de 2026.*

## Propósito do Produto
Proporcionar uma experiência de plataforma 2D com elementos de RPG, rápida e acessível diretamente no navegador ou via aplicativo mobile, conectando todos os jogadores no mesmo mundo em tempo real.

## Requisitos Funcionais

### 1. Sistema de Contas e Progressão
- **Login:** Google OAuth (Firebase) é o caminho principal de cadastro/login. Um caminho alternativo por e-mail/senha ("Cloud Save") existe em paralelo. Ver `ARCHITECTURE.md` §3 para os três fluxos de auth existentes e o alerta de segurança sobre senha em texto puro no fluxo alternativo.
- **Saves na Nuvem:** O progresso do jogador (Xp, Level, Atributos) deve ser salvo persistentemente no servidor, garantindo que o usuário possa jogar de qualquer dispositivo.
- **Auto-Forja (Auto-Forge):** Quando um novo usuário faz o cadastro, o sistema deve garantir que ele seja designado com um personagem jogável (Ghost #001) para garantir que ele possa apertar 'Espaço' e iniciar o jogo imediatamente, sem atritos na interface.
- **Ghostdex:** Um registro que desbloqueia e acompanha quais "Ghosts" o usuário já conheceu ou possui.

### 2. Gameplay
- **Motor Gráfico:** O motor em JavaScript Vanilla deve processar gravidade, colisões de cenário e animação de sprites a pelo menos 60 quadros por segundo em PCs modernos.
- **Fases:** O jogo deve suportar múltiplos níveis com progressão lógica. Atualmente estruturado para pelo menos 33 níveis.
- **Sistema de RPG:** Todo personagem deve ter atributos base: HP, VIT, AGI, INT, POW, MAG. O ganho de XP e passagem de nível aumentam os pontos disponíveis que podem ser alocados pelo usuário na interface do jogo.

### 3. Multiplayer
- **Presença em Tempo Real:** Todo jogador deve ver a posição, nível (Lv. X) e nome de todos os outros jogadores logados no mesmo nível e servidor.
- **Comunicação de Baixa Latência:** Uso exclusivo de WebSockets para enviar estados em milissegundos para minimizar rubber-banding.
- **Chat Integrado:** Um chat global interligado que suporta todos os clientes ativos.

### 4. Cross-Platform
- **Mobile-first paridade:** Tudo que funciona no PC deve funcionar no Celular.
- **Empacotamento:** O aplicativo Android tem seu próprio projeto base (Capacitor), mas compartilha as regras de engine. Modificações da Web devem ser refletidas/adaptadas de forma cirúrgica na versão Android sempre que afetarem renderização ou conexão.

## Requisitos Não Funcionais (NFRs)
- **Web2 Nativo:** O jogo não utiliza blockchain de terceiros (como a DeSo). Toda a arquitetura de banco de dados deve ser gerenciada in-house. *(A criação de uma blockchain proprietária está no roadmap futuro)*.
- **Leveza de Hospedagem:** O backend e os bancos de dados (SQLite local + MySQL na "Deso Hosting", nome do provedor — ver `ARCHITECTURE.md` §4) devem consumir recursos mínimos (CPU/RAM) para viabilizar hospedagem em VPS de baixo custo gerenciada pelo PM2.
- **Segurança de credenciais (pendente):** senhas do fluxo de login local devem ser hasheadas antes de ir para produção real com muitos usuários — atualmente não são (débito técnico confirmado, ver auditoria de segurança).

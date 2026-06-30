			// --- SHIELD PROTOCOL (ANTI-HACKER / ANTI-DEVTOOLS) ---
			
			// 1. Console Blackout (Silence all outputs in production)
			// console.log = function() {};
			// console.warn = function() {};
			// console.error = function() {};
			// console.info = function() {};
			// console.dir = function() {};
			
			// 2. Block Right-Click (Context Menu)
			document.addEventListener('contextmenu', function(e) {
				e.preventDefault();
			});
			
			// 3. Block Developer Tools Shortcuts
			document.addEventListener('keydown', function(e) {
				// F12
				if (e.keyCode == 123) {
					e.preventDefault();
					return false;
				}
				// Ctrl+Shift+I (Inspecionar)
				if (e.ctrlKey && e.shiftKey && e.keyCode == 73) {
					e.preventDefault();
					return false;
				}
				// Ctrl+Shift+J (Console)
				if (e.ctrlKey && e.shiftKey && e.keyCode == 74) {
					e.preventDefault();
					return false;
				}
				// Ctrl+U (Ver Fonte)
				if (e.ctrlKey && e.keyCode == 85) {
					e.preventDefault();
					return false;
				}
			});
			
			// 4. Debugger Trap (Infinite loop if DevTools opens) - DISABLED to prevent local freeze and allow inspection
			/*
			setInterval(function() {
				(function() {
					return false;
				}
				['constructor']('debugger')
				['call']());
			}, 100);
			*/

			// --- PREMIUM HORIZONTAL NAVBAR CONTROLS ---
			var g_activeTab = null;
			var g_lastTabClickTick = 0; // Tick-based event loop guard to prevent double-firing in Triple-Redundant click architectures
			var g_hasFetchedLeaderboard = false;

			// UI MOVED TO js/ui/ui_manager.js


			window.UpdateNavbarBag = UpdateNavbarBag;
			window.SelectBagItem = SelectBagItem;
			window.InitGlobalChat = InitGlobalChat;
			window.AddChatMessage = AddChatMessage;
			window.RenderChatHistory = RenderChatHistory;

			// Método A: Vinculação Dinâmica no DOMContentLoaded (Segurança AAA)
			document.addEventListener("DOMContentLoaded", function() {

				// Inicializa o chat global em tempo real
				try {
					InitGlobalChat();
				} catch(e) {}

				// Abre o painel de Controles por padrão ao carregar a página para abrir as informações para todos
				try {
					ToggleNavbarTab('controls');
				} catch(e) {}

				// Restaura sessão DeSo anterior se disponível para manter o login consistente entre atualizações
				try {
					var savedKey = localStorage.getItem("dg_deso_public_key");
					var savedObj = localStorage.getItem("dg_deso_user_obj");
					if (savedKey) {
						window.g_desoPublicKey = savedKey;
						if (savedObj) {
							window.g_desoUserObj = JSON.parse(savedObj);
						}
						
						var dBtn = document.getElementById("desoBtn");
						if (dBtn) {
							dBtn.innerText = "LOGGED IN: " + window.g_desoPublicKey.substring(0,8) + "...";
							dBtn.style.borderColor = "#00FF00";
							dBtn.style.color = "#00FF00";
						}
						CheckVIPStatus(window.g_desoPublicKey);
						if (typeof LoadRPGStateFromDeSo === "function") {
							LoadRPGStateFromDeSo(window.g_desoPublicKey);
						}
					}
				} catch(sessionErr) {
					console.warn("Failed to restore DeSo session:", sessionErr);
				}
			});




			// --- ANTI-CHEAT CAIXA PRETA (IIFE) ---
			(function() {
            // requestAnimationFrame polyfill
            (function() {
                var lastTime = 0;
                var vendors = ['ms', 'moz', 'webkit', 'o'];
                for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
                    window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
                    window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                               || window[vendors[x]+'CancelRequestAnimationFrame'];
                }
             
                if (!window.requestAnimationFrame)
                    window.requestAnimationFrame = function(callback, element) {
                        var currTime = new Date().getTime();
                        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                        var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
                          timeToCall);
                        lastTime = currTime + timeToCall;
                        return id;
                    };
             
                if (!window.cancelAnimationFrame)
                    window.cancelAnimationFrame = function(id) {
                        clearTimeout(id);
                    };
            }());

			var g_canvas = document.getElementById("myCanvas");
			var g_ctx = g_canvas.getContext("2d");

			// --- ASSET DEFINITIONS ---
			var desoGhostRight = new Image(); desoGhostRight.src = 'assets/sprites/Ftasma d.webp';
			var desoGhostLeft = new Image(); desoGhostLeft.src = 'assets/sprites/Ftasma e.webp';
			var DeSoGhost_Lives = new Image(); DeSoGhost_Lives.src = 'assets/sprites/Ftasma d.webp';
			var silverLine = new Image(); silverLine.src = 'assets2/silverborder.png';
			var levelTextImage = new Image(); levelTextImage.src = 'assets2/level.png';
			var redBrickImage = new Image(); redBrickImage.src = "assets2/redTile.png";
			var platformTileImage = new Image(); platformTileImage.src = 'assets2/platformTile.png';
			var doorImage = new Image(); doorImage.src = 'assets2/door.png';
			var blueDiamond = new Image(); blueDiamond.src = 'assets2/diamonds.png';
			var redDiamond = new Image(); redDiamond.src = 'assets/sprites/Nouns ilha.webp';
			var crownImage = new Image(); crownImage.src = 'assets2/crown.png';
			var ringImage = new Image(); ringImage.src = 'assets2/ring.png';
			var mudTileImage = new Image(); mudTileImage.src = 'assets2/mudTile.png';
			var blueTileImage = new Image(); blueTileImage.src = 'assets2/blueTile.png';
			var pipeImage = new Image(); pipeImage.src = 'assets2/pipe.png';
			var tree1Image = new Image(); tree1Image.src = 'assets2/tree1.png';
			var tree2Image = new Image(); tree2Image.src = 'assets2/tree2.png';
			var starsImage = new Image(); starsImage.src = 'assets2/stars.png';
			var branchImage = new Image(); branchImage.src = 'assets2/branch.png';
			var grassImage = new Image(); grassImage.src = 'assets2/grass.png';
			var logoImage = new Image(); logoImage.src = 'assets/sprites/Logo DeSoGhost.png';
			var logoDesoImage = new Image(); logoDesoImage.src = 'assets/sprites/Logo DeSo.png';
			var blueKeyImage = new Image(); blueKeyImage.src = 'assets/sprites/Blue key (1).webp';
			var water1Image = new Image(); water1Image.src = 'assets2/water1.png';
			var water2Image = new Image(); water2Image.src = 'assets2/water2.png';
			var water3Image = new Image(); water3Image.src = 'assets2/water3.png';
			var water4Image = new Image(); water4Image.src = 'assets2/water4.png';
			var water5Image = new Image(); water5Image.src = 'assets2/water5.png';
			var fire1Image = new Image(); fire1Image.src = 'assets2/fire1.png';
			var fire2Image = new Image(); fire2Image.src = 'assets2/fire2.png';
			var fire3Image = new Image(); fire3Image.src = 'assets2/fire3.png';
			var fire4Image = new Image(); fire4Image.src = 'assets2/fire4.png';
			var weed1Image = new Image(); weed1Image.src = 'assets2/weed1.png';
			var weed2Image = new Image(); weed2Image.src = 'assets2/weed2.png';
			var weed3Image = new Image(); weed3Image.src = 'assets2/weed3.png';
			var weed4Image = new Image(); weed4Image.src = 'assets2/weed4.png';
			var monsterImage = new Image(); monsterImage.src = 'assets2/monster.png';
			var monster1Image = new Image(); monster1Image.src = 'assets2/monster1.png';
			var monster2Image = new Image(); monster2Image.src = 'assets2/monster2.png';
			var monsterBulletImage = new Image(); monsterBulletImage.src = 'assets2/monsterBullet.png';
			var monsterBulletL1Image = new Image(); monsterBulletL1Image.src = 'assets2/monsterBulletL1.png';
			var monsterBulletL2Image = new Image(); monsterBulletL2Image.src = 'assets2/monsterBulletL2.png';
			var monsterBulletR1Image = new Image(); monsterBulletR1Image.src = 'assets2/monsterBulletR1.png';
			var monsterBulletR2Image = new Image(); monsterBulletR2Image.src = 'assets2/monsterBulletR2.png';
			var explosion1Image = new Image(); explosion1Image.src = 'assets2/explosion1.png';
			var explosion2Image = new Image(); explosion2Image.src = 'assets2/explosion2.png';
			var goImage = new Image(); goImage.src = 'assets2/go.png';
			var dave0Image = new Image(); dave0Image.src = 'assets2/dave0.png';
			var dave1Image = new Image(); dave1Image.src = 'assets2/dave1.png';
			var dave2Image = new Image(); dave2Image.src = 'assets2/dave2.png';
			var dave3Image = new Image(); dave3Image.src = 'assets2/dave3.png';
			var dave4Image = new Image(); dave4Image.src = 'assets2/dave4.png';
			var dave5Image = new Image(); dave5Image.src = 'assets2/dave5.png';
			var dave6Image = new Image(); dave6Image.src = 'assets2/dave6.png';
			var dave7Image = new Image(); dave7Image.src = 'assets2/dave7.png';
			var dave8Image = new Image(); dave8Image.src = 'assets2/dave8.png';
			var cup1Image = new Image(); cup1Image.src = 'assets2/cup1.png';
			var cup2Image = new Image(); cup2Image.src = 'assets2/cup2.png';
			var cup3Image = new Image(); cup3Image.src = 'assets2/cup3.png';
			var cup4Image = new Image(); cup4Image.src = 'assets2/cup4.png';
			var cup5Image = new Image(); cup5Image.src = 'assets2/cup5.png';
			
			var bgMusic = new Audio('assets/sprites/Ghostly Quest 8-Bit.mp3');
			bgMusic.loop = true;
			var g_musicStarted = false;
			// Tenta autoplay (pode ser bloqueado pelo navegador sem interação prévia)
			var p = bgMusic.play(); if (p !== undefined) { p.catch(function(e){}); }
			
			function ToggleMute() {
				var btn = document.getElementById("muteBtn");
				if (bgMusic.muted) {
					bgMusic.muted = false;
					btn.innerText = "🔊";
				} else {
					bgMusic.muted = true;
					btn.innerText = "🔇";
				}
			}
			window.ToggleMute = ToggleMute;
			window.RenderCharacterNFTBlob = RenderCharacterNFTBlob;
			var sickCrowRight = new Image(); sickCrowRight.src = 'assets/sprites/Sickcrow d.webp';
			var sickCrowLeft = new Image(); sickCrowLeft.src = 'assets/sprites/Sickcrow e.webp';
			var cactusRight = new Image(); cactusRight.src = 'assets/sprites/Cactus direita.webp';
			var cactusLeft = new Image(); cactusLeft.src = 'assets/sprites/Cactus esquerda.webp';
			var demonFlyRight = new Image(); demonFlyRight.src = 'assets/sprites/Brd direita.webp';
			var demonFlyLeft = new Image(); demonFlyLeft.src = 'assets/sprites/Brd esquerda.webp';
			var skullRight = new Image(); skullRight.src = 'assets/sprites/Skull-direita.webp';
			var skullLeft = new Image(); skullLeft.src = 'assets/sprites/Skull-esquerda.webp';

			var slimeRight = new Image(); slimeRight.src = 'assets/sprites/Slime direita.webp';
			var slimeLeft = new Image(); slimeLeft.src = 'assets/sprites/Slime esquerda.webp';

			var fireballRightImg = new Image(); fireballRightImg.src = 'assets/sprites/Bola de fogo direita.webp';
			var fireballLeftImg = new Image(); fireballLeftImg.src = 'assets/sprites/Bola de fogo esquerda.webp';
			window.fireballRightImg = fireballRightImg;
			window.fireballLeftImg = fireballLeftImg;
			var spellSparkImg = new Image(); spellSparkImg.src = 'assets/sprites/spell_spark.png';
			var spellGhostImg = new Image(); spellGhostImg.src = 'assets/sprites/spell_ghost.png';
			var spellOrbImg = new Image(); spellOrbImg.src = 'assets/sprites/spell_orb.png';
			var spellPhantomImg = new Image(); spellPhantomImg.src = 'assets/sprites/spell_phantom.png';



			var waterFrames = [new Image(), new Image(), new Image(), new Image()];
			waterFrames[0].src = 'assets2/water1.png'; waterFrames[1].src = 'assets2/water2.png';
			waterFrames[2].src = 'assets2/water3.png'; waterFrames[3].src = 'assets2/water4.png';

			var fireFrames = [new Image(), new Image(), new Image(), new Image()];
			fireFrames[0].src = 'assets2/fire1.png'; fireFrames[1].src = 'assets2/fire2.png';
			fireFrames[2].src = 'assets2/fire3.png'; fireFrames[3].src = 'assets2/fire4.png';

			var cupFrames = [new Image(), new Image(), new Image(), new Image()];
			cupFrames[0].src = 'assets2/cup1.png'; cupFrames[1].src = 'assets2/cup2.png';
			cupFrames[2].src = 'assets2/cup3.png'; cupFrames[3].src = 'assets2/cup4.png';

			var weedFrames = [new Image(), new Image(), new Image(), new Image()];
			weedFrames[0].src = 'assets2/weed1.png'; weedFrames[1].src = 'assets2/weed2.png';
			weedFrames[2].src = 'assets2/weed3.png'; weedFrames[3].src = 'assets2/weed4.png';

			var explosionFrames = [new Image(), new Image()];
			explosionFrames[0].src = 'assets2/explosion1.png'; explosionFrames[1].src = 'assets2/explosion2.png';
			var nounsIlhaImage = new Image(); nounsIlhaImage.src = 'assets/sprites/Nouns ilha.webp';

			// --- GAME STATE ---
			var G_START = 0, G_PLAY = 1, G_WIN = 2, G_GAMEOVER = 3, G_CUTSCENE = 4, G_END_CUTSCENE = 5, G_PAUSE = 6;
			var g_gameState = G_START;
			function SetGameState(newState) {
				if (g_gameState === newState) return;
				g_gameState = newState;
				
				var btn = document.getElementById("desoBtn");
				if (btn) btn.style.display = (g_gameState == G_START || g_gameState == G_WIN) ? "inline-block" : "none";
				
				var gBtn = document.getElementById("guestBtn");
				if (gBtn) gBtn.style.display = (g_gameState == G_START) ? "inline-block" : "none";

				var winPanel = document.getElementById("winPanel");
				if (winPanel) winPanel.style.display = (g_gameState == G_WIN) ? "block" : "none";

				if (g_gameState == G_GAMEOVER || g_gameState == G_WIN) {
					if (typeof window.SaveScore === "function") {
						var charId = "GUEST";
						var charName = "Guest";
						var charLvl = g_currentLevel;
						if (window.GhostRPG && window.GhostRPG.getStats) {
							var stats = window.GhostRPG.getStats();
							if (stats.characterId) charId = stats.characterId;
							if (stats.name) charName = stats.name;
							if (stats.level) charLvl = stats.level;
						}
						window.SaveScore(charId, g_score, charLvl, charName);
					}
				}
			}
			var g_count = 0;
			var g_levelStartTime = Date.now();
			var g_pauseStartTime = 0;
			var g_timeRemaining = 240;
			var g_globalStartTime = 0;
			var g_globalTotalTime = 0;
			var map_offset = 0;
			var g_score = 0;
			var g_currentLevel = 1;
			var g_doorsUsed = 0;

			// --- SHADOW STATE ANTI-TAMPER ---
			var _antiCheat = {
				salt: Math.random().toString(36).substring(2, 15),
				hash: ""
			};
			_antiCheat.hash = btoa("0" + _antiCheat.salt); // Init score 0
			
			var g_slimeScoreTracker = 0;
			function AddScore(points) {
				var stack = (new Error()).stack || "";
				if (!stack.includes("DeSoGhost") && !stack.includes("Boss") && !stack.includes("LevelUp") && !stack.includes("rpg_system.js") && !stack.includes("updateProjectiles") && !stack.includes("test_cave1.js") && !stack.includes("test_fireball_collect.js") && !stack.includes("sandbox_test.js") && !stack.includes("Update") && !stack.includes("Game_Step") && !stack.includes("Game_Loop")) {
					console.warn("[Anti-Cheat] AddScore call blocked from untrusted context.");
					return;
				}
				g_score += points;
				_antiCheat.hash = btoa(g_score + _antiCheat.salt);
				g_slimeScoreTracker += points;
				if (g_slimeScoreTracker >= 3000) {
					while (g_slimeScoreTracker >= 3000) {
						g_slimeScoreTracker -= 3000;
						SpawnBossAtRandomLocation("slime");
					}
				}
			}

			function GetScore() {
				if (btoa(g_score + _antiCheat.salt) !== _antiCheat.hash) return 0;
				return g_score;
			}
			function DeductScore(points) {
				var stack = (new Error()).stack || "";
				if (!stack.includes("DeSoGhost") && !stack.includes("Boss") && !stack.includes("LevelUp") && !stack.includes("rpg_system.js") && !stack.includes("updateProjectiles") && !stack.includes("test_cave1.js") && !stack.includes("test_fireball_collect.js") && !stack.includes("sandbox_test.js") && !stack.includes("Update") && !stack.includes("Game_Step") && !stack.includes("Game_Loop")) {
					console.warn("[Anti-Cheat] DeductScore call blocked from untrusted context.");
					return false;
				}
				if (btoa(g_score + _antiCheat.salt) !== _antiCheat.hash) return false;
				if (g_score >= points) {
					g_score -= points;
					_antiCheat.hash = btoa(g_score + _antiCheat.salt);
					return true;
				}
				return false;
			}
			window.AddScore = AddScore;
			window.GetScore = GetScore;
			window.DeductScore = DeductScore;
			var waterFrame = 0, fireFrame = 0, weedFrame = 0, cupFrame = 0, explosionFrame = 0;
			var g_boss = null;
			var g_bosses = [];
			var g_activeIslands = [];
			var g_screenShakeTime = 0;
			var g_screenShakeIntensity = 10;
			var g_projectiles = [];
			var g_visualEffects = [];

			var g_tempGhostRect = {l: 0, r: 0, t: 0, b: 0};
			var g_tempIslandRect = {l: 0, r: 0, t: 0, b: 0};

			// --- OBJECT POOLS ---
			var g_projectilePool = [];
			var g_projectilePoolIndex = 0;
			for (var i = 0; i < 200; i++) {
				g_projectilePool.push({
					x: 0, y: 0, vx: 0, vy: 0, type: "", runeId: 0, width: 0, height: 0, life: 0, damage: 0, penetrates: false, hits: {}
				});
			}
			function obtainProjectile(x, y, vx, vy, type, runeId, width, height, life, damage, penetrates) {
				var p = g_projectilePool[g_projectilePoolIndex];
				g_projectilePoolIndex = (g_projectilePoolIndex + 1) % g_projectilePool.length;
				p.x = x;
				p.y = y;
				p.vx = vx;
				p.vy = vy;
				p.type = type;
				p.runeId = runeId;
				p.width = width;
				p.height = height;
				p.life = life;
				p.damage = damage;
				p.penetrates = penetrates;
				p.isEnemy = false; // Reset de segurança para evitar vazamento do pool e suicídio do Fantasma
				for (var key in p.hits) {
					delete p.hits[key];
				}
				return p;
			}

			var g_fxPool = [];
			var g_fxPoolIndex = 0;
			for (var i = 0; i < 50; i++) {
				var fx = {
					type: "explosion",
					x: 0,
					y: 0,
					particles: [],
					life: 0,
					maxLife: 15
				};
				for (var j = 0; j < 15; j++) {
					fx.particles.push({ x: 0, y: 0, vx: 0, vy: 0, color: "", size: 0 });
				}
				g_fxPool.push(fx);
			}
			function obtainExplosionEffect(x, y, color, particleCount) {
				var fx = g_fxPool[g_fxPoolIndex];
				g_fxPoolIndex = (g_fxPoolIndex + 1) % g_fxPool.length;
				fx.type = "explosion";
				fx.x = x;
				fx.y = y;
				fx.life = 15;
				fx.maxLife = 15;
				var count = Math.min(particleCount, 15);
				fx.particles.length = count;
				for (var i = 0; i < count; i++) {
					if (!fx.particles[i]) {
						fx.particles[i] = { x: 0, y: 0, vx: 0, vy: 0, color: "", size: 0 };
					}
					var p = fx.particles[i];
					var angle = Math.random() * Math.PI * 2;
					var speed = 1 + Math.random() * 3;
					p.x = 0;
					p.y = 0;
					p.vx = Math.cos(angle) * speed;
					p.vy = Math.sin(angle) * speed;
					p.color = color;
					p.size = 2 + Math.random() * 3;
				}
				return fx;
			}

			// --- LEVEL DATA (33 UNIQUE LEVELS) ---
			var g_levels = [
				[[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 7, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 9, 0, 0, 0, 0, 0, 0, 0, 10, 0, 0, 0, 0, 0, 0, 0, 11, 0, 0, 0, 0, 0, 0, 0, 7, 0, 0, 0, 0, 0, 4, 1, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 1, 1, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1], [1, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 0, 0, 0, 1, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1], [1, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1], [1, 1, 1, 1, 1, 5, 5, 5, 5, 1, 1, 1, 1, 1, 5, 5, 5, 5, 1, 1, 1, 1, 1, 5, 5, 5, 5, 1, 1, 1, 1, 1, 5, 5, 5, 5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]],
				[[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 1, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 1, 1, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1], [1, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1], [1, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 1, 1], [1, 0, 0, 0, 0, 0, 0, 0, 8, 9, 10, 11, 0, 0, 0, 0, 8, 9, 10, 11, 0, 0, 0, 0, 8, 9, 10, 11, 0, 0, 0, 0, 8, 9, 10, 11, 0, 0, 0, 0, 8, 9, 10, 11, 0, 0, 0, 0, 1, 1], [1, 1, 1, 1, 1, 1, 6, 6, 1, 1, 1, 1, 6, 6, 6, 6, 1, 1, 1, 1, 6, 6, 6, 6, 1, 1, 1, 1, 6, 6, 6, 6, 1, 1, 1, 1, 6, 6, 6, 6, 1, 1, 1, 1, 6, 6, 6, 1, 1, 1]],
				[[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 1, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 1, 1, 1], [1, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 1, 1], [1, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1], [1, 0, 0, 0, 0, 0, 0, 8, 9, 10, 0, 0, 0, 0, 8, 9, 10, 0, 0, 0, 0, 8, 9, 10, 0, 0, 0, 0, 8, 9, 10, 0, 0, 0, 0, 8, 9, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1], [1, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 0, 0, 2, 2, 2, 2, 2, 0, 0, 2, 2, 2, 2, 2, 0, 0, 2, 2, 2, 2, 2, 0, 0, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1], [1, 1, 1, 1, 1, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 1, 1, 1, 1, 1]],
				[[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]],
				[[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]],
				[[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]],
				[[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 8, 0, 0, 7, 8, 0, 0, 7, 8, 0, 0, 7, 8, 0, 0, 7, 8, 0, 0, 7, 8, 0, 0, 7, 8, 0, 0, 7, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]],
				[[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]],
				[[13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13], [13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0], [13, 13, 13, 13, 13, 13, 13, 13, 6, 6, 13, 13, 13, 13, 13, 13, 6, 6, 13, 13, 13, 13, 13, 13, 6, 6, 13, 13, 13, 13, 13, 13, 6, 6, 13, 13, 13, 13, 13, 13, 6, 6, 13, 13, 13, 13, 13, 13, 13, 13], [13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13]],
				[[13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13], [13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 19, 19, 19, 0, 0, 0, 0, 0, 19, 19, 19, 0, 0, 0, 0, 0, 19, 19, 19, 0, 0, 0, 0, 0, 19, 19, 19, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 16, 0, 12, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0], [13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 16, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13], [13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13]],
				[[13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13], [13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 12, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0], [13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13], [13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13]],
				[[13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13], [13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0], [13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 20, 20, 20, 20, 20, 13, 13, 13, 13, 13, 20, 20, 20, 20, 20, 13, 13, 13, 13, 13, 20, 20, 20, 20, 20, 13, 13, 13, 13, 13, 20, 20, 20, 20, 20, 13, 13, 13, 13, 13], [13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13]],
				[[13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13], [13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0], [13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13], [13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13]],
				[[14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14], [14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14], [14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14], [14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14], [14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13, 13, 13, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13, 13, 13, 0, 0, 0, 13, 13, 13, 0, 0, 0, 0, 0, 0, 0, 0, 14], [14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13, 13, 13, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13, 13, 13, 0, 0, 14], [14, 0, 0, 0, 0, 0, 0, 0, 13, 13, 13, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14], [14, 0, 13, 13, 13, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13, 13, 13, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14], [14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13, 13, 4, 0, 14], [14, 0, 13, 13, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14], [14, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 14]],
				[[0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18], [0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0], [0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 2, 2, 4, 0, 0], [0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0], [0, 0, 0, 18, 0, 0, 18, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]],
				[[14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14], [14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 12, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14], [14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14], [14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14], [14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14], [14, 0, 0, 0, 0, 8, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 14], [14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14], [14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14], [14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14], [14, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14], [14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14]],
				[[1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 4, 0, 1], [1, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 1]],
				[[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 18, 0], [18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 18, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 18, 0, 0, 0, 0, 0, 0, 18, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 18, 0, 0, 0, 0, 0, 18, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 18, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 18, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [18, 0, 0, 0, 0, 0, 18, 18, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 18, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 18, 18, 0, 18, 0, 0, 0, 18, 2, 2, 4, 0, 18], [0, 0, 0, 18, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 18, 2, 2, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 2, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0], [18, 0, 18, 0, 18, 18, 0, 0, 0, 18, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
				[[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [5, 0, 2, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0], [13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13]],
				[[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]],
				[[14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14], [0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 2, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 4, 0, 0], [14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14]],
				[[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [13, 13, 0, 0, 0, 13, 13, 0, 0, 0, 13, 13, 0, 0, 0, 13, 13, 0, 0, 0, 13, 13, 0, 0, 0, 13, 13, 0, 0, 0, 13, 13, 0, 0, 0, 13, 13, 0, 0, 0, 13, 13, 0, 0, 0, 13, 13, 4, 0, 0], [0, 0, 13, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6]],
				[[0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0], [18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 18, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 18, 18, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 18, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 18, 0, 0, 0, 0, 0, 0, 18, 0, 18, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0], [0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0], [0, 0, 0, 0, 0, 2, 0, 0, 0, 18, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
				[[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]],
				[[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 4, 0, 0], [0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]],
				[[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 18, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 18, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 18, 0, 0, 0, 0, 0]],
				[[14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 15, 0, 0, 0, 0, 15, 0, 0, 0, 0, 15, 0, 0, 0, 0, 15, 0, 0, 0, 0, 15, 0, 0, 0, 0, 15, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 2, 2, 0, 0, 0, 2, 2, 0, 0, 0, 2, 2, 0, 0, 0, 2, 2, 0, 0, 0, 2, 2, 0, 0, 0, 2, 2, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 15, 0, 0, 0, 0, 15, 0, 0, 0, 0, 15, 0, 0, 0, 0, 15, 0, 0, 0, 0, 15, 0, 0, 0, 0, 15, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 2, 2, 0, 0, 0, 2, 2, 0, 0, 0, 2, 2, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 2, 2, 0, 0, 0, 2, 2, 0, 0, 0, 2, 2, 0, 0, 0, 2, 2, 0, 0, 0], [0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 15, 0, 0, 0, 0, 15, 0, 0, 0, 0, 15, 0, 0, 0, 0, 15, 0, 0, 0, 0, 15, 0, 0, 0, 0, 15, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 2, 2, 0, 0, 0, 2, 2, 0, 0, 0, 2, 2, 0, 0, 0, 2, 2, 0, 0, 0, 2, 2, 0, 0, 0, 2, 2, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 15, 0, 0, 0, 0, 15, 0, 0, 0, 0, 15, 0, 0, 0, 0, 15, 0, 0, 0, 0, 15, 0, 0, 0, 0, 15, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 2, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0, 2, 2, 0, 0, 0, 0, 4, 0, 0], [14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14]],
				[[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 2, 2, 2, 0, 0, 0, 2, 2, 16, 0, 0, 0, 2, 2, 2, 12, 0, 0, 0, 0, 0, 2, 2, 17, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 2, 2, 2, 0, 0, 0, 2, 2, 2, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 17, 0, 0, 0, 2, 2, 2, 0, 0, 0, 2, 2, 2, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0], [13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13, 13]],
				[[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 18, 18, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 18, 18, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 18, 0, 18, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 18, 0], [0, 0, 18, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 18, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [18, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 18, 0, 18, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 18, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 18, 18, 0, 0, 0, 0, 0, 18, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 18, 18, 18, 0, 0, 0, 0, 0, 18, 0, 0, 0, 18, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0], [18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [18, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0], [0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 18, 0, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
				[[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6]],
				[[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 0, 0, 4, 0, 0], [0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]],
				[[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 0, 0, 0, 0, 11, 0, 0, 0, 0, 11, 0, 0, 0, 0, 11, 0, 0, 0, 0, 11, 0, 0, 0, 0, 11, 0, 0, 0, 0, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 12, 0, 0, 0, 0, 12, 0, 0, 0, 0, 12, 0, 0, 0, 0, 12, 0, 0, 0, 0, 12, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 4, 0, 0], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]],
				[[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 1], [1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 1]]
			];

			// --- CLASSES & LOGIC ---
			function Initialize_Map_Array() {
				this.bitmap = [];
				this.loadLevel = function (levelNum) {
					g_levelStartTime = Date.now();
					g_timeRemaining = 240;
					g_slimeScoreTracker = 0;
					g_bosses = [];

					if (levelNum === "cave1") {
						this.bitmap = [];
						for (var r = 0; r < 11; r++) {
							var row = [];
							for (var c = 0; c < 100; c++) row.push(0);
							this.bitmap.push(row);
						}
						for (var c = 0; c < 100; c++) {
							this.bitmap[0][c] = 1;
							this.bitmap[1][c] = 1;
							this.bitmap[9][c] = 1;
							this.bitmap[10][c] = 1;
						}
						for (var c = 10; c < 90; c += 8) {
							for (var len = 0; len < 5; len++) {
								var col = c + len;
								this.bitmap[6][col] = 2;
								this.bitmap[5][col] = 0;
								this.bitmap[4][col] = 2;
								this.bitmap[3][col] = 0;
							}
						}
						this.bitmap[8][95] = 4;
						this.bitmap[8][1] = 2;
						this.bitmap[7][1] = 21;
						g_boss = new c_Boss(800, 48, "skull");
						g_boss.isOriginal = true;
						g_boss.minX = 200; g_boss.maxX = 1000;
						return;
					}


					var predominantTile = 2; // Default fallback
					var idx = levelNum - 1;
					if (idx < 0) idx = 0;
					if (idx >= g_levels.length) idx = 0;
					this.bitmap = JSON.parse(JSON.stringify(g_levels[idx]));
					
					g_activeIslands = [];

					if (levelNum == 26) {
						// Expandir a matriz para 100 colunas (preenchendo com 0)
						for (var r = 0; r < 11; r++) {
							while (this.bitmap[r].length < 100) {
								this.bitmap[r].push(0);
							}
						}

						// Limpar portas originais
						for (var r = 0; r < 11; r++) {
							for (var c = 0; c < 100; c++) {
								if (this.bitmap[r][c] == 4) this.bitmap[r][c] = 0;
							}
						}

						predominantTile = 2; // bloco de plataforma padrão
						
						// Chão base nas colunas iniciais (spawn)
						for (var c = 0; c < 5; c++) {
							this.bitmap[9][c] = predominantTile;
							this.bitmap[10][c] = predominantTile;
						}
						// Chão base nas colunas finais (exit zone)
						for (var c = 95; c < 100; c++) {
							this.bitmap[9][c] = predominantTile;
							this.bitmap[10][c] = predominantTile;
						}

						// Gerar plataformas em zigue-zague nas linhas 4, 6, 8
						var seed = 2626;
						function seededRandom26() {
							var x = Math.sin(seed++) * 10000;
							return x - Math.floor(x);
						}

						for (var rPlat = 4; rPlat <= 8; rPlat += 2) {
							var c = 4;
							while (c < 95) {
								var rVal = seededRandom26();
								if (rVal < 0.75) { // 75% de chance de iniciar uma plataforma
									var platLength = Math.floor(seededRandom26() * 4) + 3; // comprimento de 3 a 6
									if (c + platLength > 96) platLength = 96 - c;
									
									for (var len = 0; len < platLength; len++) {
										var col = c + len;
										this.bitmap[rPlat][col] = predominantTile;
										
										// Adicionar diamantes e vidas extras
										var reward = seededRandom26();
										if (reward < 0.40) {
											this.bitmap[rPlat - 1][col] = 8; // diamante
										} else if (reward < 0.55) {
											this.bitmap[rPlat - 1][col] = 12; // vida extra
										}
									}
									c += platLength + Math.floor(seededRandom26() * 2) + 2; // vãos de 2 a 3 blocos
								} else {
									c += 2;
								}
							}
						}

						// Reposicionar a porta de saída no final da fase (coluna 97, linha 8)
						this.bitmap[9][97] = predominantTile;
						this.bitmap[10][97] = predominantTile;
						this.bitmap[8][97] = 4; // Exit door
					}

					if (levelNum == 30) {
						// Plataforma longa no começo da fase para segurar o jogador no spawn
						for (var c = 0; c < 15; c++) {
							this.bitmap[8][c] = 2;
						}
					}

					// Garantir plataforma inicial no spawn (colunas 1, 2, 3 na linha 8)
					if (this.bitmap[8]) {
						this.bitmap[8][1] = 2;
						this.bitmap[8][2] = 2;
						this.bitmap[8][3] = 2;
					}

					// --- DYNAMIC AAA MAP DOUBLE WIDTH EXPANSION ---
					var currentCols = this.bitmap[0].length;
					if (currentCols === 50) {
						// 1. ground/platform block detection
						predominantTile = 2; // Default: platformTileImage
						var tileCounts = {1: 0, 2: 0, 13: 0, 14: 0, 20: 0};
						for (var r = 0; r < 11; r++) {
							for (var c = 0; c < 50; c++) {
								var t = this.bitmap[r][c];
								if (tileCounts[t] !== undefined) {
									tileCounts[t]++;
								}
							}
						}
						var maxCount = 0;
						for (var tKey in tileCounts) {
							if (tileCounts[tKey] > maxCount) {
								maxCount = tileCounts[tKey];
								predominantTile = parseInt(tKey, 10);
							}
						}

						// 2. Bridge clearance in col 49
						for (var r = 0; r < 11; r++) {
							this.bitmap[r][49] = 0;
						}
						this.bitmap[9][49] = predominantTile; // safe walking ground

						// 3. Seeding deterministic RNG
						var seed = levelNum * 432;
						function seededRandom() {
							var x = Math.sin(seed++) * 10000;
							return x - Math.floor(x);
						}

						// 4. Generate cols 50 to 99 proceduraly
						for (var r = 0; r < 11; r++) {
							var row = this.bitmap[r];
							for (var c = 50; c < 100; c++) {
								row.push(0);
							}
						}

						// Gerar blocos de chão com pequenos vãos nas linhas 9 e 10
						for (var c = 50; c < 100; c++) {
							var isRow10Gap = seededRandom() < 0.10;
							this.bitmap[10][c] = isRow10Gap ? 0 : predominantTile;

							var isRow9Gap = seededRandom() < 0.12;
							this.bitmap[9][c] = isRow9Gap ? 0 : predominantTile;
						}

						// Gerar plataformas suspensas e distribuir muitos diamantes e vidas extras
						for (var rPlat = 3; rPlat <= 7; rPlat += 2) {
							var c = 50;
							while (c < 97) {
								var rVal = seededRandom();
								if (rVal < 0.60) { // 60% de chance de iniciar uma plataforma
									var platLength = Math.floor(seededRandom() * 4) + 3; // comprimento de 3 a 6 blocos
									if (c + platLength > 98) platLength = 98 - c;

									for (var len = 0; len < platLength; len++) {
										var currentC = c + len;
										this.bitmap[rPlat][currentC] = predominantTile;

										// Generosa taxa de recompensas (Vidas extras e Diamantes Azuis)
										var rewardVal = seededRandom();
										if (rewardVal < 0.55) { // 55% de chance de Diamante Azul (tile 8)
											this.bitmap[rPlat - 1][currentC] = 8;
										} else if (rewardVal < 0.85) { // 30% de chance de Vida Extra (tile 12)
											this.bitmap[rPlat - 1][currentC] = 12;
										}
									}
									c += platLength + 2; // Pula a plataforma e deixa um pequeno vão
								} else {
									c += 3;
								}
							}
						}

						// 5. Force exactly 100 cols row size safety
						for (var r = 0; r < 11; r++) {
							while (this.bitmap[r].length < 100) this.bitmap[r].push(0);
							if (this.bitmap[r].length > 100) this.bitmap[r] = this.bitmap[r].slice(0, 100);
						}
					}

					if (levelNum == 4 || levelNum == 16 || levelNum == 20) {
						g_boss = new c_Boss(800, 192);
						g_boss.isOriginal = true;
						if (levelNum == 4) { g_boss.minX = 600; g_boss.maxX = 1000; }
						else if (levelNum == 16) { g_boss.minX = 400; g_boss.maxX = 900; }
						else if (levelNum == 20) { g_boss.minX = 500; g_boss.maxX = 1000; }
					} else if (levelNum == 5 || levelNum == 10 || levelNum == 17 || levelNum == 21) {
						g_boss = new c_Boss(800, 144, "demon_fly");
						g_boss.isOriginal = true;
					} else if (levelNum == 6 || levelNum == 11 || levelNum == 18 || levelNum == 22) {
						g_boss = new c_Boss(800, 144, "slime");
						g_boss.isOriginal = true;
					} else if (levelNum == 33) {
						g_boss = new c_Boss(800, 144, "cactus");
						g_boss.isOriginal = true;
						g_boss.minX = 200; g_boss.maxX = 1000;
					} else {
						g_boss = null;
					}



					// Colocar a porta nova (tile 21) na coluna 1, linha 7 (acima do chão na linha 8)
					if (levelNum > 1) {
						if (this.bitmap[8]) {
							this.bitmap[8][1] = predominantTile;
						}
						if (this.bitmap[7]) {
							this.bitmap[7][1] = 21;
						}
					}
					if (levelNum == 3) {
						this.bitmap[5][18] = 22; // Porta secreta acima da plataforma flutuante original (col 18, linha 5)
					}
					if (levelNum == 6) {
						this.bitmap[3][35] = 23; // Blue Key acima do topo das plataformas no nível 6
					}

					if (levelNum == 3 || levelNum == 6 || levelNum == 9 || levelNum == 13 || levelNum == 32) {
						var doorRow = -1, doorCol = -1;
						for (var r = 0; r < 11; r++) {
							for (var c = 0; c < this.bitmap[r].length; c++) {
								if (this.bitmap[r][c] === 4) {
									doorRow = r;
									doorCol = c;
									break;
								}
							}
							if (doorRow !== -1) break;
						}
						if (doorRow !== -1) {
							if (doorCol > 0 && this.bitmap[doorRow][doorCol - 1] === 0) {
								this.bitmap[doorRow][doorCol - 1] = 24;
							} else if (doorCol + 1 < this.bitmap[doorRow].length && this.bitmap[doorRow][doorCol + 1] === 0) {
								this.bitmap[doorRow][doorCol + 1] = 24;
							} else if (doorRow + 1 < 11 && this.bitmap[doorRow + 1][doorCol] === 0) {
								this.bitmap[doorRow + 1][doorCol] = 24;
							}
						}
					}
				};


				this.loadLevel(g_currentLevel);

				this.draw = function () {
					var startCol = Math.max(0, Math.floor(-map_offset / 24));
					var endCol = Math.min(99, Math.floor((-map_offset + g_canvas.width) / 24));
					for (var i = 0; i < 11; i++) {
						for (var j = startCol; j <= endCol; j++) {
							var x = (j * 24) + map_offset;
							var y = i * 24;
							var tile = this.bitmap[i][j];
							if (tile == 1) g_ctx.drawImage(redBrickImage, x, y, 24, 24);
							else if (tile == 2) g_ctx.drawImage(platformTileImage, x, y, 24, 24);
							else if (tile == 3) g_ctx.drawImage(weedFrames[weedFrame], x, y, 24, 24);
							else if (tile == 4) g_ctx.drawImage(doorImage, x, y, 24, 24);
							else if (tile == 5) g_ctx.drawImage(fireFrames[fireFrame], x, y, 24, 15);
							else if (tile == 6) g_ctx.drawImage(waterFrames[waterFrame], x, y, 24, 12);
							else if (tile == 7) g_ctx.drawImage(redDiamond, x - 6, y - 12, 36, 36); // Aumentado 1.5x e alinhado ao chão
							else if (tile == 8) g_ctx.drawImage(blueDiamond, x, y, 24, 24);
							else if (tile == 9) g_ctx.drawImage(cupFrames[cupFrame], x, y, 24, 24);
							else if (tile == 10) g_ctx.drawImage(crownImage, x, y, 24, 24);
							else if (tile == 11) g_ctx.drawImage(ringImage, x, y, 24, 24);
							else if (tile == 12) g_ctx.drawImage(DeSoGhost_Lives, x, y, 24, 24);
							else if (tile == 13) g_ctx.drawImage(mudTileImage, x, y, 24, 24);
							else if (tile == 14) g_ctx.drawImage(blueTileImage, x, y, 24, 24);
							else if (tile == 15) g_ctx.drawImage(pipeImage, x, y, 24, 24);
							else if (tile == 16) g_ctx.drawImage(tree1Image, x, y, 24, 24);
							else if (tile == 17) g_ctx.drawImage(tree2Image, x, y, 24, 24);
							else if (tile == 18) g_ctx.drawImage(starsImage, x, y, 24, 24);
							else if (tile == 19) g_ctx.drawImage(branchImage, x, y, 24, 24);
							else if (tile == 20) g_ctx.drawImage(grassImage, x, y, 24, 24);
							else if (tile == 21) {
								g_ctx.drawImage(doorImage, x, y, 24, 24);
								g_ctx.font = "bold 9px 'Courier New'";
								g_ctx.fillStyle = "#FFFF00";
								g_ctx.textAlign = "center";
								g_ctx.fillText("back", x + 12, y - 6);
								g_ctx.textAlign = "start";
							} else if (tile == 22) {
								g_ctx.drawImage(doorImage, x, y, 24, 24);
								g_ctx.font = "bold 9px 'Courier New'";
								g_ctx.fillStyle = "#00FFFF";
								g_ctx.textAlign = "center";
								g_ctx.fillText("cave1", x + 12, y - 6);
								g_ctx.textAlign = "start";
							} else if (tile == 23) {
								g_ctx.drawImage(blueKeyImage, x, y, 24, 24);
							} else if (tile == 24) {
								g_ctx.drawImage(fireballRightImg, x, y, 24, 24);
							}
						}

					}
					
					for (var isl = 0; isl < g_activeIslands.length; isl++) {
						var island = g_activeIslands[isl];
						g_ctx.drawImage(nounsIlhaImage, island.x + map_offset, island.y - island.visualYOffset, island.w, island.h);
					}
					g_ctx.fillStyle = "#000";
					g_ctx.fillRect(0, 250, g_canvas.width, 50);
					for (var j_sl = 24; j_sl < 340; j_sl += 226) {
						for (var i_sl = 0; i_sl < 2400; i_sl += 24) {
							g_ctx.drawImage(silverLine, i_sl, j_sl);
						}
					}
				};

				this.updateMap = function () {
					if (++g_count >= 15) {
						waterFrame = (waterFrame + 1) % 4;
						fireFrame = (fireFrame + 1) % 4;
						weedFrame = (weedFrame + 1) % 4;
						cupFrame = (cupFrame + 1) % 4;
						g_count = 0;
					}
					for (var isl = 0; isl < g_activeIslands.length; isl++) {
						var island = g_activeIslands[isl];
						if (island.state == 'countdown') {
							island.timer--;
							if (island.timer <= 0) {
								island.state = 'falling';
							}
						} else if (island.state == 'falling') {
							island.y += 5;
						}
					}
				};
			}

			function determinePos(val) { return Math.floor(val / 24); }

			function spawnCave1Diamonds() {
				var curLevel = typeof g_currentLevel !== "undefined" ? g_currentLevel : window.g_currentLevel;
				var activeMap = typeof map !== "undefined" ? map : window.map;
				if ((curLevel === "cave1" || curLevel === "CAVE1") && activeMap && activeMap.bitmap) {
					for (var c = 10; c < 90; c += 8) {
						for (var len = 0; len < 5; len++) {
							var col = c + len;
							activeMap.bitmap[5][col] = 8;
							activeMap.bitmap[3][col] = 8;
							if (typeof createExplosionEffect === "function") {
								g_visualEffects.push(createExplosionEffect(col * 24 + 12, 5 * 24 + 12, "#00FFFF", 3));
								g_visualEffects.push(createExplosionEffect(col * 24 + 12, 3 * 24 + 12, "#00FFFF", 3));
							}
						}
					}
					for (var c = 2; c < 98; c += 3) {
						if (activeMap.bitmap[8][c] === 0) {
							activeMap.bitmap[8][c] = 8;
							if (typeof createExplosionEffect === "function") {
								g_visualEffects.push(createExplosionEffect(c * 24 + 12, 8 * 24 + 12, "#00FFFF", 3));
							}
						}
					}
					g_screenShakeTime = 35; // slightly longer screen shake (~1.2 sec)
				}
			}
			window.spawnCave1Diamonds = spawnCave1Diamonds;

			function getPhaseMultiplier(levelNum) {
				if (levelNum === "cave1" || levelNum === "CAVE1") {
					return 500;
				}
				var lvl = parseInt(levelNum, 10);
				if (isNaN(lvl)) return 1;
				if (lvl === 33) return 666;
				if (lvl >= 10 && lvl <= 32) {
					return lvl * 10;
				}
				return lvl;
			}

			function c_Boss(l_x, l_y, type) {
				this.type = type || "crow";
				this.xPos = l_x; this.yPos = (this.type === "slime") ? l_y + 8 : l_y;


				
				var stats = GhostRPG.getStats();
				this.level = stats.level || 1;
				
				var baseHp = (this.type === "cactus") ? 9 : ((this.type === "skull") ? 33 : 4);
				var phaseMult = getPhaseMultiplier(g_currentLevel);
				this.maxHp = baseHp * this.level * phaseMult;
				this.lives = this.maxHp;
				
				this.width = (this.type === "cactus") ? 288 : ((this.type === "skull") ? 168 : 48); 
				this.height = (this.type === "cactus") ? 288 : ((this.type === "skull") ? 168 : 48);
				this.speed = 2; this.dir = 1;
				this.alive = true;
				this.isOriginal = false;
				this.minX = l_x - 120; this.maxX = l_x + 120;
				this.burnTicks = 0;
				this.poisonTicks = 0;
				this.slowTimer = 0;
				this.shockTimer = 0;
				this.shootCooldown = Math.floor(Math.random() * 60) + 60;

				if (typeof g_bosses !== 'undefined') {
					g_bosses.push(this);
				}

				this.draw = function () {
					if (!this.alive) return;
					var sprite;
					if (this.type === "cactus") {
						sprite = (this.dir > 0) ? cactusRight : cactusLeft;
					} else if (this.type === "skull") {
						sprite = (this.dir > 0) ? skullLeft : skullRight;
					} else if (this.type === "demon_fly") {
						sprite = (this.dir > 0) ? demonFlyRight : demonFlyLeft;
					} else if (this.type === "slime") {
						sprite = (this.dir > 0) ? slimeLeft : slimeRight;
					}
 else {
						sprite = (this.dir > 0) ? sickCrowLeft : sickCrowRight;
					}


					g_ctx.drawImage(sprite, this.xPos + map_offset, this.yPos, this.width, this.height);
					
					if (this.lives > 0) {
						var barWidth = Math.min(this.width, 48);
						var barHeight = 4;
						var barX = this.xPos + map_offset + (this.width - barWidth) / 2;
						var barY = this.yPos - 8;
						
						g_ctx.fillStyle = "#000000";
						g_ctx.fillRect(barX, barY, barWidth, barHeight);
						
						g_ctx.fillStyle = "#FF0000";
						g_ctx.fillRect(barX + 1, barY + 1, barWidth - 2, barHeight - 2);
						
						var hpPct = Math.max(0, this.lives / this.maxHp);
						g_ctx.fillStyle = "#00FF00";
						g_ctx.fillRect(barX + 1, barY + 1, Math.floor(hpPct * (barWidth - 2)), barHeight - 2);
					}
					
					// Draw overlays for active status effects
					if (this.burnTicks > 0) {
						g_ctx.fillStyle = "rgba(255, 69, 0, 0.35)";
						g_ctx.fillRect(this.xPos + map_offset, this.yPos, this.width, this.height);
					}
					if (this.poisonTicks > 0) {
						g_ctx.fillStyle = "rgba(50, 205, 50, 0.35)";
						g_ctx.fillRect(this.xPos + map_offset, this.yPos, this.width, this.height);
					}
					if (this.slowTimer > 0) {
						g_ctx.fillStyle = "rgba(30, 144, 255, 0.35)";
						g_ctx.fillRect(this.xPos + map_offset, this.yPos, this.width, this.height);
					}
					if (this.shockTimer > 0) {
						g_ctx.fillStyle = "rgba(255, 255, 0, 0.35)";
						g_ctx.fillRect(this.xPos + map_offset, this.yPos, this.width, this.height);
					}
				};

				this.update = function () {
					if (!this.alive) return;
					
					// Update status ticks
					if (this.burnTicks > 0) {
						this.burnTicks--;
						if (this.burnTicks % 15 === 0) {
							var burnDmg = 2 + Math.floor(GhostRPG.getStats().weapon.damage * 0.05);
							if (this.type === "demon_fly" || this.type === "slime") burnDmg = Math.max(1, Math.floor(burnDmg / 2));
							this.lives -= burnDmg;
							g_visualEffects.push(createExplosionEffect(this.xPos + this.width/2, this.yPos + this.height/2, "#FF4500", 6));
						}
					}
					if (this.poisonTicks > 0) {
						this.poisonTicks--;
						if (this.poisonTicks % 20 === 0) {
							var poisonDmg = 1 + Math.floor(GhostRPG.getStats().weapon.damage * 0.03);
							if (this.type === "demon_fly" || this.type === "slime") poisonDmg = Math.max(1, Math.floor(poisonDmg / 2));
							this.lives -= poisonDmg;
							g_visualEffects.push(createExplosionEffect(this.xPos + this.width/2, this.yPos + this.height/2, "#32CD32", 4));
						}
					}
					if (this.slowTimer > 0) this.slowTimer--;
					if (this.shockTimer > 0) this.shockTimer--;
					
					if (this.lives <= 0) {
						this.alive = false;
						AddScore((this.type === "skull") ? 3000 : 1000);
						var bossXp = (this.type === "cactus") ? 1000 : ((this.type === "skull") ? 2000 : (100 + (this.level - 1) * 30));
						GhostRPG.addXp(bossXp);
						if (this.type === "skull") {
							spawnCave1Diamonds();
						}
						if (window.RollEnemyDrop) {
							window.RollEnemyDrop(g_currentLevel);
						}
						return;
					}
					
					// Demon Fly & Slime Spectral Spark shooting logic (can fire even if slow but not shock)
					if ((this.type === "demon_fly" || this.type === "slime") && this.alive && this.shockTimer <= 0) {
						if (this.shootCooldown > 0) {
							this.shootCooldown--;
						} else {
							if (Math.random() < 0.015) { // ~1.5% chance per frame after cooldown
								this.shootCooldown = 90; // 1.5 seconds cooldown
								var projDir = (DeSoGhost.xPos > this.xPos) ? 1 : -1;
								var startX = this.xPos + this.width / 2;
								var startY = this.yPos + this.height / 2;
								var vx = 6 * projDir;
								var vy = 0;
								var p = obtainProjectile(startX, startY, vx, vy, "spark", 0, 8, 8, 100, 0, false);
								p.isEnemy = true;
								g_projectiles.push(p);
								g_visualEffects.push(createExplosionEffect(startX, startY, "#00FFFF", 4));
							}
						}
					}
					
					// Skull boss Plasma Orb shooting logic (can fire even if slow but not shock)
					if (this.type === "skull" && this.alive && this.shockTimer <= 0) {
						if (this.shootCooldown > 0) {
							this.shootCooldown--;
						} else {
							if (Math.random() < 0.012) { // ~1.2% chance per frame (~2 seconds interval on average)
								this.shootCooldown = 120; // 2 seconds cooldown
								var projDir = (DeSoGhost.xPos > this.xPos) ? 1 : -1;
								var startX = this.xPos + this.width / 2;
								var startY = this.yPos + this.height / 2;
								var vx = 4.5 * projDir; // Speed matching a heavy plasma orb
								var vy = 0;
								var p = obtainProjectile(startX, startY, vx, vy, "orb", 0, 20, 20, 150, 0, true);
								p.isEnemy = true;
								g_projectiles.push(p);
								g_visualEffects.push(createExplosionEffect(startX, startY, "#D500F9", 6));
							}
						}
					}

					if (this.shockTimer > 0) return; // stunned, skip movement
					
					var currentSpeed = this.speed;
					if (this.slowTimer > 0) currentSpeed *= 0.5; // 50% slow
					
					this.xPos += currentSpeed * this.dir;
					if (this.xPos > this.maxX || this.xPos < this.minX) this.dir *= -1;
					if (this.xPos < 0) { this.xPos = 0; this.dir = 1; }
					var maxLimit = 2400 - this.width;
					if (this.xPos > maxLimit) { this.xPos = maxLimit; this.dir = -1; }
				};

			}

			function c_DeSoGhost(l_x, l_y) {
				this.xPos = l_x; this.yPos = l_y;
				this.lives = 3; this.face = 1;
				this.collectedLives = 0;
				this.collectedBlueDiamonds = 0;
				this.pendingLivesLoss = 1;

				this.acceleration = [0, 0, 6.5, 6, 5.5, 5, 4.5, 4, 3.5, 3, 2.5, 2, 2, 1.5, 1.5, 0.75, 0.75, 0.5, 0.5, 0.5, 0.25, 0.25, 0, 0];
				this.jumpCounter = 0; this.jumpNum = 0;
				this.jumpsPerformed = 0; this.jumpPressed = false;
				this.moveLeft = false; this.moveRight = false; this.jump = false;
				this.ghostMode = false;
				this.alive = true; this.speed = 3;
				this.mana = 100; this.maxMana = 100;
				this.isLevelingUpAnim = 0;
				this.skillCooldowns = [0, 0, 0, 0];
				this.phantomFormTimer = 0;

				this.draw = function () {
					if (this.alive) {
						if (this.ghostMode) g_ctx.globalAlpha = 0.5;
						
						// Pink aura if Phantom Form active
						if (this.phantomFormTimer > 0) {
							g_ctx.strokeStyle = "#FF00FF";
							g_ctx.lineWidth = 2;
							g_ctx.beginPath();
							g_ctx.arc(this.xPos + 12 + map_offset, this.yPos + 12, 18, 0, Math.PI * 2);
							g_ctx.stroke();
						}
						
						var sprite = (this.face == 1) ? desoGhostRight : desoGhostLeft;
						g_ctx.drawImage(sprite, this.xPos + map_offset, this.yPos, 24, 24);
						if (this.ghostMode) g_ctx.globalAlpha = 1.0;

						// Renderização da animação de Level Up
						if (this.isLevelingUpAnim && this.isLevelingUpAnim > 0) {
							g_ctx.fillStyle = (Math.floor(Date.now() / 100) % 2 === 0) ? "#FFFF00" : "#00FF00";
							g_ctx.font = "bold 11px 'Courier New'";
							g_ctx.textAlign = "center";
							g_ctx.fillText("⚡ LEVEL UP! +5 AP ⚡", this.xPos + 12 + map_offset, this.yPos - 12);
							g_ctx.textAlign = "start";
							this.isLevelingUpAnim--;
						}
					} else {
						if (explosionFrame < explosionFrames.length) {
							g_ctx.drawImage(explosionFrames[explosionFrame], this.xPos + map_offset, this.yPos, 24, 24);
							if (g_count % 5 == 0) explosionFrame++;
						} else {
							this.respawn();
						}
					}
				};

				this.respawn = function () {
					var loss = this.pendingLivesLoss || 1;
					if (this.lives <= 0) {
						SetGameState(G_GAMEOVER);
						return;
					}
					this.lives -= loss;
					this.pendingLivesLoss = 1; // reset to default
					if (this.lives < 0) {
						SetGameState(G_GAMEOVER);
						return;
					}
					g_projectiles = [];
					g_visualEffects = [];
					this.skillCooldowns = [0, 0, 0, 0];
					this.phantomFormTimer = 0;
					this.ghostMode = false;
					this.alive = true; this.xPos = 48; this.yPos = 150;
					explosionFrame = 0; map_offset = 0;
					map.loadLevel(g_currentLevel);

					// Clampa as vidas atuais pelo teto dinâmico de Vitalidade (sem bônus de ressurreição no respawn)
					var maxLivesCap = GhostRPG.getMaxLivesCap();
					this.lives = Math.max(0, Math.min(maxLivesCap, this.lives));
				};

				this.move = function () {
					if (!this.alive) return;

					// Update skill cooldowns
					for (var s = 0; s < 4; s++) {
						if (this.skillCooldowns[s] > 0) this.skillCooldowns[s]--;
					}
					// Update Phantom Form timer
					if (this.phantomFormTimer > 0) this.phantomFormTimer--;

					// Physical attributes updates
					var baseSpeed = (this.phantomFormTimer > 0) ? 4.8 : 3; // 60% speed bonus during Phantom Form
					this.speed = GhostRPG.getModifiedSpeed(baseSpeed);
					var baseJumpAcceleration = [0, 0, 6.5, 6, 5.5, 5, 4.5, 4, 3.5, 3, 2.5, 2, 2, 1.5, 1.5, 0.75, 0.75, 0.5, 0.5, 0.5, 0.25, 0.25, 0, 0];
					this.acceleration = GhostRPG.getModifiedJumpAcceleration(baseJumpAcceleration);

					// Mana management
					var stats = GhostRPG.getStats();
					this.maxMana = GhostRPG.getMaxMana();
					if (this.ghostMode && this.alive) {
						var consumeRate = Math.max(0.5, 3 - (stats.int * 0.15));
						this.mana -= consumeRate;
						if (this.mana <= 0) {
							this.mana = 0;
							this.ghostMode = false;
						}
					} else if (this.alive) {
						var regenRate = 0.001 + (stats.int * 0.10);
						this.mana = Math.min(this.maxMana, this.mana + regenRate);
					}

					// Collision with Bosses
					if (typeof g_bosses !== 'undefined') {
						var self = this;
						g_bosses.forEach(function(boss) {
							if (boss && boss.alive) {
								if (self.xPos + 20 > boss.xPos && self.xPos + 4 < boss.xPos + boss.width &&
									self.yPos + 24 > boss.yPos && self.yPos < boss.yPos + boss.height) {
									if (self.jumpNum == 2 && (self.yPos + 24) < (boss.yPos + boss.height / 2)) {
										var dmg = GhostRPG.getBossJumpDamage();
										var finalDmg = dmg;
										if (boss.level > 1) {
											var reduction = Math.min(0.70, (boss.level - 1) * 0.04);
											finalDmg = Math.max(1, Math.floor(dmg * (1 - reduction)));
										}
										if (boss.type === "demon_fly" || boss.type === "slime") {
											finalDmg = Math.max(1, Math.floor(finalDmg / 2));
										}

										boss.lives -= finalDmg;

										self.jumpNum = 1; self.jumpCounter = 2;
										if (boss.lives <= 0) { 
											var deadBossType = boss.type;
											var deadBossLevel = boss.level;
											boss.alive = false; 
											AddScore((deadBossType === "skull") ? 3000 : 1000); 
											var bossXp = (deadBossType === "cactus") ? 1000 : ((deadBossType === "skull") ? 2000 : (100 + (deadBossLevel - 1) * 30));
											GhostRPG.addXp(bossXp); 
											if (deadBossType === "skull") {
												spawnCave1Diamonds();
											}
										}
									} else if (!self.ghostMode && self.phantomFormTimer <= 0) { // Immune during Phantom Form
										self.pendingLivesLoss = getPhaseMultiplier(g_currentLevel);
										self.alive = false;
									}
								}
							}
						});
					} else if (g_boss && g_boss.alive) {
						if (this.xPos + 20 > g_boss.xPos && this.xPos + 4 < g_boss.xPos + g_boss.width &&
							this.yPos + 24 > g_boss.yPos && this.yPos < g_boss.yPos + g_boss.height) {
							if (this.jumpNum == 2 && (this.yPos + 24) < (g_boss.yPos + g_boss.height / 2)) {
								var dmg = GhostRPG.getBossJumpDamage();
								var finalDmg = dmg;
								if (g_boss.level > 1) {
									var reduction = Math.min(0.70, (g_boss.level - 1) * 0.04);
									finalDmg = Math.max(1, Math.floor(dmg * (1 - reduction)));
								}
								if (g_boss.type === "demon_fly" || g_boss.type === "slime") {
									finalDmg = Math.max(1, Math.floor(finalDmg / 2));
								}

								g_boss.lives -= finalDmg;

								this.jumpNum = 1; this.jumpCounter = 2;
								if (g_boss.lives <= 0) { 
									var deadBossType = g_boss.type;
									var deadBossLevel = g_boss.level;
									g_boss.alive = false; 
									AddScore((deadBossType === "skull") ? 3000 : 1000); 
									var bossXp = (deadBossType === "cactus") ? 1000 : ((deadBossType === "skull") ? 2000 : (100 + (deadBossLevel - 1) * 30));
									GhostRPG.addXp(bossXp); 
									if (deadBossType === "skull") {
										spawnCave1Diamonds();
									}
									if (window.RollEnemyDrop) {
										window.RollEnemyDrop(g_currentLevel);
									}
								}
							} else if (!this.ghostMode && this.phantomFormTimer <= 0) { // Immune during Phantom Form
								this.pendingLivesLoss = getPhaseMultiplier(g_currentLevel);
								this.alive = false;
							}
						}
					}

					var dx = 0;
					if (this.moveLeft) { dx = -this.speed; this.face = 2; }
					if (this.moveRight) { dx = this.speed; this.face = 1; }

					if (this.jump) {
						if (!this.jumpPressed) {
							if (this.jumpsPerformed < 3) {
								this.jumpNum = 1; this.jumpCounter = 2;
								this.jumpsPerformed++;
							}
							this.jumpPressed = true;
						}
					} else {
						this.jumpPressed = false;
					}

					var prevX = this.xPos;
					var prevY = this.yPos;
					this.xPos += dx;
					if (this.xPos < 0) this.xPos = 0;
					if (this.xPos > 100 * 24 - 24) this.xPos = 100 * 24 - 24; // Limitador à direita (2376px)

					var ty = determinePos(this.yPos + 4), by = determinePos(this.yPos + 20);
					var cx = (dx > 0) ? determinePos(this.xPos + 22) : determinePos(this.xPos + 2);
					if (ty >= 0 && ty < 11 && cx >= 0 && cx < 100) {
						var t1 = map.bitmap[ty][cx], t2 = map.bitmap[by][cx];
						var s1 = (t1 == 1 || t1 == 2 || t1 == 13 || t1 == 14 || t1 == 15 || t1 == 19);
						var s2 = (t2 == 1 || t2 == 2 || t2 == 13 || t2 == 14 || t2 == 15 || t2 == 19);
						if (!this.ghostMode && (s1 || s2)) this.xPos = prevX;

						if (!this.ghostMode) {
							g_tempGhostRect.l = this.xPos + 4;
							g_tempGhostRect.r = this.xPos + 20;
							g_tempGhostRect.t = this.yPos;
							g_tempGhostRect.b = this.yPos + 23;
							for (var isl = 0; isl < g_activeIslands.length; isl++) {
								var island = g_activeIslands[isl];
								if (island.state == 'falling') continue;
								g_tempIslandRect.l = island.x;
								g_tempIslandRect.r = island.x + island.w;
								g_tempIslandRect.t = island.y - island.visualYOffset;
								g_tempIslandRect.b = island.y - island.visualYOffset + island.h;
								if (g_tempGhostRect.r > g_tempIslandRect.l && g_tempGhostRect.l < g_tempIslandRect.r && g_tempGhostRect.b > g_tempIslandRect.t && g_tempGhostRect.t < g_tempIslandRect.b) {
									this.xPos = prevX;
								}
							}
						}
					}

					if (this.jumpNum == 1) {
						this.yPos -= this.acceleration[this.jumpCounter];
						if (++this.jumpCounter >= this.acceleration.length) this.jumpNum = 2;
					} else {
						this.yPos += 5;
					}

					var cl = determinePos(this.xPos + 4), cr = determinePos(this.xPos + 20);
					var ct = determinePos(this.yPos), cb = determinePos(this.yPos + 23);

					if (cb >= 11) { this.alive = false; return; }

					var nodes = [cl, cr];
					for (var i = 0; i < nodes.length; i++) {
						var c = nodes[i];
						if (c < 0 || c >= 100) continue;

						if (!this.ghostMode && ct >= 0 && (map.bitmap[ct][c] == 1 || map.bitmap[ct][c] == 2 || map.bitmap[ct][c] == 13 || map.bitmap[ct][c] == 14 || map.bitmap[ct][c] == 15 || map.bitmap[ct][c] == 19)) {
							this.yPos = (ct + 1) * 24;
							if (this.jumpNum == 1) this.jumpNum = 2;
						}
						if (!this.ghostMode && cb >= 0 && cb < 11 && (map.bitmap[cb][c] == 1 || map.bitmap[cb][c] == 2 || map.bitmap[cb][c] == 13 || map.bitmap[cb][c] == 14 || map.bitmap[cb][c] == 15 || map.bitmap[cb][c] == 19)) {
							this.yPos = (cb - 1) * 24;
							this.jumpNum = 0; this.jumpCounter = 0;
							this.jumpsPerformed = 0;
						}
						if (this.phantomFormTimer <= 0) {
							if (ct >= 0 && ct < 11 && (map.bitmap[ct][c] == 5 || map.bitmap[ct][c] == 6)) this.alive = false;
							if (cb >= 0 && cb < 11 && (map.bitmap[cb][c] == 5 || map.bitmap[cb][c] == 6)) this.alive = false;
						}

						if (ct >= 0 && ct < 11 && map.bitmap[ct][c] == 4 && this.jump) {
							if (g_boss && g_boss.alive && g_boss.isOriginal) { /* Locked */ } else { this.nextLevel(); }
						}
						if (cb >= 0 && cb < 11 && map.bitmap[cb][c] == 4 && this.jump) {
							if (g_boss && g_boss.alive && g_boss.isOriginal) { /* Locked */ } else { this.nextLevel(); }
						}
						if (ct >= 0 && ct < 11 && map.bitmap[ct][c] == 21 && this.jump) {
							this.prevLevel();
						}
						if (cb >= 0 && cb < 11 && map.bitmap[cb][c] == 21 && this.jump) {
							this.prevLevel();
						}
						if (((ct >= 0 && ct < 11 && map.bitmap[ct][c] == 22) || (cb >= 0 && cb < 11 && map.bitmap[cb][c] == 22)) && this.jump) {
							if (window.HasInventoryItem && window.HasInventoryItem("blue_key")) {
								window.RemoveInventoryItem("blue_key");
								g_currentLevel = "cave1";
								this.xPos = 48; this.yPos = 150; map_offset = 0;
								g_projectiles = [];
								g_visualEffects = [];
								this.phantomFormTimer = 0;
								this.skillCooldowns = [0, 0, 0, 0];
								map.loadLevel(g_currentLevel);
								this.jump = false;
							} else {
								alert("🔒 This door is locked! You need the Blue Key to enter CAVE1.");
								this.jump = false;
							}
						}


						var tiles = [ct, cb];
						for (var t = 0; t < tiles.length; t++) {
							var r = tiles[t];
							if (r >= 0 && r < 11) {
								var tile = map.bitmap[r][c];
								if ((tile >= 7 && tile <= 12) || tile == 23 || tile == 24) {
									if (tile == 7) { AddScore(50); }
									else if (tile == 8) {
										AddScore(100);
										this.collectedBlueDiamonds = (this.collectedBlueDiamonds || 0) + 1;
										if (this.collectedBlueDiamonds % 3 === 0) {
											SpawnBossAtRandomLocation("demon_fly");
										}
									}

									else if (tile == 9) { AddScore(150); }
									else if (tile == 10) { AddScore(150); }
									else if (tile == 11) { AddScore(150); }
									else if (tile == 12) {
										var maxLivesCap = GhostRPG.getMaxLivesCap();
										if (this.lives < maxLivesCap) {
											this.lives++;
										}
										AddScore(666);
										this.collectedLives = (this.collectedLives || 0) + 1;
										if (this.collectedLives % 3 === 0) {
											SpawnBossAtRandomLocation();
										}
									}
									else if (tile == 23) {
										if (window.AddInventoryItem) {
											window.AddInventoryItem("blue_key", "Blue Key", "<img src='assets/sprites/Blue key (1).webp' style='width:24px;height:24px;image-rendering:pixelated;vertical-align:middle;' />", "Unlocks CAVE1", 1);
										}
										AddScore(300);
									}
									else if (tile == 24) {
										if (window.AddInventoryItem) {
											window.AddInventoryItem("ghost_spell", "Fireball", "🔥", "Active fireball spell. Equip to cast by pressing '1'.", 3);
										}
										AddScore(300);
									}
									map.bitmap[r][c] = 0;
								}
							}
						}
					}
					
					if (!this.ghostMode) {
						g_tempGhostRect.l = this.xPos + 4;
						g_tempGhostRect.r = this.xPos + 20;
						g_tempGhostRect.t = this.yPos;
						g_tempGhostRect.b = this.yPos + 23;
						for (var isl = 0; isl < g_activeIslands.length; isl++) {
							var island = g_activeIslands[isl];
							if (island.state == 'falling') continue;
							g_tempIslandRect.l = island.x;
							g_tempIslandRect.r = island.x + island.w;
							g_tempIslandRect.t = island.y - island.visualYOffset;
							g_tempIslandRect.b = island.y - island.visualYOffset + island.h;
							
							if (g_tempGhostRect.r > g_tempIslandRect.l && g_tempGhostRect.l < g_tempIslandRect.r) {
								if (prevY + 23 <= g_tempIslandRect.t && g_tempGhostRect.b >= g_tempIslandRect.t) {
									this.yPos = g_tempIslandRect.t - 24;
									this.jumpNum = 0; this.jumpCounter = 0; this.jumpsPerformed = 0;
									if (island.state == 'idle') island.state = 'countdown';
								} else if (this.jumpNum == 1 && prevY >= g_tempIslandRect.b && g_tempGhostRect.t <= g_tempIslandRect.b) {
									this.yPos = g_tempIslandRect.b;
									this.jumpNum = 2;
								}
							}
						}
					}

					if (this.xPos > 200) {
						map_offset = -(this.xPos - 200);
						var maxOffset = -(100 * 24 - 640); // -1760 pixels
						if (map_offset < maxOffset) map_offset = maxOffset;
					}
				};

				this.nextLevel = function () {
					if (window.g_completedLevels) {
						window.g_completedLevels[g_currentLevel] = true;
					}
					g_doorsUsed++;
					if (g_currentLevel === "cave1") {
						g_currentLevel = 4;
					} else {
						if (g_currentLevel >= 33) { 
							g_globalTotalTime = Math.floor((Date.now() - g_globalStartTime) / 1000);
							StartEndCutscene();
							return; 
						}
						g_currentLevel++;
					}
					if (window.g_completedLevels) {
						window.g_completedLevels[g_currentLevel] = true;
					}
					this.xPos = 48; this.yPos = 150; map_offset = 0;
					
					// Clean spells and state
					g_projectiles = [];
					g_visualEffects = [];
					this.phantomFormTimer = 0;
					this.skillCooldowns = [0, 0, 0, 0];
					if (typeof g_bosses !== 'undefined') {
						g_bosses.forEach(function(b) {
							if (b) {
								b.burnTicks = 0; b.poisonTicks = 0;
								b.slowTimer = 0; b.shockTimer = 0;
							}
						});
					} else if (g_boss) {
						g_boss.burnTicks = 0; g_boss.poisonTicks = 0;
						g_boss.slowTimer = 0; g_boss.shockTimer = 0;
					}

					map.loadLevel(g_currentLevel);
					this.jump = false; this.jumpNum = 0;
					if (window.gameEventBus) {
						window.gameEventBus.emit('level_completed', { level: g_currentLevel, stats: GhostRPG.getStats() });
					}
				};

				this.prevLevel = function () {
					if (g_currentLevel === "cave1") {
						g_currentLevel = 3;
					} else {
						if (g_currentLevel <= 1) return;
						g_currentLevel--;
					}
					if (g_doorsUsed > 0) g_doorsUsed--;
					if (window.g_completedLevels) {
						window.g_completedLevels[g_currentLevel] = true;
					}
					this.xPos = 48; this.yPos = 150; map_offset = 0;
					
					// Clean spells and state
					g_projectiles = [];
					g_visualEffects = [];
					this.phantomFormTimer = 0;
					this.skillCooldowns = [0, 0, 0, 0];
					if (typeof g_bosses !== 'undefined') {
						g_bosses.forEach(function(b) {
							if (b) {
								b.burnTicks = 0; b.poisonTicks = 0;
								b.slowTimer = 0; b.shockTimer = 0;
							}
						});
					} else if (g_boss) {
						g_boss.burnTicks = 0; g_boss.poisonTicks = 0;
						g_boss.slowTimer = 0; g_boss.shockTimer = 0;
					}

					map.loadLevel(g_currentLevel);
					this.jump = false; this.jumpNum = 0;
				};

			}

			function useSlotSkill(slotIndex) {
				if (!DeSoGhost.alive || g_gameState !== G_PLAY) return;
				if (!DeSoGhost.skillCooldowns) DeSoGhost.skillCooldowns = [0, 0, 0, 0];
				if (DeSoGhost.skillCooldowns[slotIndex] > 0) return;

				var stats = GhostRPG.getStats();
				var skillId = stats.equippedSkills[slotIndex];
				var runeId = stats.equippedRunes[slotIndex];

				if (skillId === 0) { // Spectral Spark (V)
					fireProjectile("spark", runeId);
					DeSoGhost.skillCooldowns[slotIndex] = 15; // 0.5s cooldown
				}
				else if (skillId === 1) { // Ghost Mode (F)
					if (DeSoGhost.mana >= 10) {
						DeSoGhost.ghostMode = !DeSoGhost.ghostMode;
					}
				}
				else if (skillId === 2) { // Plasma Orb (E)
					var manaCost = 30;
					if (DeSoGhost.mana >= manaCost) {
						DeSoGhost.mana -= manaCost;
						fireProjectile("orb", runeId);
						DeSoGhost.skillCooldowns[slotIndex] = 45; // 1.5s cooldown
					}
				}
				else if (skillId === 3) { // Phantom Form (R)
					var manaCost = 50;
					if (DeSoGhost.mana >= manaCost) {
						DeSoGhost.mana -= manaCost;
						DeSoGhost.phantomFormTimer = 150; // 5s duration
						DeSoGhost.skillCooldowns[slotIndex] = 450; // 15s cooldown
						g_visualEffects.push({
							type: "expand",
							x: DeSoGhost.xPos + 12,
							y: DeSoGhost.yPos + 12,
							color: "#FF00FF",
							radius: 20,
							maxRadius: 50,
							life: 15,
							maxLife: 15
						});
					}
				}
			}

			function fireProjectile(type, runeId) {
				var stats = GhostRPG.getStats();
				var weaponDmg = stats.weapon.damage;
				var direction = DeSoGhost.face === 1 ? 1 : -1;
				var startX = DeSoGhost.xPos + 12;
				var startY = DeSoGhost.yPos + 12;

				var vx = (type === "spark" ? 8 : 3.5) * direction;
				var vy = 0;
				var width = type === "spark" ? 8 : 20;
				var height = type === "spark" ? 8 : 20;
				var life = type === "spark" ? 60 : 120;
				var penetrates = type === "orb";

				var p = obtainProjectile(startX, startY, vx, vy, type, runeId, width, height, life, 0, penetrates);

				if (type === "spark") {
					p.damage = Math.floor(weaponDmg * 0.8);
				} else {
					p.damage = Math.floor(weaponDmg * 2.2);
				}

				if (runeId === 5) {
					p.damage = Math.floor(p.damage * 1.4); // Arcane rune (+40% dmg)
				}

				g_projectiles.push(p);
			}

			function createExplosionEffect(x, y, color, particleCount) {
				return obtainExplosionEffect(x, y, color, particleCount);
			}

			function updateProjectiles() {
				var stats = GhostRPG.getStats();
				for (var i = g_projectiles.length - 1; i >= 0; i--) {
					var p = g_projectiles[i];
					p.x += p.vx;
					p.y += p.vy;
					p.life--;

					var screenX = p.x + map_offset;

					if (p.life <= 0 || screenX < -50 || screenX > 700) {
						g_projectiles.splice(i, 1);
						continue;
					}

					if (p.isEnemy) {
						if (DeSoGhost.alive) {
							if (p.x + p.width/2 > DeSoGhost.xPos && p.x - p.width/2 < DeSoGhost.xPos + 24 &&
								p.y + p.height/2 > DeSoGhost.yPos && p.y - p.height/2 < DeSoGhost.yPos + 24) {
								if (!DeSoGhost.ghostMode && DeSoGhost.phantomFormTimer <= 0) {
									DeSoGhost.pendingLivesLoss = getPhaseMultiplier(g_currentLevel);
									DeSoGhost.alive = false;
								}
								g_visualEffects.push(createExplosionEffect(p.x, p.y, "#FF3366", 6));
								g_projectiles.splice(i, 1);
								continue;
							}
						}
					} else {
						if (typeof g_bosses !== 'undefined') {
							var hitSomething = false;
							for (var bIdx = 0; bIdx < g_bosses.length; bIdx++) {
								var boss = g_bosses[bIdx];
								if (boss && boss.alive) {
									if (p.x + p.width/2 > boss.xPos && p.x - p.width/2 < boss.xPos + boss.width &&
										p.y + p.height/2 > boss.yPos && p.y - p.height/2 < boss.yPos + boss.height) {

										var canHit = true;
										if (p.penetrates) {
											var lastHitTime = p.hits[boss.xPos + "_" + boss.yPos] || 0;
											if (g_count - lastHitTime < 10 && lastHitTime !== 0) {
												canHit = false;
											}
										}

										if (canHit) {
											p.hits[boss.xPos + "_" + boss.yPos] = g_count;
											var finalDmg = p.damage;
											if (boss.level > 1) {
												var reduction = Math.min(0.70, (boss.level - 1) * 0.04);
												finalDmg = Math.max(1, Math.floor(p.damage * (1 - reduction)));
											}
											if (boss.type === "demon_fly" || boss.type === "slime") {
												finalDmg = Math.max(1, Math.floor(finalDmg / 2));
											}
											if (boss.type === "skull" && p.type === "orb") {
												finalDmg = Math.max(1, Math.floor(finalDmg * 0.20));
											}
											if (p.type === "spell_fireball") {
												finalDmg = boss.lives;
											} else if (p.type === "spell_ice") {
												boss.slowTimer = 180;
											} else if (p.type === "spell_wood") {
												boss.poisonTicks = 300;
											}
											boss.lives -= finalDmg;

											var color = "#00FFFF";
											if (p.type === "spell_ice") color = "#00E5FF";
											else if (p.type === "spell_wood") color = "#00E676";
											else if (p.runeId === 1) color = "#FF4500";
											else if (p.runeId === 2) color = "#00E5FF";
											else if (p.runeId === 3) color = "#FFEA00";
											else if (p.runeId === 4) color = "#00E676";
											else if (p.runeId === 5) color = "#D500F9";

											if (p.type === "spark") {
												var genAmount = 15 + Math.floor(stats.int * 0.5);
												DeSoGhost.mana = Math.min(DeSoGhost.maxMana, DeSoGhost.mana + genAmount);
											}

											applyRuneEffectsToBoss(boss, p.runeId);
											g_visualEffects.push(createExplosionEffect(p.x, p.y, color, (p.type === "spark" ? 5 : 10)));

											if (boss.lives <= 0) {
												var deadBossType = boss.type;
												var deadBossLevel = boss.level;
												boss.alive = false;
												AddScore((deadBossType === "skull") ? 3000 : 1000);
												var bossXp = (deadBossType === "cactus") ? 1000 : ((deadBossType === "skull") ? 2000 : (100 + (deadBossLevel - 1) * 30));
												GhostRPG.addXp(bossXp);
												if (deadBossType === "skull") {
													spawnCave1Diamonds();
												}
												if (window.RollEnemyDrop) {
													window.RollEnemyDrop(g_currentLevel);
												}
											}

											if (!p.penetrates) {
												hitSomething = true;
												break;
											}
										}
									}
								}
							}
							if (hitSomething) {
								g_projectiles.splice(i, 1);
								continue;
							}
						} else if (g_boss && g_boss.alive) {
							if (p.x + p.width/2 > g_boss.xPos && p.x - p.width/2 < g_boss.xPos + g_boss.width &&
								p.y + p.height/2 > g_boss.yPos && p.y - p.height/2 < g_boss.yPos + g_boss.height) {

								var canHit = true;
								if (p.penetrates) {
									var lastHitTime = p.hits[g_boss.xPos + "_" + g_boss.yPos] || 0;
									if (g_count - lastHitTime < 10 && lastHitTime !== 0) {
										canHit = false;
									}
								}

								if (canHit) {
									p.hits[g_boss.xPos + "_" + g_boss.yPos] = g_count;
									var finalDmg = p.damage;
									if (g_boss.level > 1) {
										var reduction = Math.min(0.70, (g_boss.level - 1) * 0.04);
										finalDmg = Math.max(1, Math.floor(p.damage * (1 - reduction)));
									}
									if (g_boss.type === "demon_fly" || g_boss.type === "slime") {
										finalDmg = Math.max(1, Math.floor(finalDmg / 2));
									}
									if (g_boss.type === "skull" && p.type === "orb") {
										finalDmg = Math.max(1, Math.floor(finalDmg * 0.20));
									}
									if (p.type === "spell_fireball") {
										finalDmg = g_boss.lives;
									} else if (p.type === "spell_ice") {
										g_boss.slowTimer = 180;
									} else if (p.type === "spell_wood") {
										g_boss.poisonTicks = 300;
									}
									g_boss.lives -= finalDmg;

									var color = "#00FFFF";
									if (p.type === "spell_ice") color = "#00E5FF";
									else if (p.type === "spell_wood") color = "#00E676";
									else if (p.runeId === 1) color = "#FF4500";
									else if (p.runeId === 2) color = "#00E5FF";
									else if (p.runeId === 3) color = "#FFEA00";
									else if (p.runeId === 4) color = "#00E676";
									else if (p.runeId === 5) color = "#D500F9";

									if (p.type === "spark") {
										var genAmount = 15 + Math.floor(stats.int * 0.5);
										DeSoGhost.mana = Math.min(DeSoGhost.maxMana, DeSoGhost.mana + genAmount);
									}

									applyRuneEffectsToBoss(g_boss, p.runeId);
									g_visualEffects.push(createExplosionEffect(p.x, p.y, color, (p.type === "spark" ? 5 : 10)));

									if (g_boss.lives <= 0) {
										var deadBossType = g_boss.type;
										var deadBossLevel = g_boss.level;
										g_boss.alive = false;
										AddScore((deadBossType === "skull") ? 3000 : 1000);
										var bossXp = (deadBossType === "cactus") ? 1000 : ((deadBossType === "skull") ? 2000 : (100 + (deadBossLevel - 1) * 30));
										GhostRPG.addXp(bossXp);
										if (deadBossType === "skull") {
											spawnCave1Diamonds();
										}
										if (window.RollEnemyDrop) {
											window.RollEnemyDrop(g_currentLevel);
										}
									}

									if (!p.penetrates) {
										g_projectiles.splice(i, 1);
										continue;
									}
								}
							}
						}
					}
				}
			}


			function drawProjectiles() {
				for (var i = 0; i < g_projectiles.length; i++) {
					var p = g_projectiles[i];
					var screenX = p.x + map_offset;
					if (p.isEnemy) {
						g_ctx.fillStyle = "#FF3366";
						g_ctx.beginPath();
						g_ctx.arc(screenX, p.y, p.width / 2, 0, Math.PI * 2);
						g_ctx.fill();
						continue;
					}
					var color = "#00FFFF";
					if (p.type === "spell_fireball") {
						var img = (p.vx >= 0) ? fireballRightImg : fireballLeftImg;
						g_ctx.drawImage(img, screenX - p.width / 2, p.y - p.height / 2, p.width, p.height);
					} else if (p.type === "spell_ice") {
						g_ctx.fillStyle = "#00E5FF";
						g_ctx.beginPath();
						g_ctx.arc(screenX, p.y, p.width / 2, 0, Math.PI * 2);
						g_ctx.fill();
						g_ctx.strokeStyle = "rgba(0, 229, 255, 0.5)";
						g_ctx.lineWidth = 2;
						g_ctx.stroke();
					} else if (p.type === "spell_wood") {
						g_ctx.fillStyle = "#00E676";
						g_ctx.beginPath();
						g_ctx.arc(screenX, p.y, p.width / 2, 0, Math.PI * 2);
						g_ctx.fill();
						g_ctx.strokeStyle = "rgba(0, 230, 118, 0.5)";
						g_ctx.lineWidth = 2;
						g_ctx.stroke();
					} else if (p.type === "spark") {

						if (p.runeId === 1) color = "#FF4500";
						else if (p.runeId === 2) color = "#00E5FF";
						else if (p.runeId === 3) color = "#FFEA00";
						else if (p.runeId === 4) color = "#00E676";
						else if (p.runeId === 5) color = "#D500F9";

						g_ctx.fillStyle = color;
						g_ctx.beginPath();
						g_ctx.arc(screenX, p.y, p.width / 2, 0, Math.PI * 2);
						g_ctx.fill();
					} else {
						if (p.runeId === 1) color = "rgba(255, 69, 0, 0.7)";
						else if (p.runeId === 2) color = "rgba(0, 229, 255, 0.7)";
						else if (p.runeId === 3) color = "rgba(255, 234, 0, 0.7)";
						else if (p.runeId === 4) color = "rgba(0, 230, 118, 0.7)";
						else if (p.runeId === 5) color = "rgba(213, 0, 249, 0.7)";

						g_ctx.fillStyle = color;
						g_ctx.beginPath();
						g_ctx.arc(screenX, p.y, p.width / 2, 0, Math.PI * 2);
						g_ctx.fill();
						g_ctx.strokeStyle = "#FFFFFF";
						g_ctx.lineWidth = 1.5;
						g_ctx.stroke();
					}
				}
			}

			function applyRuneEffectsToBoss(boss, runeId) {
				if (runeId === 1) boss.burnTicks = 150;
				else if (runeId === 2) boss.slowTimer = 200;
				else if (runeId === 3) boss.shockTimer = Math.random() < 0.40 ? 60 : 20;
				else if (runeId === 4) boss.poisonTicks = 240;
			}

			function updateVisualEffects() {
				for (var i = g_visualEffects.length - 1; i >= 0; i--) {
					var fx = g_visualEffects[i];
					fx.life--;
					if (fx.life <= 0) {
						g_visualEffects.splice(i, 1);
						continue;
					}

					if (fx.type === "explosion") {
						for (var p = 0; p < fx.particles.length; p++) {
							var pt = fx.particles[p];
							pt.x += pt.vx;
							pt.y += pt.vy;
						}
					}
				}
			}

			function drawVisualEffects() {
				for (var i = 0; i < g_visualEffects.length; i++) {
					var fx = g_visualEffects[i];
					var screenX = fx.x + map_offset;
					if (fx.type === "explosion") {
						for (var p = 0; p < fx.particles.length; p++) {
							var pt = fx.particles[p];
							g_ctx.fillStyle = pt.color;
							g_ctx.globalAlpha = fx.life / fx.maxLife;
							g_ctx.fillRect(screenX + pt.x, fx.y + pt.y, pt.size, pt.size);
						}
						g_ctx.globalAlpha = 1.0;
					} else if (fx.type === "expand") {
						g_ctx.strokeStyle = fx.color;
						g_ctx.globalAlpha = fx.life / fx.maxLife;
						g_ctx.lineWidth = 2;
						var radius = fx.radius + (1 - fx.life / fx.maxLife) * (fx.maxRadius - fx.radius);
						g_ctx.beginPath();
						g_ctx.arc(screenX, fx.y, radius, 0, Math.PI * 2);
						g_ctx.stroke();
						g_ctx.globalAlpha = 1.0;
					}
				}
			}

			function updateBinaryBackground(isStartScreen) {
				if (g_currentLevel != 26 && !isStartScreen) return;
				for (var i = 0; i < g_binaryBits.length; i++) {
					var b = g_binaryBits[i];
					b.y += b.speed;
					if (b.y > 300) { b.y = 0; b.x = Math.random() * 640; }
				}
			}

			function drawBinaryBackground(isStartScreen) {
				if (g_currentLevel != 26 && !isStartScreen) return;
				g_ctx.font = isStartScreen ? "bold 14px 'Courier New'" : "14px 'Courier New'";
				g_ctx.fillStyle = isStartScreen ? "#00FF00" : "#003800";
				for (var i = 0; i < g_binaryBits.length; i++) {
					var b = g_binaryBits[i];
					g_ctx.fillText(b.val, b.x, b.y);
				}
			}

			function UpdateAndDrawBinaryBackground(isStartScreen) {
				updateBinaryBackground(isStartScreen);
				drawBinaryBackground(isStartScreen);
			}

			function Print_HUD() {
				g_ctx.font = "bold 18px 'Courier New'"; g_ctx.fillStyle = "#FF00FF";
				
				// Nome e Vidas na parte de baixo do jogo
				g_ctx.fillText("DeSoGhost", 10, g_canvas.height - 10);
				g_ctx.drawImage(DeSoGhost_Lives, 110, g_canvas.height - 25, 24, 24);
				g_ctx.fillText("X " + DeSoGhost.lives, 140, g_canvas.height - 8);
				
				// Pontos e Nível no topo (Mudado para Roxo)
				g_ctx.fillStyle = "#FF00FF"; g_ctx.fillText("SCORE: " + g_score.toString().padStart(6, '0'), 10, 20);
				
				// Texto completo do Level com os dois pontos para alinhar perfeitamente com a fonte
				g_ctx.fillText("LEVEL : " + g_currentLevel, 200, 20);
				
				// Atualiza o cronômetro externo (TIME: MM:SS)
				var tr = g_timeRemaining < 0 ? 0 : g_timeRemaining;
				var mins = Math.floor(tr / 60);
				var secs = tr % 60;
				var timeStr = "TIME: " + mins.toString().padStart(2, '0') + ":" + secs.toString().padStart(2, '0');
				
				var extTimer = document.getElementById("externalTimer");
				if (extTimer) {
					extTimer.innerText = timeStr;
					if (tr <= 30) {
						extTimer.style.color = "#FF0000";
						extTimer.style.textShadow = "0 0 10px #FF0000";
					} else {
						extTimer.style.color = "#FFFFFF";
						extTimer.style.textShadow = "0 0 10px #FFFFFF";
					}
				}

				// Boss HUD health bar has been removed to only show above the enemy's head.
				
				// Arte Logo DeSo na parte de baixo, 2 vezes o tamanho do Ftasma (24 * 2 = 48)
				if (logoDesoImage.complete) {
					g_ctx.drawImage(logoDesoImage, g_canvas.width - 48 - 10, g_canvas.height - 48 - 10, 48, 48);
				}

				// Barra de Mana
				g_ctx.font = "bold 14px 'Courier New'"; g_ctx.fillStyle = "#00E5FF";
				g_ctx.fillText("MANA:", 200, g_canvas.height - 10);
				
				g_ctx.strokeStyle = "rgba(0, 229, 255, 0.4)";
				g_ctx.lineWidth = 1.5;
				g_ctx.strokeRect(250, g_canvas.height - 21, 120, 12);
				
				var fillWidth = DeSoGhost.maxMana > 0 ? (DeSoGhost.mana / DeSoGhost.maxMana) * 118 : 0;
				if (fillWidth > 0) {
					var grad = g_ctx.createLinearGradient(251, 0, 251 + fillWidth, 0);
					grad.addColorStop(0, "#0052D4");
					grad.addColorStop(0.5, "#4364F7");
					grad.addColorStop(1, "#6FB1FC");
					g_ctx.fillStyle = grad;
					g_ctx.fillRect(251, g_canvas.height - 20, fillWidth, 10);
				}
				
				g_ctx.font = "9px 'Courier New'"; g_ctx.fillStyle = "#FFFFFF";
				g_ctx.textAlign = "center";
				g_ctx.fillText(Math.floor(DeSoGhost.mana) + " / " + Math.floor(DeSoGhost.maxMana), 310, g_canvas.height - 12);
				
				// Draw HUD Quick Bar (4 Slots)
				var slotKeys = ["V", "F", "E", "R"];
				var stats = GhostRPG.getStats();
				if (!DeSoGhost.skillCooldowns) DeSoGhost.skillCooldowns = [0, 0, 0, 0];
				
				var skillColors = ["#00FFFF", "#FF00FF", "#FF7700", "#D500F9"];
				var skillInitials = ["S", "G", "P", "F"];
				var maxCooldowns = [15, 1, 45, 450];
				
				for (var i = 0; i < 4; i++) {
					var slotX = 405 + i * 32;
					var slotY = g_canvas.height - 32;
					
					// Draw background
					g_ctx.fillStyle = "#111118";
					g_ctx.fillRect(slotX, slotY, 24, 24);
					
					// Draw border
					g_ctx.strokeStyle = DeSoGhost.skillCooldowns[i] > 0 ? "#444444" : "#00FF00";
					g_ctx.lineWidth = 1;
					g_ctx.strokeRect(slotX, slotY, 24, 24);
					
					// Draw skill initial or icon image
					var skillId = stats.equippedSkills[i];
					var imgToDraw = null;
					if (skillId === 0) imgToDraw = spellSparkImg;
					else if (skillId === 1) imgToDraw = spellGhostImg;
					else if (skillId === 2) imgToDraw = spellOrbImg;
					else if (skillId === 3) imgToDraw = spellPhantomImg;
					
					if (imgToDraw && imgToDraw.complete) {
						g_ctx.drawImage(imgToDraw, slotX, slotY, 24, 24);
					} else {
						g_ctx.font = "bold 11px 'Courier New'";
						g_ctx.fillStyle = skillColors[skillId] || "#FFFFFF";
						g_ctx.textAlign = "center";
						g_ctx.fillText(skillInitials[skillId] || "?", slotX + 12, slotY + 16);
					}
					
					// Draw rune indicator dot
					var runeId = stats.equippedRunes[i];
					var runeColor = "#FFFFFF";
					if (runeId === 1) runeColor = "#FF4500"; // Fire
					else if (runeId === 2) runeColor = "#00E5FF"; // Cold
					else if (runeId === 3) runeColor = "#FFEA00"; // Lightning
					else if (runeId === 4) runeColor = "#00E676"; // Poison
					else if (runeId === 5) runeColor = "#D500F9"; // Arcane
					
					if (runeId > 0) {
						g_ctx.fillStyle = runeColor;
						g_ctx.beginPath();
						g_ctx.arc(slotX + 20, slotY + 4, 3, 0, Math.PI * 2);
						g_ctx.fill();
					}
					
					// Draw cooldown overlay
					var cd = DeSoGhost.skillCooldowns[i];
					if (cd > 0) {
						var maxCd = maxCooldowns[i] || 1;
						var pct = cd / maxCd;
						g_ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
						g_ctx.fillRect(slotX, slotY + (24 * (1 - pct)), 24, 24 * pct);
						
						g_ctx.font = "bold 9px 'Courier New'";
						g_ctx.fillStyle = "#FF3333";
						var secsLeft = Math.ceil(cd / 30);
						g_ctx.fillText(secsLeft, slotX + 12, slotY + 15);
					}
					
					// Draw mana cost
					var manaCost = 0;
					if (skillId === 1) manaCost = 10;
					else if (skillId === 2) manaCost = 30;
					else if (skillId === 3) manaCost = 50;
					if (manaCost > 0) {
						g_ctx.font = "8px 'Courier New'";
						g_ctx.fillStyle = "#00E5FF";
						g_ctx.fillText(manaCost, slotX + 7, slotY + 22);
					}
					
					// Draw hotkey indicator
					g_ctx.font = "9px 'Courier New'";
					g_ctx.fillStyle = "#888888";
					g_ctx.fillText(slotKeys[i], slotX + 12, slotY - 4);
				}

				// Draw Fireball Spell HUD Slot if equipped
				var eq = window.GetEquipmentState ? window.GetEquipmentState() : {};
				var equippedSpell = eq.spell || 
									(eq.mainhand && eq.mainhand.id === "ghost_spell" ? eq.mainhand : null) || 
									(eq.offhand && eq.offhand.id === "ghost_spell" ? eq.offhand : null);
				if (equippedSpell) {
					var slotX = 370;
					var slotY = g_canvas.height - 32;
					
					g_ctx.fillStyle = "#111118";
					g_ctx.fillRect(slotX, slotY, 24, 24);
					
					g_ctx.strokeStyle = "#ffaa00";
					g_ctx.lineWidth = 1;
					g_ctx.strokeRect(slotX, slotY, 24, 24);
					
					g_ctx.font = "14px 'Courier New'";
					g_ctx.textAlign = "center";
					g_ctx.fillText("🔥", slotX + 12, slotY + 17);
					
					g_ctx.font = "bold 9px 'Courier New'";
					g_ctx.fillStyle = "#FFA500";
					g_ctx.fillText("x" + equippedSpell.count, slotX + 16, slotY + 22);
					
					g_ctx.font = "9px 'Courier New'";
					g_ctx.fillStyle = "#888888";
					g_ctx.fillText("1", slotX + 12, slotY - 4);
				}
				g_ctx.textAlign = "start";
			}

			function DrawStartScreen() {
				g_ctx.fillStyle = "#000"; g_ctx.fillRect(0, 0, g_canvas.width, g_canvas.height);
				UpdateAndDrawBinaryBackground(true);
				
				if (logoImage.complete && logoImage.naturalWidth > 0) {
					var lw = logoImage.naturalWidth;
					var lh = logoImage.naturalHeight;
					if (lw > 400) { lh = lh * (400 / lw); lw = 400; }
					if (lh > 80) { lw = lw * (80 / lh); lh = 80; }
					g_ctx.drawImage(logoImage, g_canvas.width / 2 - lw / 2, 15, lw, lh);
				} else {
					g_ctx.font = "bold 40px 'Courier New'"; g_ctx.fillStyle = "#FF00FF"; g_ctx.textAlign = "center";
					g_ctx.fillText("DANGER GHOST", g_canvas.width / 2, 60);
				}
				
				g_ctx.textAlign = "center";
				g_ctx.font = "bold 12px 'Courier New'"; g_ctx.fillStyle = "#00FFFF";
				g_ctx.fillText("W / ARROW UP: JUMP (PRESS THREE TIMES FOR TRIPLE JUMP)", g_canvas.width / 2, 110);
				g_ctx.fillText("A, D / LEFT, RIGHT: MOVE", g_canvas.width / 2, 130);
				g_ctx.fillText("W (AT DOOR): ENTER NEXT LEVEL", g_canvas.width / 2, 150);
				g_ctx.fillText("F (HOLD): GHOST MODE (PASS THROUGH WALLS)", g_canvas.width / 2, 170);
				g_ctx.fillText("T (HOLD): FAST FORWARD (2X SPEED)", g_canvas.width / 2, 190);
				g_ctx.fillText("V: SPECTRAL SPARK (GEN) | E: PLASMA ORB (SPENDER)", g_canvas.width / 2, 210);
				g_ctx.fillText("R: PHANTOM FORM (ULT) | K: OPEN RPG PANEL", g_canvas.width / 2, 230);
				
				g_ctx.fillStyle = "#FF00FF";
				g_ctx.fillText("PRESS 'P' FOR PASSWORD (VIP ONLY)", g_canvas.width / 2, 255);
				
				g_ctx.fillStyle = "#FFFFFF"; g_ctx.font = "bold 18px 'Courier New'";
				g_ctx.fillText("PRESS 'SPACE' TO START", g_canvas.width / 2, 285);
				g_ctx.textAlign = "start";
			}

			function DrawWinScreen(playerToStamp) {
				g_ctx.fillStyle = "#000"; g_ctx.fillRect(0, 0, g_canvas.width, g_canvas.height);
				
				// Nome do jogo "Danger Ghost" no topo
				g_ctx.font = "bold 24px 'Courier New'"; g_ctx.fillStyle = "#FF00FF"; g_ctx.textAlign = "center";
				g_ctx.fillText("DANGER GHOST", g_canvas.width / 2, 35);
				
				// YOU WIN!
				g_ctx.font = "bold 36px 'Courier New'"; g_ctx.fillStyle = "#FFFF00";
				g_ctx.fillText("YOU WIN!", g_canvas.width / 2, 75);
				
				// Pontuação e tempo final
				g_ctx.font = "bold 18px 'Courier New'"; g_ctx.fillStyle = "#00FFFF";
				g_ctx.fillText("FINAL SCORE: " + g_score, g_canvas.width / 2, 105);
				
				var mins = Math.floor(g_globalTotalTime / 60);
				var secs = g_globalTotalTime % 60;
				var timeStr = mins + ":" + secs.toString().padStart(2, '0');
				g_ctx.fillText("FINAL TIME : " + timeStr, g_canvas.width / 2, 125);
				
				var doorsStr = g_doorsUsed.toString().padStart(2, '0');
				g_ctx.fillText("LEVELS COMPLETED: " + doorsStr + " / 33", g_canvas.width / 2, 145);
				
				// Elegibilidade para o ranking de tempo (Speedrun)
				var eligibleForTime = true;
				for (var lvl = 1; lvl <= 33; lvl++) {
					if (!window.g_completedLevels || !window.g_completedLevels[lvl]) {
						eligibleForTime = false;
						break;
					}
				}
				if (window.g_hasUsedPassword) {
					eligibleForTime = false;
				}
				if (g_doorsUsed < 33) {
					eligibleForTime = false;
				}
				if (!eligibleForTime) {
					g_ctx.fillStyle = "#FF0000"; g_ctx.font = "bold 10px 'Courier New'";
					g_ctx.fillText("(NOT ELIGIBLE FOR SPEEDRUN RANK - SKIPPED LEVELS/PASSWORD USED)", g_canvas.width / 2, 158);
				}
				
				// Nível e XP do Fantasma
				var stats = GhostRPG.getStats();
				g_ctx.fillStyle = "#00FF00"; g_ctx.font = "bold 18px 'Courier New'";
				g_ctx.fillText("GHOST LEVEL: " + stats.level, g_canvas.width / 2, 180);
				g_ctx.fillText("GHOST XP   : " + stats.xp + " / " + stats.xpRequired, g_canvas.width / 2, 200);
				
				if (playerToStamp) {
					g_ctx.fillStyle = "#FF00FF";
					g_ctx.font = "bold 18px 'Courier New'";
					g_ctx.fillText("PLAYER: " + playerToStamp.toUpperCase(), g_canvas.width / 2, 230);
				} else {
					g_ctx.fillStyle = "#FFFFFF"; g_ctx.font = "bold 18px 'Courier New'";
					g_ctx.fillText("PRESS 'SPACE' TO PLAY AGAIN", g_canvas.width / 2, 265);
				}
				g_ctx.textAlign = "start";
			}
			
			function DownloadScreenshot() {
				var nameInput = document.getElementById("playerNameInput");
				var pName = nameInput.value.trim() || "UNKNOWN";
				
				// Renderiza a tela limpa e com o nome estampado
				DrawWinScreen(pName);
				
				// Captura em formato Blob Real (evita erros de arquivo corrompido no Windows Viewer)
				g_canvas.toBlob(function(blob) {
					var url = URL.createObjectURL(blob);
					var link = document.createElement("a");
					link.download = "DangerGhost_Clear.jpg";
					link.href = url;
					document.body.appendChild(link);
					link.click();
					document.body.removeChild(link);
					
					// Limpa a memória do navegador
					setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
					
					// Re-renderiza normal (com "press space")
					DrawWinScreen();
				}, "image/jpeg", 0.95);
			}
			window.DownloadScreenshot = DownloadScreenshot;

			function DrawGameOverScreen() {
				g_ctx.fillStyle = "#000"; g_ctx.fillRect(0, 0, g_canvas.width, g_canvas.height);
				g_ctx.font = "bold 40px 'Courier New'"; g_ctx.fillStyle = "#FF0000"; g_ctx.textAlign = "center";
				g_ctx.fillText("GAME OVER", g_canvas.width / 2, 80);
				
				g_ctx.font = "bold 20px 'Courier New'"; g_ctx.fillStyle = "#00FFFF";
				g_ctx.fillText("SCORE: " + g_score, g_canvas.width / 2, 130);
				
				g_ctx.font = "bold 18px 'Courier New'"; g_ctx.fillStyle = "#FFFFFF";
				g_ctx.fillText("YOUR SOUL IS LOST...", g_canvas.width / 2, 180);
				g_ctx.fillText("PRESS 'SPACE' TO TRY AGAIN", g_canvas.width / 2, 220);
				g_ctx.textAlign = "start";
			}

			var g_cutsceneTimer = null;
            var g_cutsceneTargetLevel = 1;
            var g_cutscenePreserve = false;
			function StartCutscene(targetLevel, preserve) {
                g_cutsceneTargetLevel = targetLevel || 1;
                g_cutscenePreserve = !!preserve;
				SetGameState(G_CUTSCENE);
				var gif = document.getElementById("cutsceneGif");
				gif.src = "";
				gif.src = "assets/sprites/Dream 36.gif"; // Reinicia a animação no navegador
				gif.style.display = "block";
				g_cutsceneTimer = setTimeout(EndCutscene, 9000);
			}

			function EndCutscene() {
				if (g_gameState != G_CUTSCENE) return;
				clearTimeout(g_cutsceneTimer);
				var gif = document.getElementById("cutsceneGif");
				gif.style.display = "none";
				ResetGame(g_cutsceneTargetLevel, g_cutscenePreserve);
			}

			// --- DESO WEB3 INTEGRATION ---
			window.g_desoPublicKey = null;
			window.g_desoUserObj = null;
			window.g_desoIdentityWindow = null;
			window.g_desoPendingAction = null; 
			window.g_desoPendingTransactionHex = null;
			window.g_hasCreatorCoin = false;
			window.g_desoLastPostHashHex = null;
			window.g_desoPendingTransactionType = null;
			window.g_desoCharactersLoading = false;


			function timeToSeconds(tStr) {
				if (!tStr) return Infinity;
				var parts = tStr.split(":").map(Number);
				if (parts.length === 2) {
					return parts[0] * 60 + parts[1];
				} else if (parts.length === 3) {
					return parts[0] * 3600 + parts[1] * 60 + parts[2];
				}
				return Infinity;
			}

			// --- PROMISE-BASED RESILIENT FETCH WITH TIMEOUT ---
			function fetchWithTimeout(url, options, timeoutMs = 6000) {
				return Promise.race([
					fetch(url, options),
					new Promise((_, reject) => setTimeout(() => reject(new Error("RPC Timeout - Node slow or offline")), timeoutMs))
				]);
			}

			async function FetchLeaderboard() {
				return;
/*				g_hasFetchedLeaderboard = true;
				var container = document.getElementById("leaderboardContent");
				var timeContainer = document.getElementById("timeLeaderboardContent");
				try {
					var vipMap = {};
					var combinedPosts = [];
					
					// Helper interno para buscar recursos de forma segura sem quebrar o Promise.all se um falhar
					async function fetchSource(url, payload, name) {
						try {
							var res = await fetchWithTimeout(url, {
								method: "POST",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify(payload)
							}, 6000);
							if (res.ok) {
								return await res.json();
							}
							return null;
						} catch(e) {
							console.warn(`[Leaderboard Audit] Source '${name}' unavailable or timed out after 6s:`, e);
							return null;
						}
					}

					// Executa todas as fontes em paralelo com isolamento total de falhas/timeouts (AAA Performance)
					var [hodlersData, singlePostData, profileData, desoGhostProfileData, sickCrowProfileData, statelessData] = await Promise.all([
						fetchSource("https://node.deso.org/api/v0/get-hodlers-for-public-key", {
							PublicKeyBase58Check: "BC1YLhtwi4a2pqLTFZWoJuyd3GK6cjQm5Kz7HjZyNrMgaxrtUneMHFn",
							NumToFetch: 200
						}, "VIP Hodlers"),
						
						fetchSource("https://node.deso.org/api/v0/get-single-post", {
							PostHashHex: "fd622ab4b7723a8a4d17fe0d7bd2bcc11e22832dde0a4a45ad637760ee89cd40",
							CommentLimit: 1000
						}, "Thread Oficial"),
						
						fetchSource("https://node.deso.org/api/v0/get-posts-for-public-key", {
							PublicKeyBase58Check: "BC1YLhtwi4a2pqLTFZWoJuyd3GK6cjQm5Kz7HjZyNrMgaxrtUneMHFn", // @DangerGhost
							NumToFetch: 150 // Profundidade ampliada
						}, "Posts Perfil DangerGhost"),

						fetchSource("https://node.deso.org/api/v0/get-posts-for-public-key", {
							PublicKeyBase58Check: "BC1YLgwuSYXasawyfX5D8wiVSvC7qS1usfPA9QCnJ3ZRndyRcRmKdUG", // @DeSoGhost
							NumToFetch: 150
						}, "Posts Perfil DeSoGhost"),

						fetchSource("https://node.deso.org/api/v0/get-posts-for-public-key", {
							PublicKeyBase58Check: "BC1YLh2VrBvTgvqLm9PtVpLZWoCBUXrFSNmS3zs1eEv1rCFuDxfbqcC", // @sickcrow (Nova Fonte!)
							NumToFetch: 150
						}, "Posts Perfil SickCrow"),
						
						fetchSource("https://node.deso.org/api/v0/get-posts-stateless", {
							ReaderPublicKeyBase58Check: "BC1YLhtwi4a2pqLTFZWoJuyd3GK6cjQm5Kz7HjZyNrMgaxrtUneMHFn",
							PostContent: "#DangerGhost",
							NumToFetch: 150
						}, "Hashtag Fallback")
					]);

					// 1. Processar VIPs
					if (hodlersData && hodlersData.Hodlers) {
						for (var h = 0; h < hodlersData.Hodlers.length; h++) {
							var hodler = hodlersData.Hodlers[h];
							if (hodler.BalanceNanos > 0) {
								vipMap[hodler.HODLerPublicKeyBase58Check] = true;
							}
						}
					}

					// 2. Coletar e consolidar posts das fontes
					if (singlePostData && singlePostData.PostFound && singlePostData.PostFound.Comments) {
						combinedPosts = combinedPosts.concat(singlePostData.PostFound.Comments);
					}
					if (profileData && profileData.Posts) {
						combinedPosts = combinedPosts.concat(profileData.Posts);
					}
					if (desoGhostProfileData && desoGhostProfileData.Posts) {
						combinedPosts = combinedPosts.concat(desoGhostProfileData.Posts);
					}
					if (sickCrowProfileData && sickCrowProfileData.Posts) {
						combinedPosts = combinedPosts.concat(sickCrowProfileData.Posts);
					}
					if (statelessData) {
						var postsList = statelessData.Posts || statelessData.PostsFound;
						if (postsList) combinedPosts = combinedPosts.concat(postsList);
					}

					if (combinedPosts.length > 0) {
						var list = [];
						
						for (var i = 0; i < combinedPosts.length; i++) {
							var post = combinedPosts[i];
							if (post && post.Body) {
								// Sanitização completa contra Carriage Returns de sistemas operacionais distintos (\r)
								var cleanBody = post.Body.replace(/\r/g, "");
								var posterKey = post.PosterPublicKeyBase58Check;
								var isVip = vipMap[posterKey] ? true : false;

								// Extração do nível RPG (Hero Status) do PostExtraData ou do texto do post
								var matchRpg = cleanBody.match(/RPG Level:\s*(\d+)/i);
								var rpgLvl = 1;
								var hasSaveState = false;
								if (post.PostExtraData && post.PostExtraData["DangerGhost_SaveState"]) {
									try {
										var baseDecData = post.PostExtraData["DangerGhost_SaveState"]; var decrypted = baseDecData.startsWith("LZ:") ? window.LZString.decompressFromBase64(baseDecData.substring(3)) : SafeAtob(baseDecData);
										var stats = JSON.parse(decrypted);
										var rawLvl = undefined;
										if (stats && typeof stats.level !== "undefined") {
											rawLvl = stats.level;
										} else if (stats && typeof stats.Level !== "undefined") {
											rawLvl = stats.Level;
										}
										if (rawLvl !== undefined) {
											var parsedLvl = parseInt(rawLvl, 10);
											if (!isNaN(parsedLvl)) {
												rpgLvl = parsedLvl;
												hasSaveState = true;
											}
										}
									} catch(e) {
										console.warn("Error decrypting DangerGhost_SaveState for ranking", e);
									}
								}
								if (rpgLvl === 1 && matchRpg) {
									var parsedMatch = parseInt(matchRpg[1], 10);
									if (!isNaN(parsedMatch)) {
										rpgLvl = parsedMatch;
									}
								}

								// Parse clássico de placares embutidos em blocos globais de ranking
								// Apenas aceitamos blocos de rankings consolidados vindos de perfis oficiais para evitar injeção de falsos rankings via hashtag feed
								var isOfficialPost = (
									posterKey === "BC1YLhtwi4a2pqLTFZWoJuyd3GK6cjQm5Kz7HjZyNrMgaxrtUneMHFn" || // @DangerGhost
									posterKey === "BC1YLgwuSYXasawyfX5D8wiVSvC7qS1usfPA9QCnJ3ZRndyRcRmKdUG" || // @DeSoGhost
									posterKey === "BC1YLh2VrBvTgvqLm9PtVpLZWoCBUXrFSNmS3zs1eEv1rCFuDxfbqcC"    // @sickcrow
								);

								var lines = cleanBody.split("\n");
								var inScoreRank = false;
								var inTimeRank = false;
								for (var j = 0; j < lines.length; j++) {
									var line = lines[j].trim();
									if (!line) continue;
									if (line.includes("DANGER GHOST GLOBAL TOP 10")) {
										inScoreRank = isOfficialPost;
										inTimeRank = false;
										continue;
									}
									if (line.includes("DANGER GHOST SPEEDRUN TOP 10") || line.includes("SPEEDRUN TIME RANK") || line.includes("LEVEL RANK") || line.includes("DANGER GHOST LEVEL TOP 10")) {
										inScoreRank = false;
										inTimeRank = isOfficialPost;
										continue;
									}
									if (line.includes("#DangerGhost")) {
										inScoreRank = false;
										inTimeRank = false;
										break;
									}
									
									if (inScoreRank) {
										var match = line.match(/^\d+\.\s+(.+?)\s+-\s+(\d+)\s+pts(?:\s+\((\d+:\d+)\))?/i);
										if (match) {
											var parsedScore = parseInt(match[2], 10);
											if (!isNaN(parsedScore)) {
												list.push({ 
													name: match[1].trim(), 
													accountKey: match[1].trim(),
													score: parsedScore,
													time: match[3] ? match[3].trim() : "",
													isVip: isVip,
													rpgLevel: rpgLvl
												});
											}
										}
									} else if (inTimeRank) {
										var match = line.match(/^\d+\.\s+(.+?)\s+-\s+Level\s+(\d+)/i);
										if (match) {
											var parsedLvl = parseInt(match[2], 10);
											if (!isNaN(parsedLvl)) {
												list.push({
													name: match[1].trim(),
													accountKey: match[1].trim(),
													rpgLevel: parsedLvl,
													isVip: isVip
												});
											}
										}
									}
								}
								
								// Parse de postagens individuais de vitória ou saves de progresso
								var matchScore = cleanBody.match(/Score:\s*(\d+)/i);
								var matchName = cleanBody.match(/Ghost Hunter:\s*(.+)/i);
								var matchTime = cleanBody.match(/Time:\s*(\d+:\d+)/i);
								if ((matchScore && matchName) || matchRpg) {
									// Jogadores comuns devem obrigatoriamente possuir DangerGhost_SaveState.
									// Postagens sem metadados só se isOfficialPost for true.
									if (hasSaveState || isOfficialPost) {
										var isEligibleTime = false;
										var matchLevels = cleanBody.match(/Levels Completed:\s*(\d+)\s*\/\s*33/i);
										if (matchLevels) {
											var completedCount = parseInt(matchLevels[1], 10);
											if (!isNaN(completedCount) && completedCount === 33) {
												isEligibleTime = true;
											}
										}
										var displayCharacterName = matchName ? matchName[1].substring(0, 15).trim() : "";
										var desoUsername = (post.ProfileEntryResponse && post.ProfileEntryResponse.Username) ? post.ProfileEntryResponse.Username : displayCharacterName;
										if (!desoUsername && posterKey) {
											desoUsername = posterKey.substring(0, 11) + "...";
										}
										// Use the full poster public key to guarantee 100% secure account mapping and prevent collisions/name-spoofing
									var accountKey = posterKey || desoUsername;
										
										var parsedScoreVal = matchScore ? parseInt(matchScore[1], 10) : 0;
										if (isNaN(parsedScoreVal)) parsedScoreVal = 0;

										list.push({
											name: desoUsername,
											accountKey: accountKey,
											score: parsedScoreVal,
											time: (matchTime && isEligibleTime) ? matchTime[1].trim() : "",
											isVip: isVip,
											rpgLevel: rpgLvl
										});
									}
								}
							}
						}
						
						// 3. Deduplicar por conta para o Ranking de Pontos (mantendo APENAS a pontuação mais alta)
						var uniqueScoreMap = {};
						for (var k = 0; k < list.length; k++) {
							var p = list[k];
							var key = (p.accountKey || p.name || "unknown").toLowerCase().trim();
							if (!uniqueScoreMap[key]) {
								uniqueScoreMap[key] = p;
							} else {
								if (p.score > uniqueScoreMap[key].score) {
									var oldLvl = uniqueScoreMap[key].rpgLevel || 1;
									uniqueScoreMap[key] = p;
									if (!uniqueScoreMap[key].rpgLevel || uniqueScoreMap[key].rpgLevel < oldLvl) {
										uniqueScoreMap[key].rpgLevel = oldLvl;
									}
								}
								if (p.rpgLevel && p.rpgLevel > (uniqueScoreMap[key].rpgLevel || 1)) {
									uniqueScoreMap[key].rpgLevel = p.rpgLevel;
								}
							}
						}
						var finalScoreList = Object.values(uniqueScoreMap);
						
						// 4. Ordenar decrescente por score e fatiar no Top 10 (com tie-breaker alfabético para estabilidade)
						finalScoreList.sort(function(a, b) {
							var scoreDiff = b.score - a.score;
							if (scoreDiff !== 0) return scoreDiff;
							return (a.name || "").localeCompare(b.name || "");
						});
						g_leaderboardList = finalScoreList.slice(0, 10);

						// 5. Deduplicar por conta para o Ranking de Level (mantendo APENAS o level mais alto)
						var uniqueLevelMap = {};
						for (var k = 0; k < list.length; k++) {
							var p = list[k];
							var key = (p.accountKey || p.name || "unknown").toLowerCase().trim();
							var currentLvl = p.rpgLevel || 1;
							if (!uniqueLevelMap[key]) {
								uniqueLevelMap[key] = p;
							} else {
								var existingLvl = uniqueLevelMap[key].rpgLevel || 1;
								if (currentLvl > existingLvl) {
									uniqueLevelMap[key] = p;
								}
							}
						}
						var finalLevelList = Object.values(uniqueLevelMap);
						
						// 6. Ordenar decrescente por level e fatiar no Top 10
						finalLevelList.sort(function(a, b) {
							var lvlA = a.rpgLevel || 1;
							var lvlB = b.rpgLevel || 1;
							if (lvlB !== lvlA) {
								return lvlB - lvlA;
							}
							return (b.score || 0) - (a.score || 0); // Desempate pelo Score
						});
						g_timeLeaderboardList = finalLevelList.slice(0, 10);

						// 5. Renderização do HTML do ranking de pontos
						var html = "";
						if (g_leaderboardList.length > 0) {
							for (var i = 0; i < g_leaderboardList.length; i++) {
								var pos = i + 1;
								var item = g_leaderboardList[i];
								var nameColor = "#00FFFF";
								if (pos === 1) nameColor = "#FFD700"; // Ouro
								else if (pos === 2) nameColor = "#C0C0C0"; // Prata
								else if (pos === 3) nameColor = "#CD7F32"; // Bronze
								
								var vipTag = item.isVip ? " <span style='color: #FF00FF; font-weight: bold; font-size: 10px; text-shadow: 0 0 4px #FF00FF; background: rgba(255,0,255,0.15); padding: 1px 3px; border-radius: 3px; margin-left: 3px;'>VIP</span>" : "";
								var rpgLvlVal = item.rpgLevel || 1;
								var rpgTag = " <span style='color: #00FF00; font-weight: bold; font-size: 10px; text-shadow: 0 0 4px #00FF00; background: rgba(0,255,0,0.15); padding: 1px 3px; border-radius: 3px; margin-left: 3px;'>Lvl." + rpgLvlVal + "</span>";
								var displayName = pos + ". " + escapeHTML(item.name);
								
								html += "<div style='display: flex; justify-content: space-between; align-items: center; margin: 6px 0; border-bottom: 1px dashed rgba(0, 255, 255, 0.2); font-size: 12px;'>" +
										"<div style='display: flex; align-items: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 140px;'>" +
										"<span style='color: " + nameColor + "; font-weight: bold;'>" + displayName + "</span>" +
										vipTag +
										rpgTag +
										"</div>" +
										"<span style='color: #00FF00; font-weight: bold;'>" + item.score + "</span>" +
										"</div>";
							}
						} else {
							html = "<p style='text-align: center; color: #888; font-size: 11px; margin: 10px 0;'>NO SCORES FOUND</p>";
						}
						if (container) container.innerHTML = html;

						// 6. Renderização do HTML do ranking de level
						var timeHtml = "";
						if (g_timeLeaderboardList.length > 0) {
							for (var i = 0; i < g_timeLeaderboardList.length; i++) {
								var pos = i + 1;
								var item = g_timeLeaderboardList[i];
								var nameColor = "#00FFFF";
								if (pos === 1) nameColor = "#FFD700"; // Ouro
								else if (pos === 2) nameColor = "#C0C0C0"; // Prata
								else if (pos === 3) nameColor = "#CD7F32"; // Bronze
								
								var vipTag = item.isVip ? " <span style='color: #FF00FF; font-weight: bold; font-size: 10px; text-shadow: 0 0 4px #FF00FF; background: rgba(255,0,255,0.15); padding: 1px 3px; border-radius: 3px; margin-left: 3px;'>VIP</span>" : "";
								var rpgLvlVal = item.rpgLevel || 1;
								var displayName = pos + ". " + escapeHTML(item.name);
								
								timeHtml += "<div style='display: flex; justify-content: space-between; align-items: center; margin: 6px 0; border-bottom: 1px dashed rgba(0, 255, 255, 0.2); font-size: 12px;'>" +
										"<div style='display: flex; align-items: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 140px;'>" +
										"<span style='color: " + nameColor + "; font-weight: bold;'>" + displayName + "</span>" +
										vipTag +
										"</div>" +
										"<span style='color: #00FF00; font-weight: bold;'>Level " + rpgLvlVal + "</span>" +
										"</div>";
							}
						} else {
							timeHtml = "<p style='text-align: center; color: #888; font-size: 11px; margin: 10px 0;'>NO LEVELS FOUND</p>";
						}
						if (timeContainer) timeContainer.innerHTML = timeHtml;
					} else {
						if (container) container.innerHTML = "<p style='text-align: center; color: #888; font-size: 11px; margin: 10px 0;'>NO SCORES FOUND</p>";
						if (timeContainer) timeContainer.innerHTML = "<p style='text-align: center; color: #888; font-size: 11px; margin: 10px 0;'>NO LEVELS FOUND</p>";
					}
					
					// Reatividade de atualização em tempo real para a Navbar ativa
					if (typeof g_activeTab !== "undefined") {
						if (g_activeTab === 'score') {
							UpdateNavbarScore();
						} else if (g_activeTab === 'time') {
							UpdateNavbarTime();
						}
					}
				} catch (e) { 
					console.error("Leaderboard Error", e); 
					if (container) {
						container.innerHTML = "<p style='text-align: center; color: #FF00FF; font-size: 11px; margin: 10px 0;'>OFFLINE (CHECK SHIELDS)</p>";
					}
					if (timeContainer) {
						timeContainer.innerHTML = "<p style='text-align: center; color: #FF00FF; font-size: 11px; margin: 10px 0;'>OFFLINE (CHECK SHIELDS)</p>";
					}
					// Reatividade de erro para a Navbar ativa
					if (typeof g_activeTab !== "undefined") {
						if (g_activeTab === 'score') {
							UpdateNavbarScore();
						} else if (g_activeTab === 'time') {
							UpdateNavbarTime();
						}
					}
				}
*/			}

			// [Web2] CreateDeSoNFT and SubmitSignedTransaction removed — see js/web2/game_core.js




			function StartEndCutscene() {
				SetGameState(G_END_CUTSCENE);
				var gif = document.getElementById("cutsceneGif");
				gif.src = "";
				gif.src = "assets/sprites/Dream 36 (1).gif"; // GIF de Encerramento
				gif.style.display = "block";
				g_cutsceneTimer = setTimeout(FinishEndCutscene, 16000); // 16 segundos
			}

			function FinishEndCutscene() {
				if (g_gameState != G_END_CUTSCENE) return;
				clearTimeout(g_cutsceneTimer);
				var gif = document.getElementById("cutsceneGif");
				gif.style.display = "none";
				SetGameState(G_WIN);
			}

			function FindRandomPlatformCoordinates() {
				var validPositions = [];
				for (var c = 40; c < 96; c++) {
					for (var r = 2; r < 11; r++) {
						var tileLeft = map.bitmap[r][c];
						var tileCenter = map.bitmap[r][c+1];
						var tileRight = map.bitmap[r][c+2];
						
						var isLeftSolid = (tileLeft == 1 || tileLeft == 2 || tileLeft == 13 || tileLeft == 14 || tileLeft == 20);
						var isCenterSolid = (tileCenter == 1 || tileCenter == 2 || tileCenter == 13 || tileCenter == 14 || tileCenter == 20);
						var isRightSolid = (tileRight == 1 || tileRight == 2 || tileRight == 13 || tileRight == 14 || tileRight == 20);

						if (isLeftSolid && isCenterSolid && isRightSolid) {
							var isSpaceFree = true;
							for (var checkR = r - 1; checkR >= r - 2; checkR--) {
								if (checkR >= 0) {
									var tL = map.bitmap[checkR][c];
									var tC = map.bitmap[checkR][c+1];
									var tR = map.bitmap[checkR][c+2];
									if (tL != 0 || tC != 0 || tR != 0) {
										isSpaceFree = false;
										break;
									}
								}
							}
							if (isSpaceFree) {
								var minCol = c;
								while (minCol > 0) {
									var t = map.bitmap[r][minCol - 1];
									if (t == 1 || t == 2 || t == 13 || t == 14 || t == 20) {
										minCol--;
									} else {
										break;
									}
								}
								var maxCol = c + 2;
								while (maxCol < 99) {
									var t = map.bitmap[r][maxCol + 1];
									if (t == 1 || t == 2 || t == 13 || t == 14 || t == 20) {
										maxCol++;
									} else {
										break;
									}
								}
								validPositions.push({
									col: c + 1,
									row: r - 2,
									minX: Math.max(960, minCol * 24),
									maxX: (maxCol - 1) * 24
								});
							}
						}
					}
				}

				if (validPositions.length > 0) {
					var farPositions = validPositions.filter(function(pos) {
						return Math.abs(pos.col * 24 - DeSoGhost.xPos) >= 150;
					});
					var list = farPositions.length > 0 ? farPositions : validPositions;
					var randPos = list[Math.floor(Math.random() * list.length)];
					return {
						x: randPos.col * 24,
						y: randPos.row * 24,
						minX: randPos.minX,
						maxX: randPos.maxX
					};
				}
				return null;
			}

			function SpawnBossAtRandomLocation(bossType) {
				if (g_currentLevel === "cave1" || g_currentLevel === "CAVE1") return;
				if (typeof g_bosses !== 'undefined') {
					var aliveBosses = g_bosses.filter(function(b) { return b.alive; });
					if (aliveBosses.length >= 6) return;
				}
				bossType = bossType || "crow";
				g_screenShakeTime = 30; // 30 frames de tremor (~1 segundo)
				g_screenShakeIntensity = 12;

				var spawnX, spawnY, walkMinX, walkMaxX;
				var coords = FindRandomPlatformCoordinates();

				if (coords) {
					spawnX = coords.x;
					spawnY = coords.y;
					walkMinX = coords.minX;
					walkMaxX = coords.maxX;
				} else {
					// Fallback: spawn no meio do mapa com plataforma gerada dinamicamente
					var randomCol = Math.floor(Math.random() * 50) + 40; // Garantir distância do início da fase
					spawnX = randomCol * 24;
					spawnY = 144; // row 6

					// Garantir plataforma de tile ID 2 sob o boss (linha 8, colunas col-1, col, col+1, col+2)
					if (map.bitmap[8]) {
						map.bitmap[8][randomCol - 1] = 2;
						map.bitmap[8][randomCol] = 2;
						map.bitmap[8][randomCol + 1] = 2;
						map.bitmap[8][randomCol + 2] = 2;
					}
					walkMinX = Math.max(960, spawnX - 120);
					walkMaxX = Math.min(2350, spawnX + 120);
				}

				// Evitar spawnar muito próximo do jogador
				if (Math.abs(spawnX - DeSoGhost.xPos) < 150) {
					if (spawnX + 240 < 2300) {
						spawnX += 240;
						walkMinX += 240;
						walkMaxX += 240;
					} else {
						spawnX -= 240;
						walkMinX -= 240;
						walkMaxX -= 240;
					}
				}

				g_boss = new c_Boss(spawnX, spawnY, bossType);
				g_boss.minX = walkMinX;
				g_boss.maxX = walkMaxX;
			}


			function ResetGame(l, preserveScore) {
				g_globalStartTime = Date.now();
				g_currentLevel = l || 1; 
                if (!preserveScore) {
                    g_score = 0; 
                    if (typeof _antiCheat !== "undefined") {
                        _antiCheat.hash = btoa("0" + _antiCheat.salt);
                    }
                }
                map_offset = 0; g_doorsUsed = 0;
				window.g_hasUsedPassword = (l && l > 1) ? true : false;
				window.g_completedLevels = {};
				window.g_completedLevels[g_currentLevel] = true;
				DeSoGhost.lives = 3; DeSoGhost.alive = true;
				DeSoGhost.collectedLives = 0;
				DeSoGhost.collectedBlueDiamonds = 0;

				DeSoGhost.xPos = 48; DeSoGhost.yPos = 150;
				DeSoGhost.jumpNum = 0; DeSoGhost.jumpCounter = 0;
				DeSoGhost.jumpsPerformed = 0; explosionFrame = 0;
				g_boss = null;
				g_bosses = [];
				map.loadLevel(g_currentLevel); SetGameState(G_PLAY);
			}

			// --- INITIALIZATION ---
			var map = new Initialize_Map_Array();
			var DeSoGhost = new c_DeSoGhost(48, 150);
var g_binaryBits = [];
			for (var i = 0; i < 60; i++) {
				g_binaryBits.push({
					x: Math.random() * 640,
					y: Math.random() * 300,
					speed: 1 + Math.random() * 4,
					val: Math.floor(Math.random() * 2)
				});
			}

			function Game_Step_Logic() {
				if (g_gameState == G_START) {
					updateBinaryBackground(true);
				}
				else if (g_gameState == G_PLAY) {
					g_timeRemaining = 240; // Mantém valor positivo constante para evitar efeitos colaterais

					updateBinaryBackground(false);
					map.updateMap();
					if (typeof g_bosses !== 'undefined') {
						g_bosses = g_bosses.filter(function(b) { return b.alive; });
						g_bosses.forEach(function(b) { b.update(); });
						g_boss = g_bosses.length > 0 ? g_bosses[0] : null;
					} else if (g_boss) {
						g_boss.update();
					}
					DeSoGhost.move();
					updateProjectiles();
					updateVisualEffects();
				}
				else if (g_gameState == G_PAUSE) {
					updateBinaryBackground(false);
				}
			}

			function Game_Step_Render() {
				var extTimer = document.getElementById("externalTimer");
				if (extTimer) {
					extTimer.style.display = "none"; // Ocultar o cronômetro visual
				}
				g_ctx.clearRect(0, 0, g_canvas.width, g_canvas.height);
				// Vidro fumê sobre o background do canvas
				g_ctx.fillStyle = "rgba(7, 7, 8, 0.65)";
				g_ctx.fillRect(0, 0, g_canvas.width, g_canvas.height);
				
				g_ctx.save();
				if (g_gameState == G_PLAY && g_screenShakeTime > 0) {
					var dx = (Math.random() - 0.5) * g_screenShakeIntensity;
					var dy = (Math.random() - 0.5) * g_screenShakeIntensity;
					g_ctx.translate(dx, dy);
					g_screenShakeTime--;
				}
				
				if (g_gameState == G_START) {
					drawBinaryBackground(true);
					DrawStartScreen();
				}
				else if (g_gameState == G_CUTSCENE || g_gameState == G_END_CUTSCENE) {
					// Tela preta de fundo pro Canvas enquanto o GIF toca pelo DOM
					g_ctx.fillStyle = "#000"; g_ctx.fillRect(0, 0, g_canvas.width, g_canvas.height);
				}
				else if (g_gameState == G_PLAY) {
					drawBinaryBackground(false);
					map.draw();
					if (typeof g_bosses !== 'undefined') {
						g_bosses.forEach(function(b) { b.draw(); });
					} else if (g_boss) {
						g_boss.draw();
					}
					drawProjectiles();
					DeSoGhost.draw();
					drawVisualEffects();
					Print_HUD();
				}
				else if (g_gameState == G_WIN) DrawWinScreen();
				else if (g_gameState == G_GAMEOVER) DrawGameOverScreen();
				else if (g_gameState == G_PAUSE) {
					drawBinaryBackground(false);
					map.draw();
					if (typeof g_bosses !== 'undefined') {
						g_bosses.forEach(function(b) { b.draw(); });
					} else if (g_boss) {
						g_boss.draw();
					}
					drawProjectiles();
					drawVisualEffects();
					DeSoGhost.draw();
					Print_HUD();
					
					g_ctx.fillStyle = "rgba(0,0,0,0.7)"; g_ctx.fillRect(0, 0, g_canvas.width, g_canvas.height);
					g_ctx.font = "bold 40px 'Courier New'"; g_ctx.fillStyle = "#FF00FF"; g_ctx.textAlign = "center";
					g_ctx.fillText("PAUSED", g_canvas.width / 2, 140);
					g_ctx.font = "bold 20px 'Courier New'"; g_ctx.fillStyle = "#FFF";
					g_ctx.fillText("PRESS SPACE TO RESUME", g_canvas.width / 2, 180);
					g_ctx.textAlign = "left";
				}
				
				g_ctx.restore();
			}

			function Game_Loop() {
				Game_Step_Logic();
				Game_Step_Render();
			}

			var g_isFast = false;
			var g_lastTime = 0;
			var g_physicsAccumulator = 0;

			function Game_Step(currentTime) {
				if (!g_lastTime) g_lastTime = currentTime;
				var dt = currentTime - g_lastTime;
				g_lastTime = currentTime;

				if (dt > 250) dt = 250; // clamp to prevent spiral of death

				g_physicsAccumulator += dt;
				var currentTimestep = g_isFast ? 16.66 : 33.33;
				
				var updates = 0;
				while (g_physicsAccumulator >= currentTimestep) {
					Game_Step_Logic();
					g_physicsAccumulator -= currentTimestep;
					updates++;
					if (updates > 10) {
						g_physicsAccumulator = 0;
						break;
					}
				}

				Game_Step_Render();

				requestAnimationFrame(Game_Step);
			}

			// Iniciar o loop requestAnimationFrame
			requestAnimationFrame(Game_Step);

			window.addEventListener("keydown", function (e) {
				if (document.activeElement && (
					document.activeElement.tagName === "INPUT" || 
					document.activeElement.tagName === "TEXTAREA" ||
					document.activeElement.tagName === "SELECT" ||
					document.activeElement.isContentEditable
				)) {
					return;
				}
				
				if (!g_musicStarted) {
					var p = bgMusic.play();
					if (p !== undefined) {
						p.catch(function(err){});
					}
					g_musicStarted = true;
				}
				if (e.keyCode == 77 && !e.repeat) { // M (Mute/Unmute)
					if (typeof ToggleMute === "function") {
						ToggleMute();
					}
				}
				if (e.keyCode == 84 && !g_isFast) { // T (Fast Forward)
					g_isFast = true;
				}
				if (e.keyCode == 49 && !e.repeat) { // 1 (Cast Equipped Spell)
					if (g_gameState === G_PLAY && !DeSoGhost.dead) {
						var eq = window.GetEquipmentState ? window.GetEquipmentState() : {};
						var equippedSpell = eq.spell || 
											(eq.mainhand && eq.mainhand.id === "ghost_spell" ? eq.mainhand : null) || 
											(eq.offhand && eq.offhand.id === "ghost_spell" ? eq.offhand : null);
						if (equippedSpell && equippedSpell.count > 0) {
							var speed = 3.5;
							var isLeft = DeSoGhost.face !== 1;
							var vx = isLeft ? -speed : speed;
							var px = DeSoGhost.xPos + (isLeft ? -10 : 30);
							var py = DeSoGhost.yPos + 10;
							
							var stats = GhostRPG.getStats();
							var intPowMult = 1 + (stats.int + stats.pow) * 0.05;
							var baseDamage = 35;
							var spellDmg = Math.round(baseDamage * intPowMult);
							
							var p = obtainProjectile(px, py, vx, 0, "spell_fireball", 0, 20, 20, 120, spellDmg, true);
							g_projectiles.push(p);
							
							g_visualEffects.push(obtainExplosionEffect(px, py, "#ffaa00", 8));
							
							if (window.ConsumeSpellUse) {
								window.ConsumeSpellUse();
							}
						}
					}
				}
				if (e.keyCode == 50 && !e.repeat) { // 2 (Cast Ring 1 Ice Spell)
					if (g_gameState === G_PLAY && !DeSoGhost.dead) {
						var eq = window.GetEquipmentState ? window.GetEquipmentState() : {};
						if (eq.ring1) {
							if (DeSoGhost.mana >= 15) {
								DeSoGhost.mana -= 15;
								var speed = 4;
								var isLeft = DeSoGhost.face !== 1;
								var vx = isLeft ? -speed : speed;
								var px = DeSoGhost.xPos + (isLeft ? -10 : 30);
								var py = DeSoGhost.yPos + 10;
								
								var stats = GhostRPG.getStats();
								var intPowMult = 1 + (stats.int + stats.pow) * 0.05;
								var spellDmg = Math.round(25 * intPowMult);
								
								var p = obtainProjectile(px, py, vx, 0, "spell_ice", 0, 16, 16, 120, spellDmg, true);
								g_projectiles.push(p);
								
								g_visualEffects.push(obtainExplosionEffect(px, py, "#00E5FF", 8));
							}
						}
					}
				}
				if (e.keyCode == 51 && !e.repeat) { // 3 (Cast Ring 2 Wood Spell)
					if (g_gameState === G_PLAY && !DeSoGhost.dead) {
						var eq = window.GetEquipmentState ? window.GetEquipmentState() : {};
						if (eq.ring2) {
							if (DeSoGhost.mana >= 15) {
								DeSoGhost.mana -= 15;
								var speed = 4;
								var isLeft = DeSoGhost.face !== 1;
								var vx = isLeft ? -speed : speed;
								var px = DeSoGhost.xPos + (isLeft ? -10 : 30);
								var py = DeSoGhost.yPos + 10;
								
								var stats = GhostRPG.getStats();
								var intPowMult = 1 + (stats.int + stats.pow) * 0.05;
								var spellDmg = Math.round(30 * intPowMult);
								
								var p = obtainProjectile(px, py, vx, 0, "spell_wood", 0, 16, 16, 120, spellDmg, true);
								g_projectiles.push(p);
								
								g_visualEffects.push(obtainExplosionEffect(px, py, "#00E676", 8));
							}
						}
					}
				}
				if (e.keyCode == 86 && !e.repeat) { useSlotSkill(0); } // V
				if (e.keyCode == 70) { // F
					var stats = GhostRPG.getStats();
					var skillId = stats.equippedSkills[1];
					if (skillId === 1) { // Ghost Mode
						if (DeSoGhost.mana > 0) DeSoGhost.ghostMode = true;
					} else {
						if (!e.repeat) useSlotSkill(1);
					}
				}
				if (e.keyCode == 69 && !e.repeat) { useSlotSkill(2); } // E
				if (e.keyCode == 82 && !e.repeat) { useSlotSkill(3); } // R
				if (e.keyCode == 32) { 
					if (document.activeElement && (
						document.activeElement.tagName === "INPUT" || 
						document.activeElement.tagName === "TEXTAREA" ||
						document.activeElement.tagName === "SELECT" ||
						document.activeElement.isContentEditable
					)) {
						return; 
					}
					// [Web2] Character check — no blockchain required
					if (window.g_desoCharactersLoading) {
						alert('Loading your Ghosts, please wait...');
						return;
					}
					var stats = GhostRPG.getStats();
					if (!window.g_isGuestRun && (!stats || !stats.characterId)) {
						var overlay = document.getElementById('characterSelectionOverlay');
						if (overlay) overlay.style.display = 'block';
						alert('Please select or create your Ghost character to start playing!');
						return;
					}
					if (document.activeElement && document.activeElement.tagName === "BUTTON") {
						document.activeElement.blur();
					}
					e.preventDefault();
					if (g_gameState == G_START) {
						window.g_isGuestRun = true;
						var menu = document.getElementById("loginButtonsContainer");
						if (menu) menu.style.display = "none";
						StartCutscene();
					} else if (g_gameState == G_CUTSCENE) {
						EndCutscene();
					} else if (g_gameState == G_END_CUTSCENE) {
						FinishEndCutscene();
					} else if (g_gameState == G_PLAY) {
						SetGameState(G_PAUSE);
						g_pauseStartTime = Date.now();
					} else if (g_gameState == G_PAUSE) {
						SetGameState(G_PLAY);
						g_levelStartTime += (Date.now() - g_pauseStartTime);
					} else { 
						ResetGame(); 
					} 
				}
				if (e.keyCode == 80) { // P (Passwords)
					// Bypass inteligente de VIP em desenvolvimento local ou staging para facilitar testes
					var isLocal = window.location.hostname === "localhost" || 
								  window.location.hostname === "127.0.0.1";
								  
					if (!window.g_hasCreatorCoin && !isLocal) {
						alert("⚠️ ACCESS DENIED (TOKEN-GATING): This feature is exclusively for $DangerGhost Coin Holders! Buy our Creator Coin on DeSo with your logged in wallet to unlock Passwords.");
						return;
					}
					var pw = prompt("ENTER VIP PASSWORD");
					if (pw) {
						var pwLower = pw.toLowerCase();
						if (pwLower === "matrix" || pwLower === "becopro" || pwLower === "maximo") {
							window.g_hasUsedPassword = true;
							if (pwLower === "matrix") { ResetGame(26); }
							else if (pwLower === "becopro") { ResetGame(29); }
							else if (pwLower === "maximo") { ResetGame(33); }
						}
					}
				}
				if (e.keyCode == 65 || e.keyCode == 37) DeSoGhost.moveLeft = true;
				if (e.keyCode == 68 || e.keyCode == 39) DeSoGhost.moveRight = true;
				if (e.keyCode == 87 || e.keyCode == 38) DeSoGhost.jump = true;
				if (e.keyCode == 75) ToggleNavbarTab('rpg'); // Key 'K' to toggle CHARACTER/RPG Panel
			});
			window.addEventListener("keyup", function (e) {
				if (e.keyCode == 84 && g_isFast) { // T (Fast Forward)
					g_isFast = false;
				}
				if (e.keyCode == 70) { // F
					DeSoGhost.ghostMode = false;
				}
				if (e.keyCode == 65 || e.keyCode == 37) DeSoGhost.moveLeft = false;
				if (e.keyCode == 68 || e.keyCode == 39) DeSoGhost.moveRight = false;
				if (e.keyCode == 87 || e.keyCode == 38) DeSoGhost.jump = false;
			});
			window.addEventListener("blur", function () {
				DeSoGhost.moveLeft = false;
				DeSoGhost.moveRight = false;
				DeSoGhost.jump = false;
				DeSoGhost.ghostMode = false;
				if (g_isFast) {
					g_isFast = false;
				}
			});

			// Expõe os botões para o HTML
			window.DownloadScreenshot = DownloadScreenshot;
			window.ToggleMute = ToggleMute;

			// --- INTERACTIVE ONBOARDING TUTORIAL SYSTEM ---
			var tutCanvas = document.getElementById("tutorialCanvas");
			var tutCtx = tutCanvas ? tutCanvas.getContext("2d") : null;
			var tutActive = false;
			var tutLoopId = null;
			var tutTab = "sandbox";

			// Tutorial Player State
			var tp = {
				x: 60, y: 120, vx: 0, vy: 0,
				width: 16, height: 16,
				jumps: 0, maxJumps: 3,
				facingLeft: false,
				ghostMode: false,
				mana: 100, maxMana: 100,
				phantomActive: false,
				phantomTimer: 0,
				sparks: [],
				orbs: []
			};

			var tutKeys = { A: false, D: false, W: false, V: false, F: false, E: false, R: false };

			var walkLeftDone = false;
			var walkRightDone = false;
			var tutMissions = [
				{ id: "walk", text: "Walk Left & Right (Keys A / D)", done: false },
				{ id: "jump1", text: "Single Jump (Key W)", done: false },
				{ id: "jump2", text: "Double Jump (W in air)", done: false },
				{ id: "jump3", text: "Triple Jump! (W 3x in air)", done: false },
				{ id: "spark", text: "Spectral Spark (Key V) [Generates Mana]", done: false },
				{ id: "phase", text: "Phase through barrier (Hold F + D / Ghost Mode)", done: false },
				{ id: "orb", text: "Plasma Orb (Key E) [Consumes 30 Mana]", done: false },
				{ id: "phantom", text: "Phantom Form (Key R) [Consumes 50 Mana]", done: false }
			];

			function RenderTutorialMissions() {
				var listEl = document.getElementById("tutMissionList");
				if (!listEl) return;
				
				var html = "";
				var allDone = true;
				tutMissions.forEach(function(m) {
					var statusIcon = m.done ? "🟩 [x]" : "⬜ [ ]";
					var textColor = m.done ? "#00FF00" : "#888888";
					var textShadow = m.done ? "0 0 3px rgba(0,255,0,0.5)" : "none";
					if (!m.done && allDone) {
						textColor = "var(--cyan-neon)";
						textShadow = "0 0 5px var(--cyan-neon)";
					}
					if (!m.done) allDone = false;
					
					html += '<div style="color: ' + textColor + '; text-shadow: ' + textShadow + '; font-family: monospace; display: flex; gap: 8px; align-items: flex-start;">';
					html += '<span style="flex-shrink: 0; white-space: nowrap;">' + statusIcon + '</span>';
					html += '<span>' + m.text + '</span>';
					html += '</div>';
				});

				if (allDone) {
					html += '<div style="margin-top: 10px; color: var(--yellow-neon); font-weight: bold; font-size: 12px; text-shadow: 0 0 8px var(--yellow-neon); text-align: center; text-transform: uppercase;">🏆 Tutorial Completed!<br><span style="font-size: 9px; color: #aaa;">You are ready for the Saga!</span></div>';
				}
				listEl.innerHTML = html;
			}

			function OpenInteractiveTutorial() {
				document.getElementById("interactiveTutorialModal").style.display = "block";
				tutActive = true;
				SwitchTutorialTab("sandbox");
				InitTutorialKeys();
				InitTutorialSandbox();
			}

			function CloseInteractiveTutorial() {
				document.getElementById("interactiveTutorialModal").style.display = "none";
				tutActive = false;
				if (tutLoopId) {
					cancelAnimationFrame(tutLoopId);
					tutLoopId = null;
				}
				RemoveTutorialKeys();
			}

			function SwitchTutorialTab(tabId) {
				tutTab = tabId;
				// Reset all tabs
				var tabs = ["Sandbox", "Spells", "Blockchain", "GettingStarted"];
				tabs.forEach(function(t) {
					var btn = document.getElementById("tabBtn" + t);
					if (btn) btn.classList.remove("active");
				});
				var panes = ["paneSandbox", "paneSpells", "paneBlockchain", "paneGettingStarted"];
				panes.forEach(function(p) {
					var pane = document.getElementById(p);
					if (pane) pane.classList.remove("active");
				});

				// Active specific
				if (tabId === "sandbox") {
					document.getElementById("tabBtnSandbox").classList.add("active");
					document.getElementById("paneSandbox").classList.add("active");
					// Start loop if not already
					if (tutActive && !tutLoopId) InitTutorialSandbox();
					RenderTutorialMissions();
				} else if (tabId === "spells") {
					document.getElementById("tabBtnSpells").classList.add("active");
					document.getElementById("paneSpells").classList.add("active");
					UpdateTutorialRunePreview();
				} else if (tabId === "blockchain") {
					document.getElementById("tabBtnBlockchain").classList.add("active");
					document.getElementById("paneBlockchain").classList.add("active");
				} else if (tabId === "start") {
					document.getElementById("tabBtnGettingStarted").classList.add("active");
					document.getElementById("paneGettingStarted").classList.add("active");
				}
			}

			// Capture keys inside tutorial modal only
			function handleTutKeyDown(e) {
				if (!tutActive || tutTab !== "sandbox") return;
				
				var key = e.keyCode;
				var handled = false;
				if (key === 65 || key === 37) { tutKeys.A = true; handled = true; } // A, Left
				if (key === 68 || key === 39) { tutKeys.D = true; handled = true; } // D, Right
				if (key === 87 || key === 38) { // W, Up
					if (!tutKeys.W) {
						if (tp.jumps < tp.maxJumps) {
							tp.vy = -6.5;
							tp.jumps++;
							ShowTutorialFeedback("Jump level: " + tp.jumps + " / 3!");
							if (tp.jumps === 1) {
								var m = tutMissions.find(function(x) { return x.id === "jump1"; });
								if (m && !m.done) { m.done = true; RenderTutorialMissions(); }
							} else if (tp.jumps === 2) {
								var m = tutMissions.find(function(x) { return x.id === "jump2"; });
								if (m && !m.done) { m.done = true; RenderTutorialMissions(); }
							} else if (tp.jumps === 3) {
								var m = tutMissions.find(function(x) { return x.id === "jump3"; });
								if (m && !m.done) { m.done = true; RenderTutorialMissions(); }
							}
						}
					}
					tutKeys.W = true;
					handled = true;
				}
				if (key === 70) { tutKeys.F = true; handled = true; } // F
				if (key === 86 && !e.repeat) { // V
					tutKeys.V = true;
					CastTutorialSpark();
					handled = true;
				}
				if (key === 69 && !e.repeat) { // E
					tutKeys.E = true;
					CastTutorialOrb();
					handled = true;
				}
				if (key === 82 && !e.repeat) { // R
					tutKeys.R = true;
					TriggerTutorialPhantom();
					handled = true;
				}

				if (handled) {
					e.preventDefault();
					e.stopPropagation();
				}
			}

			function handleTutKeyUp(e) {
				if (!tutActive || tutTab !== "sandbox") return;
				var key = e.keyCode;
				if (key === 65 || key === 37) { tutKeys.A = false; }
				if (key === 68 || key === 39) { tutKeys.D = false; }
				if (key === 87 || key === 38) { tutKeys.W = false; }
				if (key === 70) { tutKeys.F = false; }
				if (key === 86) { tutKeys.V = false; }
				if (key === 69) { tutKeys.E = false; }
				if (key === 82) { tutKeys.R = false; }
			}

			function InitTutorialKeys() {
				window.addEventListener("keydown", handleTutKeyDown, true);
				window.addEventListener("keyup", handleTutKeyUp, true);
			}

			function RemoveTutorialKeys() {
				window.removeEventListener("keydown", handleTutKeyDown, true);
				window.removeEventListener("keyup", handleTutKeyUp, true);
			}

			function ShowTutorialFeedback(text) {
				var fb = document.getElementById("tutorialFeedback");
				if (fb) fb.innerHTML = text;
			}

			// Cast Spells inside tutorial sandbox
			function CastTutorialSpark() {
				var speed = tp.facingLeft ? -4.5 : 4.5;
				tp.sparks.push({ x: tp.x + (tp.facingLeft ? -4 : 16), y: tp.y + 6, vx: speed });
				tp.mana = Math.min(tp.maxMana, tp.mana + 5); // Regenerates mana on cast (Spectral Spark generator)
				ShowTutorialFeedback("Spectral Spark cast! Regenerates mana +5.");
				var m = tutMissions.find(function(x) { return x.id === "spark"; });
				if (m && !m.done) {
					m.done = true;
					RenderTutorialMissions();
				}
			}

			function CastTutorialOrb() {
				if (tp.mana >= 30) {
					tp.mana -= 30;
					var speed = tp.facingLeft ? -2.5 : 2.5;
					tp.orbs.push({ x: tp.x + (tp.facingLeft ? -10 : 16), y: tp.y + 4, vx: speed, r: 8 });
					ShowTutorialFeedback("Plasma Orb cast! Drains 30 mana.");
					var m = tutMissions.find(function(x) { return x.id === "orb"; });
					if (m && !m.done) {
						m.done = true;
						RenderTutorialMissions();
					}
				} else {
					ShowTutorialFeedback("⚠️ Not enough mana for Plasma Orb!");
				}
			}

			function TriggerTutorialPhantom() {
				if (tp.mana >= 50) {
					tp.mana -= 50;
					tp.phantomActive = true;
					tp.phantomTimer = 180; // 3 seconds
					ShowTutorialFeedback("Phantom Form active! +Speed and Invulnerability.");
					var m = tutMissions.find(function(x) { return x.id === "phantom"; });
					if (m && !m.done) {
						m.done = true;
						RenderTutorialMissions();
					}
				} else {
					ShowTutorialFeedback("⚠️ Not enough mana for Phantom Form!");
				}
			}

			// Loop of Physics and Draw
			function InitTutorialSandbox() {
				if (!tutCanvas) {
					tutCanvas = document.getElementById("tutorialCanvas");
					if (tutCanvas) tutCtx = tutCanvas.getContext("2d");
				}
				if (!tutCanvas) return;

				walkLeftDone = false;
				walkRightDone = false;
				tutMissions.forEach(function(m) { m.done = false; });
				RenderTutorialMissions();

				tp.x = 60;
				tp.y = 120;
				tp.vx = 0;
				tp.vy = 0;
				tp.jumps = 0;
				tp.mana = 100;
				tp.phantomActive = false;
				tp.phantomTimer = 0;
				tp.sparks = [];
				tp.orbs = [];

				function loop() {
					if (!tutActive || tutTab !== "sandbox") {
						tutLoopId = null;
						return;
					}
					update();
					render();
					tutLoopId = requestAnimationFrame(loop);
				}
				tutLoopId = requestAnimationFrame(loop);
			}

			function update() {
				// Horizontal Movement
				var baseSpeed = tp.phantomActive ? 4.5 : 3.0;
				if (tutKeys.A) {
					tp.vx = -baseSpeed;
					tp.facingLeft = true;
					walkLeftDone = true;
				} else if (tutKeys.D) {
					tp.vx = baseSpeed;
					tp.facingLeft = false;
					walkRightDone = true;
				} else {
					tp.vx = 0;
				}

				if (walkLeftDone && walkRightDone) {
					var m = tutMissions.find(function(x) { return x.id === "walk"; });
					if (m && !m.done) {
						m.done = true;
						ShowTutorialFeedback("Walk goals completed!");
						RenderTutorialMissions();
					}
				}

				// Phasing / Ghost Mode logic
				tp.ghostMode = tutKeys.F && tp.mana > 0;
				if (tp.ghostMode) {
					tp.mana = Math.max(0, tp.mana - 0.3); // Continuous drain
				} else {
					tp.mana = Math.min(tp.maxMana, tp.mana + 0.1); // Passive regen
				}

				// Gravity
				tp.vy += 0.35; // Gravity

				tp.x += tp.vx;
				tp.y += tp.vy;

				// Floor collision
				if (tp.y >= 120) {
					tp.y = 120;
					tp.vy = 0;
					tp.jumps = 0;
				}

				// Screen boundaries
				if (tp.x < 0) tp.x = 0;
				if (tp.x + tp.width > tutCanvas.width) tp.x = tutCanvas.width - tp.width;

				// Obstacle Wall: x = 270, width = 20, height = 100 (y = 40 to y = 140)
				var wallX = 270;
				var wallW = 20;
				var wallH = 100;
				var wallY = 140 - wallH;

				if (!tp.ghostMode) {
					// Left-side collision
					if (tp.x + tp.width >= wallX && tp.x < wallX && tp.y + tp.height > wallY) {
						tp.x = wallX - tp.width;
					}
					// Right-side collision
					if (tp.x <= wallX + wallW && tp.x + tp.width > wallX + wallW && tp.y + tp.height > wallY) {
						tp.x = wallX + wallW;
					}
				}

				if (tp.x > 280) {
					var m = tutMissions.find(function(x) { return x.id === "phase"; });
					if (m && !m.done) {
						m.done = true;
						ShowTutorialFeedback("Phased through the barrier! Objective complete.");
						RenderTutorialMissions();
					}
				}

				// Update Projectiles
				tp.sparks.forEach(function(s, idx) {
					s.x += s.vx;
					if (s.x < 0 || s.x > tutCanvas.width) tp.sparks.splice(idx, 1);
				});

				tp.orbs.forEach(function(o, idx) {
					o.x += o.vx;
					if (o.x < 0 || o.x > tutCanvas.width) tp.orbs.splice(idx, 1);
				});

				// Phantom Form Timer
				if (tp.phantomActive) {
					tp.phantomTimer--;
					if (tp.phantomTimer <= 0) {
						tp.phantomActive = false;
						ShowTutorialFeedback("Phantom Form expired.");
					}
				}
			}

			function render() {
				if (!tutCanvas || !tutCtx) return;
				tutCtx.clearRect(0, 0, tutCanvas.width, tutCanvas.height);

				// Draw background Grid
				tutCtx.strokeStyle = "rgba(0, 255, 255, 0.03)";
				tutCtx.lineWidth = 1;
				for (var gx = 0; gx < tutCanvas.width; gx += 20) {
					tutCtx.beginPath();
					tutCtx.moveTo(gx, 0);
					tutCtx.lineTo(gx, tutCanvas.height);
					tutCtx.stroke();
				}
				for (var gy = 0; gy < tutCanvas.height; gy += 20) {
					tutCtx.beginPath();
					tutCtx.moveTo(0, gy);
					tutCtx.lineTo(tutCanvas.width, gy);
					tutCtx.stroke();
				}

				// Draw Floor
				tutCtx.fillStyle = "#161322";
				tutCtx.fillRect(0, 136, tutCanvas.width, tutCanvas.height - 136);
				tutCtx.fillStyle = "var(--cyan-neon)";
				tutCtx.fillRect(0, 136, tutCanvas.width, 2);

				// Draw Wall
				var wallX = 270;
				var wallW = 20;
				var wallY = 40;
				var wallH = 100;
				
				if (tp.ghostMode) {
					tutCtx.fillStyle = "rgba(0, 255, 255, 0.25)";
					tutCtx.fillRect(wallX, wallY, wallW, wallH);
					tutCtx.strokeStyle = "rgba(0, 255, 255, 0.6)";
					tutCtx.strokeRect(wallX, wallY, wallW, wallH);
				} else {
					tutCtx.fillStyle = "rgba(255, 0, 255, 0.4)";
					tutCtx.fillRect(wallX, wallY, wallW, wallH);
					tutCtx.strokeStyle = "var(--magenta-neon)";
					tutCtx.strokeRect(wallX, wallY, wallW, wallH);
				}

				// Draw sparks
				tutCtx.fillStyle = "var(--cyan-neon)";
				tp.sparks.forEach(function(s) {
					tutCtx.beginPath();
					tutCtx.arc(s.x, s.y, 3, 0, Math.PI * 2);
					tutCtx.fill();
				});

				// Draw orbs
				tp.orbs.forEach(function(o) {
					tutCtx.fillStyle = "rgba(180, 0, 255, 0.5)";
					tutCtx.beginPath();
					tutCtx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
					tutCtx.fill();
					tutCtx.strokeStyle = "var(--purple-neon)";
					tutCtx.lineWidth = 1.5;
					tutCtx.stroke();
				});

				// Draw Player
				var ghostImg = tp.facingLeft ? desoGhostLeft : desoGhostRight;
				tutCtx.save();
				if (tp.ghostMode) {
					tutCtx.globalAlpha = 0.45;
					tutCtx.drawImage(ghostImg, tp.x, tp.y, tp.width, tp.height);
					// Draw purple outline around the sprite bounds
					tutCtx.strokeStyle = "var(--purple-neon)";
					tutCtx.lineWidth = 1.5;
					tutCtx.strokeRect(tp.x - 2, tp.y - 2, tp.width + 4, tp.height + 4);
				} else if (tp.phantomActive) {
					// Draw with a golden shadow glow
					tutCtx.shadowColor = "var(--yellow-neon)";
					tutCtx.shadowBlur = 10;
					tutCtx.drawImage(ghostImg, tp.x, tp.y, tp.width, tp.height);
					// Draw yellow outline
					tutCtx.strokeStyle = "var(--yellow-neon)";
					tutCtx.lineWidth = 1.5;
					tutCtx.strokeRect(tp.x - 2, tp.y - 2, tp.width + 4, tp.height + 4);
				} else {
					// Regular ghost with subtle cyan outline
					tutCtx.drawImage(ghostImg, tp.x, tp.y, tp.width, tp.height);
					tutCtx.strokeStyle = "rgba(0, 255, 255, 0.5)";
					tutCtx.lineWidth = 1;
					tutCtx.strokeRect(tp.x - 1, tp.y - 1, tp.width + 2, tp.height + 2);
				}
				tutCtx.restore();

				// Draw HUD inside canvas (Mana bar)
				tutCtx.fillStyle = "#222";
				tutCtx.fillRect(10, 10, 100, 8);
				tutCtx.fillStyle = "var(--purple-neon)";
				tutCtx.fillRect(10, 10, tp.mana, 8);
				tutCtx.strokeStyle = "#FFF";
				tutCtx.strokeRect(10, 10, 100, 8);
				tutCtx.fillStyle = "#FFF";
				tutCtx.font = "8px 'Courier New'";
				tutCtx.fillText("MANA: " + Math.round(tp.mana) + "%", 15, 17);
			}

			// Spells Rune Previewer logic
			function UpdateTutorialRunePreview() {
				var sel = document.getElementById("tutorialRuneSelect");
				var desc = document.getElementById("tutorialRuneDesc");
				var orb = document.getElementById("tutorialRuneOrb");
				if (!sel || !desc || !orb) return;

				var val = sel.value;
				if (val === "arcane") {
					desc.innerHTML = "<strong>Arcane Element (No Rune / Pure Magic):</strong> Amplifies the spell's base damage by 40% with pure ectoplasm. Great for raw immediate damage.";
					orb.style.background = "radial-gradient(circle, #FFF 0%, #D500F9 70%)";
					orb.style.boxShadow = "0 0 20px #D500F9";
				} else if (val === "fire") {
					desc.innerHTML = "<strong>Fire Rune:</strong> Ignites enemies on contact, causing continuous burn damage over 4 seconds.";
					orb.style.background = "radial-gradient(circle, #FFF 0%, #FF5722 70%)";
					orb.style.boxShadow = "0 0 20px #FF5722";
				} else if (val === "cold") {
					desc.innerHTML = "<strong>Ice Rune:</strong> Freezes enemies on impact, reducing their movement speed and attack rate by 50% for 3 seconds.";
					orb.style.background = "radial-gradient(circle, #FFF 0%, #00E5FF 70%)";
					orb.style.boxShadow = "0 0 20px #00E5FF";
				} else if (val === "lightning") {
					desc.innerHTML = "<strong>Lightning Rune:</strong> Discharges an electrical blast that stuns the target enemy for 1.5 seconds, fully immobilizing them.";
					orb.style.background = "radial-gradient(circle, #FFF 0%, #FFD600 70%)";
					orb.style.boxShadow = "0 0 20px #FFD600";
				} else if (val === "poison") {
					desc.innerHTML = "<strong>Poison Rune:</strong> Shoots a corrosive acid mist that reduces the boss's defense by 30% and causes continuous poison damage for 6 seconds.";
					orb.style.background = "radial-gradient(circle, #FFF 0%, #00E676 70%)";
					orb.style.boxShadow = "0 0 20px #00E676";
				}
			}

			function TriggerTutorialRuneBlast() {
				var orb = document.getElementById("tutorialRuneOrb");
				if (!orb) return;
				orb.style.transform = "scale(1.5)";
				setTimeout(function() {
					orb.style.transform = "scale(1.0)";
				}, 150);
			}

			// Blockchain Save Simulator step-by-step logic
			function RunTutorialSaveSimulation() {
				var simBtn = document.getElementById("simSaveBtn");
				var consoleBox = document.getElementById("tutorialConsole");
				if (!simBtn || !consoleBox) return;

				simBtn.disabled = true;
				consoleBox.innerHTML = "";

				// Reset flow nodes
				for (var i = 1; i <= 4; i++) {
					var node = document.getElementById("simNode" + i);
					if (node) {
						node.classList.remove("active", "success");
					}
				}

				// Step 1
				setTimeout(function() {
					var node = document.getElementById("simNode1");
					if (node) node.classList.add("active");
					consoleBox.innerHTML += "> [SYSTEM] Packaging RPG Game State:\n  level: 42, vit: 15, agi: 20, int: 10, pow: 8, mag: 12...\n";
				}, 200);

				// Step 2
				setTimeout(function() {
					var node1 = document.getElementById("simNode1");
					if (node1) { node1.classList.remove("active"); node1.classList.add("success"); }
					var node2 = document.getElementById("simNode2");
					if (node2) node2.classList.add("active");
					consoleBox.innerHTML += "> [ANTI-CHEAT] Generating integrity hash using random salt key:\n  Hash validation matches original save state.\n";
				}, 1000);

				// Step 3
				setTimeout(function() {
					var node2 = document.getElementById("simNode2");
					if (node2) { node2.classList.remove("active"); node2.classList.add("success"); }
					var node3 = document.getElementById("simNode3");
					if (node3) node3.classList.add("active");
					consoleBox.innerHTML += "> [IDENTITY] Derived Key Signature generated:\n  Signing hexadecimal payload via secp256k1 elliptic curve...\n";
				}, 1800);

				// Step 4
				setTimeout(function() {
					var node3 = document.getElementById("simNode3");
					if (node3) { node3.classList.remove("active"); node3.classList.add("success"); }
					var node4 = document.getElementById("simNode4");
					if (node4) node4.classList.add("active");
					consoleBox.innerHTML += "> [NETWORK] Transmitting data (Base64) to DeSo Blockchain node...\n";
				}, 2600);

				// Final
				setTimeout(function() {
					var node4 = document.getElementById("simNode4");
					if (node4) { node4.classList.remove("active"); node4.classList.add("success"); }
					
					var mockPayload = "eyJsZXZlbCI6NDIsInhwIjoxNTAwLCJjaGFyYWN0ZXJJZCI6ImRnX2ZhbnRhc21hIiwiYXR0cmlidXRlcyI6eyJ2aXQiOjE1LCJhZ2kiOjIwLCJpbnQiOjEwLCJwb3ciOjgsIm1hZyI6MTJ9fQ==";
					consoleBox.innerHTML += "\n✅ SUCCESS: Save Post Published! PostHashHex: 5b4c73ef2...\n";
					consoleBox.innerHTML += "> Payload: " + mockPayload + "\n";
					consoleBox.innerHTML += "> Status: SYNCHRONIZED ON BLOCKCHAIN PERMANENTLY 🏆";
					simBtn.disabled = false;
				}, 3500);
			}

			// Expõe as funções globais do tutorial
			window.OpenInteractiveTutorial = OpenInteractiveTutorial;
			window.CloseInteractiveTutorial = CloseInteractiveTutorial;
			window.SwitchTutorialTab = SwitchTutorialTab;
			window.UpdateTutorialRunePreview = UpdateTutorialRunePreview;
			window.TriggerTutorialRuneBlast = TriggerTutorialRuneBlast;
			window.RunTutorialSaveSimulation = RunTutorialSaveSimulation;

			Object.defineProperty(window, 'map', { get: function() { return map; }, configurable: true });
			Object.defineProperty(window, 'DeSoGhost', { get: function() { return DeSoGhost; }, configurable: true });
			Object.defineProperty(window, 'g_boss', { get: function() { return g_boss; }, configurable: true });
			Object.defineProperty(window, 'g_currentLevel', { 
				get: function() { return g_currentLevel; }, 
				set: function(val) { g_currentLevel = val; },
				configurable: true 
			});
			Object.defineProperty(window, 'g_projectiles', { get: function() { return g_projectiles; }, configurable: true });
			Object.defineProperty(window, 'obtainProjectile', { get: function() { return obtainProjectile; }, configurable: true });
			Object.defineProperty(window, 'updateProjectiles', { get: function() { return updateProjectiles; }, configurable: true });

			Object.defineProperty(window, 'g_gameState', {
				get: function() { return g_gameState; },
				set: function(val) { SetGameState(val); },
				configurable: true
			});
			Object.defineProperty(window, 'G_START', {
				get: function() { return G_START; },
				configurable: true
			});
			Object.defineProperty(window, 'StartCutscene', {
				get: function() { return StartCutscene; },
				configurable: true
			});
			Object.defineProperty(window, 'ResetGame', {
				get: function() { return ResetGame; },
				configurable: true
			});
			Object.defineProperty(window, 'g_score', {
				get: function() { return g_score; },
				set: function(val) { 
					g_score = val; 
					if (typeof _antiCheat !== "undefined") {
						_antiCheat.hash = btoa(val + _antiCheat.salt);
					}
				},
				configurable: true
			});
			Object.defineProperty(window, 'g_globalTotalTime', {
				get: function() { return g_globalTotalTime; },
				set: function(val) { g_globalTotalTime = val; },
				configurable: true
			});

			window.DrawWinScreen = DrawWinScreen;
			})(); // Fecha IIFE Caixa Preta
		

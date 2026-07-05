const fs = require('fs');

let engine = fs.readFileSync('js/game/engine.js', 'utf8');

engine = engine.replace(
`  							var sprite = isFacingRight ? desoGhostRight : desoGhostLeft;
  							
  							g_ctx.globalAlpha = 0.5;
  							g_ctx.drawImage(sprite, interpX + map_offset, interpY, 24, 24);
  							g_ctx.globalAlpha = 1.0;
  							
  							if (window.NetworkState.playerNames && window.NetworkState.playerNames[pid]) {
  								g_ctx.fillStyle = "#00FFCC";
  								g_ctx.font = "10px Arial";
  								g_ctx.textAlign = "center";
  								g_ctx.fillText(window.NetworkState.playerNames[pid], interpX + map_offset + 12, interpY - 10);
  							}`,
`  							var sprite = isFacingRight ? desoGhostRight : desoGhostLeft;
  							
  							g_ctx.globalAlpha = 0.5;
  							g_ctx.drawImage(sprite, interpX + map_offset, interpY, 48, 48);
  							g_ctx.globalAlpha = 1.0;
  							
  							if (window.NetworkState.playerNames && window.NetworkState.playerNames[pid]) {
  								g_ctx.fillStyle = "#00FFCC";
  								g_ctx.font = "12px Arial";
  								g_ctx.textAlign = "center";
  								g_ctx.fillText(window.NetworkState.playerNames[pid], interpX + map_offset + 24, interpY - 10);
  							}`
);

engine = engine.replace(
`									} else if (!self.ghostMode && self.phantomFormTimer <= 0) { // Immune during Phantom Form
										if (window.emitBossCollision) window.emitBossCollision();
									}`,
`									} else if (!self.ghostMode && self.phantomFormTimer <= 0) { // Immune during Phantom Form
										if (window.emitBossCollision) window.emitBossCollision();
										self.alive = false;
									}`
);

engine = engine.replace(
`							} else if (!this.ghostMode && this.phantomFormTimer <= 0) { // Immune during Phantom Form
								if (window.emitBossCollision) window.emitBossCollision();
							}`,
`							} else if (!this.ghostMode && this.phantomFormTimer <= 0) { // Immune during Phantom Form
								if (window.emitBossCollision) window.emitBossCollision();
								this.alive = false;
							}`
);

engine = engine.replace(
`			window.AddScore = AddScore;
			window.GetScore = GetScore;
			window.DeductScore = DeductScore;
			var waterFrame = 0, fireFrame = 0, weedFrame = 0, cupFrame = 0, explosionFrame = 0;`,
`			function NetworkSetScore(points) {
				g_score = points;
				_antiCheat.hash = btoa(g_score + _antiCheat.salt);
				g_slimeScoreTracker = 0; // Prevent accidental slime spam from network score sync
			}
			window.AddScore = AddScore;
			window.GetScore = GetScore;
			window.DeductScore = DeductScore;
			window.NetworkSetScore = NetworkSetScore;
			var waterFrame = 0, fireFrame = 0, weedFrame = 0, cupFrame = 0, explosionFrame = 0;`
);

fs.writeFileSync('js/game/engine.js', engine, 'utf8');

let network = fs.readFileSync('js/game/network.js', 'utf8');

network = network.replace(
`    socket.on('update_stats', (stats) => {
        if (typeof window.g_score !== 'undefined') {
            window.g_score = stats.score;
        }
        if (window.GhostRPG && window.GhostRPG.stats) {
            window.GhostRPG.stats.xp = stats.xp;
            window.GhostRPG.stats.level = stats.level;
        }
    });`,
`    socket.on('update_stats', (stats) => {
        if (typeof window.NetworkSetScore === 'function') {
            window.NetworkSetScore(stats.score);
        } else if (typeof window.g_score !== 'undefined') {
            window.g_score = stats.score;
        }
        
        if (window.GhostRPG && window.GhostRPG.stats) {
            if (stats.xp > window.GhostRPG.stats.xp) {
                if (typeof window.GhostRPG.addXp === 'function') {
                    window.GhostRPG.addXp(stats.xp - window.GhostRPG.stats.xp);
                }
            } else {
                window.GhostRPG.stats.xp = stats.xp;
                window.GhostRPG.stats.level = stats.level;
            }
        }
    });`
);

fs.writeFileSync('js/game/network.js', network, 'utf8');
console.log('Patched correctly');

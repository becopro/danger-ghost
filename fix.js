const fs = require('fs');
const file = 'c:/Users/Klara/Desktop/dragaMP/danger ghost/js/game/engine.js';
let content = fs.readFileSync(file, 'utf8');

// Fix 1a
content = content.replace(
	/var fx = g_visualEffects\[i\];\r?\n\s*fx\.life--;/,
	'var fx = g_visualEffects[i];\n\t\t\t\t\tif (!fx) { g_visualEffects.splice(i, 1); continue; }\n\t\t\t\t\tfx.life--;'
);

// Fix 1b
content = content.replace(
	/g_visualEffects\.push\((createExplosionEffect\([^)]+\))\);/g,
	'var _fx = $1; if (_fx) g_visualEffects.push(_fx);'
);
content = content.replace(
	/g_visualEffects\.push\((obtainExplosionEffect\([^)]+\))\);/g,
	'var _fx = $1; if (_fx) g_visualEffects.push(_fx);'
);

// Fix 2
const oldDrawOtherPlayers = /function drawOtherPlayers\(\) \{[\s\S]*?\}\r?\n\s*\}/;
const newDrawOtherPlayers = `function drawOtherPlayers() {
				if (window.NetworkState && window.NetworkState.otherPlayers) {
					for (var id in window.NetworkState.otherPlayers) {
						if (id === window.NetworkState.playerId) continue;
						var pos = window.NetworkState.otherPlayers[id];
						if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number') continue;
						if (window.normalizeLevelName(pos.level) !== window.normalizeLevelName(g_currentLevel)) continue;
						var match = pos.name && pos.name.match(/\\(#(\\w+)\\)/);
						var customSprite = match ? getOtherPlayerGhostSprite(match[1]) : null;
						g_ctx.globalAlpha = 0.85;
						if (customSprite) {
							if (pos.isFacingRight !== false) {
								g_ctx.save();
								g_ctx.translate(pos.x + map_offset + 24, pos.y);
								g_ctx.scale(-1, 1);
								g_ctx.drawImage(customSprite, 0, 0, 24, 24);
								g_ctx.restore();
							} else {
								g_ctx.drawImage(customSprite, pos.x + map_offset, pos.y, 24, 24);
							}
						} else {
							var sprite = pos.isFacingRight !== false ? desoGhostRight : desoGhostLeft;
							g_ctx.drawImage(sprite, pos.x + map_offset, pos.y, 24, 24);
						}
						g_ctx.globalAlpha = 1.0;
						
						if (pos.name) {
							g_ctx.fillStyle = "#00FFCC";
							g_ctx.font = "10px Arial";
							g_ctx.textAlign = "center";
							g_ctx.fillText(pos.name, pos.x + map_offset + 12, pos.y - 10);
						}
					}
				}
			}`;
content = content.replace(oldDrawOtherPlayers, newDrawOtherPlayers);

// Fix 3
const oldGetGhost = /window\.g_otherGhostImages = window\.g_otherGhostImages \|\| \{\};\r?\n\s*function getOtherPlayerGhostSprite\(ghostId\) \{[\s\S]*?return null;\r?\n\s*\}/;
const newGetGhost = `window.g_otherGhostImages = window.g_otherGhostImages || {};
			function getOtherPlayerGhostSprite(ghostId) {
				if (!ghostId) return null;
				var cached = window.g_otherGhostImages[ghostId];
				if (cached) {
					if (cached._failed) return null;
					return (cached.complete && cached.naturalWidth > 0) ? cached : null;
				}
				var img = new Image();
				img._failed = false;
				img.src = 'Ghosts/%23' + ghostId + '.png';
				img.onerror = function() {
					var fb1 = new Image();
					fb1._failed = false;
					fb1.src = 'Ghosts/' + ghostId + '.png';
					fb1.onerror = function() {
						var fb2 = new Image();
						fb2._failed = false;
						fb2.src = 'assets/sprites/ghost_' + ghostId + '_r.webp';
						fb2.onerror = function() { fb2._failed = true; };
						window.g_otherGhostImages[ghostId] = fb2;
					};
					window.g_otherGhostImages[ghostId] = fb1;
				};
				window.g_otherGhostImages[ghostId] = img;
				return null;
			}`;
content = content.replace(oldGetGhost, newGetGhost);

// Fix 6
const oldSparks = /tp\.sparks\.forEach\(function\(s,\s*idx\)\s*\{[\s\S]*?\}\);/;
const newSparks = `for (var si = tp.sparks.length - 1; si >= 0; si--) {
					var s = tp.sparks[si];
					s.x += s.vx;
					if (s.x < 0 || s.x > tutCanvas.width) tp.sparks.splice(si, 1);
				}`;
content = content.replace(oldSparks, newSparks);

const oldOrbs = /tp\.orbs\.forEach\(function\(o,\s*idx\)\s*\{[\s\S]*?\}\);/;
const newOrbs = `for (var oi = tp.orbs.length - 1; oi >= 0; oi--) {
					var o = tp.orbs[oi];
					o.x += o.vx;
					if (o.x < 0 || o.x > tutCanvas.width) tp.orbs.splice(oi, 1);
				}`;
content = content.replace(oldOrbs, newOrbs);

fs.writeFileSync(file, content, 'utf8');
console.log('Modifications applied via script.');

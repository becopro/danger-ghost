const fs = require('fs');

let engine = fs.readFileSync('www/js/game/engine.js', 'utf8');

// 1. Add global g_map_y_offset
engine = engine.replace('var g_gameState = 0;', 'var g_gameState = 0;\n\t\t\tvar g_map_y_offset = 0;');

// 2. Add Resize function
const resizeLogic = 
			function ResizeMobileCanvas() {
				if (document.body.classList.contains("is-mobile-app")) {
					var viewportHeight = window.innerHeight;
					var viewportWidth = window.innerWidth;
					// Controls container is ~55vh, so canvas area is ~45vh
					var canvasPhysicalHeight = viewportHeight * 0.45;
					// Maintain 640 logical width
					var logicalWidth = 640;
					var logicalHeight = logicalWidth * (canvasPhysicalHeight / viewportWidth);
					
					g_canvas.width = logicalWidth;
					g_canvas.height = Math.round(logicalHeight);
					
					var mapHeight = 11 * 24; // 264
					var hudHeight = 35;
					var availableSpace = g_canvas.height - hudHeight;
					g_map_y_offset = availableSpace > mapHeight ? (availableSpace - mapHeight) : 0;
				} else {
					g_canvas.width = 640;
					g_canvas.height = 300;
					g_map_y_offset = 0;
				}
			}
			window.addEventListener('resize', ResizeMobileCanvas);
			ResizeMobileCanvas(); // Initial call
;

engine = engine.replace('var g_canvas = document.getElementById("myCanvas");\r\n\t\t\tvar g_ctx = g_canvas.getContext("2d");', 
	'var g_canvas = document.getElementById("myCanvas");\n\t\t\tvar g_ctx = g_canvas.getContext("2d");\n' + resizeLogic);

// 3. In Game_Step_Render, apply g_ctx.translate(0, g_map_y_offset) around the map/player rendering.
engine = engine.replace('drawBinaryBackground(false);\r\n\t\t\t\t\tmap.draw();',
	'drawBinaryBackground(false);\n\t\t\t\t\tg_ctx.save();\n\t\t\t\t\tg_ctx.translate(0, g_map_y_offset);\n\t\t\t\t\tmap.draw();');

engine = engine.replace('drawVisualEffects();\r\n\t\t\t\t\tPrint_HUD();',
	'drawVisualEffects();\n\t\t\t\t\tg_ctx.restore();\n\t\t\t\t\tPrint_HUD();');

// Also for the other branch (paused state, etc, wait, no, the main branch is enough, let's just do it for all if needed, but the HUD is outside the translate).
// Wait, clickY in inspect player needs offset:
engine = engine.replace('var py = p0.position.y;', 'var py = p0.position.y + (window.g_map_y_offset || 0);');

fs.writeFileSync('www/js/game/engine.js', engine);
console.log('engine.js patched');


const fs = require('fs');
let html = fs.readFileSync('www/index.html', 'utf8');

const regex = /\/\/\s*Start the game right away\s*if\s*\(typeof\s*window\.StartCutscene\s*===\s*'function'\)\s*\{\s*window\.StartCutscene\(\);\s*\}/;

const replaceTarget = `// Start the game right away
            if (typeof window.StartCutscene === 'function') {
                var savedLevel = localStorage.getItem("dg_saved_level");
                var startLevel = 1;
                if (savedLevel && !isNaN(parseInt(savedLevel))) {
                    startLevel = parseInt(savedLevel);
                }
                window.StartCutscene(startLevel, false);
            }`;

if (regex.test(html)) {
    html = html.replace(regex, replaceTarget);
    fs.writeFileSync('www/index.html', html, 'utf8');
    console.log("Successfully replaced StartMobileGame logic in index.html");
} else {
    console.error("Could not find target in index.html");
}

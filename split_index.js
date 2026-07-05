const fs = require('fs');

const htmlPath = 'C:/Users/Klara/Desktop/dragaMP/danger ghost/index.html';
const html = fs.readFileSync(htmlPath, 'utf8');

// Replace style
const styleRegex = /<style>([\s\S]*?)<\/style>/i;
const styleMatch = html.match(styleRegex);
let newHtml = html;
if (styleMatch) {
    fs.writeFileSync('C:/Users/Klara/Desktop/dragaMP/danger ghost/css/style.css', styleMatch[1]);
    newHtml = newHtml.replace(styleRegex, '<link rel="stylesheet" href="css/style.css">');
    console.log('Extracted CSS');
}

// Find inline scripts (without src)
const scriptRegex = /<script\b(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let scriptCount = 0;
let scriptsToExtract = [];

while ((match = scriptRegex.exec(html)) !== null) {
    scriptCount++;
    scriptsToExtract.push({
        fullMatch: match[0],
        innerCode: match[1],
        index: match.index
    });
}

if (scriptsToExtract.length > 0) {
    // script 1 -> globals.js
    fs.writeFileSync('C:/Users/Klara/Desktop/dragaMP/danger ghost/js/globals.js', scriptsToExtract[0].innerCode);
    newHtml = newHtml.replace(scriptsToExtract[0].fullMatch, '<script src="js/globals.js"></script>');
    console.log('Extracted globals.js');
}

if (scriptsToExtract.length > 1) {
    // script 2 -> main.js
    fs.writeFileSync('C:/Users/Klara/Desktop/dragaMP/danger ghost/js/main.js', scriptsToExtract[1].innerCode);
    newHtml = newHtml.replace(scriptsToExtract[1].fullMatch, '<script src="js/main.js"></script>');
    console.log('Extracted main.js');
}

fs.writeFileSync(htmlPath, newHtml);
console.log('Done rewriting index.html');

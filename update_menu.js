const fs = require('fs');
let html = fs.readFileSync('www/index.html', 'utf8');
html = html.replace(/<div id="mobileMainMenu" style="([^"]+)">/, (match, style) => { 
    return `<div id="mobileMainMenu" style="${style.replace('background: #000;', 'background: url(\'assets/menu_bg.png\') center/cover no-repeat #000;').replace('padding-top: 20px;', 'padding-top: 30vh;')}">`; 
}); 
html = html.replace(/<h1 style="[^"]+">DANGER GHOST<\/h1>/, '<!-- DANGER GHOST title removed to use the background art text -->'); 
fs.writeFileSync('www/index.html', html, 'utf8'); 
console.log('Done');

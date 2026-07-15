const fs = require('fs');
let html = fs.readFileSync('www/index.html', 'utf8');

// The regex will match the sequence of elements and insert the closing divs.
// Because CRLF or spacing can vary, we just insert </div> right before the next sibling.

// 1. Close rpgPanel (before <div id="chatPanel")
html = html.replace(/(<div id="rpgPanelContent"><\/div>\s*)(<div id="chatPanel")/s, '$1</div>\n            $2');

// 2. Close chatPanel (before <div id="navbarPanel")
html = html.replace(/(<input type="text" id="chatNickInput"[^>]*\/>\s*<\/div>\s*)(<div id="navbarPanel")/s, '$1</div>\n            $2');

// 3. Close navbarPanel (before </div> that closes mobilePanelsContainer)
html = html.replace(/(<div id="navbarPanelContent"><\/div>\s*)(<\/div>\s*<div id="mobileActionBtns")/s, '$1</div>\n        $2');

fs.writeFileSync('www/index.html', html, 'utf8');
console.log("Regex replace attempted on index.html");

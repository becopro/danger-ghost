const fs = require('fs');

let html = fs.readFileSync('www/index.html', 'utf8');

// The current style for mobileInGameMenuBtn:
// position: fixed; top: 10px; right: 10px; z-index: 9000; background: rgba(0,0,0,0.7); border: 2px solid #00FFFF; color: #00FFFF; padding: 8px 15px; font-size: 12px; font-weight: bold; border-radius: 5px; box-shadow: 0 0 10px #00FFFF; display: none;

html = html.replace(
    /top: 10px; right: 10px;/g,
    'bottom: 20px; left: 20px; top: auto; right: auto;'
);

// Optional: Increase font size slightly so it's easier to tap in the bottom corner
html = html.replace(
    /padding: 8px 15px; font-size: 12px;/g,
    'padding: 10px 20px; font-size: 14px;'
);

fs.writeFileSync('www/index.html', html, 'utf8');
console.log('Menu button moved to bottom-left.');

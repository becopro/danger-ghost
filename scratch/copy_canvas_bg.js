const fs = require('fs');
const path = require('path');

const src = 'C:\\Users\\Klara\\.gemini\\antigravity\\brain\\73128005-d441-4e6b-a882-d75f3c121e0c\\media__1782078114253.jpg';
const dest = path.join(__dirname, '..', 'assets', 'sprites', 'canvas_bg.jpg');

fs.copyFileSync(src, dest);
console.log('Canvas background image copied to', dest);

const fs = require('fs');
const path = require('path');

const src = 'C:\\Users\\Klara\\.gemini\\antigravity\\brain\\73128005-d441-4e6b-a882-d75f3c121e0c\\media__1782076932119.jpg';
const dest = path.join(__dirname, '..', 'assets', 'sprites', 'site_bg.jpg');

fs.copyFileSync(src, dest);
console.log('Background image copied to', dest);

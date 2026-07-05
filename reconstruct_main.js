const fs = require('fs');

const backupHtml = fs.readFileSync('C:/Users/Klara/Desktop/dragaMP/danger ghost/index_backup.html', 'utf8');

// Find the giant script block (from line 1621 to 6780 roughly)
// It's the one starting with `(function() { // Caixa Preta`
const scriptRegex = /<script>\s*(\(function\(\) \{\s*\/\/\s*Caixa Preta[\s\S]*?)\<\/script>/i;
const match = backupHtml.match(scriptRegex);

if (match) {
    let mainJsCode = match[1];
    
    // Replace .png with .webp for sprites
    mainJsCode = mainJsCode.replace(/assets\/sprites\/(.+?)\.png/g, 'assets/sprites/$1.webp');
    
    fs.writeFileSync('C:/Users/Klara/Desktop/dragaMP/danger ghost/js/main.js', mainJsCode);
    console.log('Restored main.js successfully');
} else {
    console.log('Failed to find main script block in backup');
}

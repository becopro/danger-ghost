const fs = require('fs');

// 1. Update index.html
let html = fs.readFileSync('www/index.html', 'utf8');

// The current padding in index.html is 'padding-top: 24vh; padding-bottom: 15vh; box-sizing: border-box;"'
html = html.replace(
    /padding-top: 24vh; padding-bottom: 15vh; box-sizing: border-box;"/g,
    'padding-top: 18vh; padding-bottom: 10vh; box-sizing: border-box;"'
);

// We also have 'margin-top: auto; padding-bottom: 5vh; width: 100%;"' for action buttons
// I will change it to padding-bottom: 2vh to let the container's 10vh handle the main spacing, 
// or just keep it and adjust the main container.
// Actually, let's just make padding-bottom: 0vh on the action buttons div so it sits exactly at the container's padding-bottom.
html = html.replace(
    /margin-top: auto; padding-bottom: 5vh; width: 100%;"/g,
    'margin-top: auto; padding-bottom: 0; width: 100%;"'
);

fs.writeFileSync('www/index.html', html, 'utf8');


// 2. Update style.css
let css = fs.readFileSync('www/css/style.css', 'utf8');

css = css.replace(
    /width: 95% !important;\s*height: auto !important;\s*min-height: 50vh !important;/g,
    'width: 98% !important;\n        height: auto !important;\n        min-height: 65vh !important;\n        max-height: 68vh !important;'
);

// Also let's boost some font sizes in the panels if needed, but changing the height might be enough for now.

fs.writeFileSync('www/css/style.css', css, 'utf8');

console.log('Menu layout and panel sizes updated.');

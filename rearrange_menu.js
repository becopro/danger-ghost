const fs = require('fs');
let html = fs.readFileSync('www/index.html', 'utf8');

// Update mobileMainMenu padding
html = html.replace(
    /padding-top: 30vh; box-sizing: border-box;"/g,
    'padding-top: 24vh; padding-bottom: 15vh; box-sizing: border-box;"'
);

// Update mobileActionBtns padding to keep them above the bottom line
html = html.replace(
    /margin-top: auto; padding-bottom: 20px; width: 100%;"/g,
    'margin-top: auto; padding-bottom: 5vh; width: 100%;"'
);

// To ensure top buttons are exactly where requested, let's also tweak their container margin if needed, but the padding-top: 24vh on main container should push them right under the top line.
// And the bottom padding on the main container + action btns will push the bottom buttons up.

fs.writeFileSync('www/index.html', html, 'utf8');
console.log('Menu layout updated.');

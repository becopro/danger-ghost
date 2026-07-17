const fs = require('fs');
const file = 'www/index.html';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/v=20260715/g, 'v=20260717');
content = content.replace(/v=20260715_8/g, 'v=20260717_1');
content = content.replace(/v=25/g, 'v=26');

fs.writeFileSync(file, content, 'utf8');
console.log('Update index.html cache busters completed.');

const fs = require('fs');
let html = fs.readFileSync('www/index.html', 'utf8');

const regex = /(if\s*\(\s*document\.body\.classList\.contains\('is-mobile-app'\)\s*\)\s*\{)/;
const replacement = `$1
                if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.NavigationBar) {
                    window.Capacitor.Plugins.NavigationBar.hide().catch(e => console.error("Error hiding nav bar:", e));
                }`;

if (regex.test(html)) {
    html = html.replace(regex, replacement);
    fs.writeFileSync('www/index.html', html, 'utf8');
    console.log("Successfully injected NavigationBar.hide() into index.html");
} else {
    console.error("Could not find insertion point in index.html");
}

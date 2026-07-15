const fs = require('fs');

try {
    let content = fs.readFileSync('www/index.html', 'utf8');

    const regex = /<div id="mobilePanelsContainer"[\s\S]*?<\/div>\s*<\/div>\s*<div id="mobileActionBtns"/;
    
    const newContent = `<div id="mobilePanelsContainer" style="flex: 1; width: 100%; display: flex; justify-content: center; overflow-y: auto; overflow-x: hidden; position: relative;">
            <div id="rpgPanel" class="overlay-panel panel-left" style="display: none;">
                <div id="rpgPanelContent"></div>
            </div>

            <div id="chatPanel" class="overlay-panel panel-left" style="display: none;">
                <h3 class="panel-header">💬 GLOBAL CHAT</h3>
                <div class="chat-nick-row">
                    <span>NICK:</span>
                    <input type="text" id="chatNickInput" placeholder="GUEST_GHOST" />
                </div>
                <div id="chatMessages" class="chat-log"></div>
                <div class="chat-input-row">
                    <input type="text" id="chatMsgInput" placeholder="TYPE MESSAGE..." />
                    <button id="chatSendBtn">SEND</button>
                </div>
            </div>

            <div id="navbarPanel" class="overlay-panel panel-right" style="display: none;">
                <div id="navbarPanelContent"></div>
            </div>
        </div>

        <div id="mobileActionBtns"`;

    if (regex.test(content)) {
        content = content.replace(regex, newContent);
        fs.writeFileSync('www/index.html', content, 'utf8');
        console.log('Fixed index.html successfully');
    } else {
        console.log('COULD NOT FIND REGEX MATCH');
    }
} catch (err) {
    console.error(err);
}

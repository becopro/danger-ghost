import re
import sys

def main():
    try:
        with open('www/index.html', 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading index.html: {e}")
        return

    # Extract panels
    def extract_tag(html, start_tag_pattern):
        match = re.search(start_tag_pattern, html)
        if not match: return None, html
        start_idx = match.start()
        
        idx = start_idx + 1
        depth = 0
        
        while idx < len(html):
            if html[idx:idx+4] == '<div':
                depth += 1
                idx += 4
            elif html[idx:idx+5] == '</div':
                depth -= 1
                idx += 5
                if depth == 0:
                    end_idx = html.find('>', idx) + 1
                    return html[start_idx:end_idx], html[:start_idx] + html[end_idx:]
            else:
                idx += 1
        return None, html

    rpg_panel, content = extract_tag(content, r'<div\s+id=\"rpgPanel\"[^>]*>')
    chat_panel, content = extract_tag(content, r'<div\s+id=\"chatPanel\"[^>]*>')
    navbar_panel, content = extract_tag(content, r'<div\s+id=\"navbarPanel\"[^>]*>')

    # 2. Modify mobileMainMenu
    old_main_menu_start = '<div id=\"mobileMainMenu\" style=\"position: fixed; top:0; left:0; width:100vw; height:100vh; background: #000; z-index: 9999; display: none; flex-direction: column; justify-content: center; align-items: center; gap: 20px;\">'
    new_main_menu_start = '<div id=\"mobileMainMenu\" style=\"position: fixed; top:0; left:0; width:100vw; height:100vh; background: #000; z-index: 9999; display: none; flex-direction: column; justify-content: flex-start; align-items: center; gap: 15px; padding-top: 20px; box-sizing: border-box;\">'
    content = content.replace(old_main_menu_start, new_main_menu_start)

    old_btns = """        <div id="mobileMainMenuGameBtns" style="display: none; flex-wrap: wrap; justify-content: center; gap: 10px; margin-bottom: 10px; max-width: 90%;">
            <button onclick="LoginGoogle(); document.getElementById('mobileMainMenu').style.display='none';" style="padding: 10px; border: 1px solid #00FFFF; background: #111; color: #00FFFF; border-radius: 5px; font-weight: bold;">🔑 LOGIN</button>
            <button onclick="ToggleNavbarTab('controls'); document.getElementById('mobileMainMenu').style.display='none';" style="padding: 10px; border: 1px solid #00FFFF; background: #111; color: #00FFFF; border-radius: 5px; font-weight: bold;">🎮 CTRL</button>
            <button onclick="ToggleNavbarTab('rpg'); document.getElementById('mobileMainMenu').style.display='none';" style="padding: 10px; border: 1px solid #00FFFF; background: #111; color: #00FFFF; border-radius: 5px; font-weight: bold;">👤 STAT</button>
            <button onclick="ToggleNavbarTab('spells'); document.getElementById('mobileMainMenu').style.display='none';" style="padding: 10px; border: 1px solid #00FFFF; background: #111; color: #00FFFF; border-radius: 5px; font-weight: bold;">⚡ SPL</button>
            <button onclick="ToggleNavbarTab('bag'); document.getElementById('mobileMainMenu').style.display='none';" style="padding: 10px; border: 1px solid #00FFFF; background: #111; color: #00FFFF; border-radius: 5px; font-weight: bold;">🎒 BAG</button>
            <button onclick="ToggleNavbarTab('equip'); document.getElementById('mobileMainMenu').style.display='none';" style="padding: 10px; border: 1px solid #00FFFF; background: #111; color: #00FFFF; border-radius: 5px; font-weight: bold;">⚔️ EQP</button>
            <button onclick="ToggleNavbarTab('chat'); document.getElementById('mobileMainMenu').style.display='none';" style="padding: 10px; border: 1px solid #00FFFF; background: #111; color: #00FFFF; border-radius: 5px; font-weight: bold;">💬 CHT</button>
        </div>

        <button onclick="window.TriggerRPGSaveToDeSo(); document.getElementById('mobileMainMenu').style.display='none';" id="mobileSaveBtn" style="background: #001100; border: 3px solid #00FF00; color: #00FF00; padding: 20px 60px; font-size: 26px; font-weight: bold; font-family: 'Orbitron', sans-serif; cursor: pointer; text-transform: uppercase; box-shadow: 0 0 20px rgba(0,255,0,0.8); display: none; margin-bottom: 10px;">💾 SAVE</button>

        <button onclick="ShowMobileNameInput()" id="mobileEpisode1Btn" style="background: transparent; border: 2px solid #00FFFF; color: #00FFFF; padding: 15px 40px; font-size: 20px; font-family: 'Orbitron', sans-serif; cursor: pointer; text-transform: uppercase; box-shadow: 0 0 15px rgba(0,255,255,0.5);">Episode 1</button>
        <button onclick="ResumeMobileGame()" id="mobileResumeBtn" style="background: transparent; border: 2px solid #FFFF00; color: #FFFF00; padding: 15px 40px; font-size: 20px; font-family: 'Orbitron', sans-serif; cursor: pointer; text-transform: uppercase; box-shadow: 0 0 15px rgba(255,255,0,0.5); display: none;">Resume Game</button>
        <button onclick="ExitMobileApp()" style="background: transparent; border: 2px solid #FF00FF; color: #FF00FF; padding: 15px 40px; font-size: 20px; font-family: 'Orbitron', sans-serif; cursor: pointer; text-transform: uppercase; box-shadow: 0 0 15px rgba(255,0,255,0.5);">Exit</button>"""

    new_btns = f"""        <div id="mobileMainMenuGameBtns" style="display: none; flex-wrap: wrap; justify-content: center; gap: 8px; margin-bottom: 5px; max-width: 95%;">
            <button onclick="LoginGoogle();" style="padding: 8px; border: 1px solid #00FFFF; background: #111; color: #00FFFF; border-radius: 5px; font-weight: bold;">🔑 LOGIN</button>
            <button onclick="ToggleNavbarTab('controls');" style="padding: 8px; border: 1px solid #00FFFF; background: #111; color: #00FFFF; border-radius: 5px; font-weight: bold;">🎮 CTRL</button>
            <button onclick="ToggleNavbarTab('rpg');" style="padding: 8px; border: 1px solid #00FFFF; background: #111; color: #00FFFF; border-radius: 5px; font-weight: bold;">👤 STAT</button>
            <button onclick="ToggleNavbarTab('spells');" style="padding: 8px; border: 1px solid #00FFFF; background: #111; color: #00FFFF; border-radius: 5px; font-weight: bold;">⚡ SPL</button>
            <button onclick="ToggleNavbarTab('bag');" style="padding: 8px; border: 1px solid #00FFFF; background: #111; color: #00FFFF; border-radius: 5px; font-weight: bold;">🎒 BAG</button>
            <button onclick="ToggleNavbarTab('equip');" style="padding: 8px; border: 1px solid #00FFFF; background: #111; color: #00FFFF; border-radius: 5px; font-weight: bold;">⚔️ EQP</button>
            <button onclick="ToggleNavbarTab('chat');" style="padding: 8px; border: 1px solid #00FFFF; background: #111; color: #00FFFF; border-radius: 5px; font-weight: bold;">💬 CHT</button>
        </div>

        <div id="mobilePanelsContainer" style="flex: 1; width: 100%; display: flex; justify-content: center; overflow-y: auto; overflow-x: hidden; position: relative;">
            {rpg_panel}
            {chat_panel}
            {navbar_panel}
        </div>

        <div id="mobileActionBtns" style="display: flex; flex-direction: column; align-items: center; gap: 10px; margin-top: auto; padding-bottom: 20px; width: 100%;">
            <button onclick="window.TriggerRPGSaveToDeSo();" id="mobileSaveBtn" style="background: #001100; border: 3px solid #00FF00; color: #00FF00; padding: 15px 40px; font-size: 20px; font-weight: bold; font-family: 'Orbitron', sans-serif; cursor: pointer; text-transform: uppercase; box-shadow: 0 0 20px rgba(0,255,0,0.8); display: none;">💾 SAVE</button>
            <button onclick="ShowMobileNameInput()" id="mobileEpisode1Btn" style="background: transparent; border: 2px solid #00FFFF; color: #00FFFF; padding: 12px 30px; font-size: 16px; font-family: 'Orbitron', sans-serif; cursor: pointer; text-transform: uppercase; box-shadow: 0 0 15px rgba(0,255,255,0.5);">Episode 1</button>
            <button onclick="ResumeMobileGame()" id="mobileResumeBtn" style="background: transparent; border: 2px solid #FFFF00; color: #FFFF00; padding: 12px 30px; font-size: 16px; font-family: 'Orbitron', sans-serif; cursor: pointer; text-transform: uppercase; box-shadow: 0 0 15px rgba(255,255,0,0.5); display: none;">Resume Game</button>
            <button onclick="ExitMobileApp()" style="background: transparent; border: 2px solid #FF00FF; color: #FF00FF; padding: 12px 30px; font-size: 16px; font-family: 'Orbitron', sans-serif; cursor: pointer; text-transform: uppercase; box-shadow: 0 0 15px rgba(255,0,255,0.5);">Exit</button>
        </div>"""

    if old_btns in content:
        content = content.replace(old_btns, new_btns)
        with open('www/index.html', 'w', encoding='utf-8') as f:
            f.write(content)
        print('Updated index.html successfully')
    else:
        print('COULD NOT FIND OLD BTNS')

if __name__ == '__main__':
    main()

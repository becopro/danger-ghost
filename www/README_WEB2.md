# Danger Ghost — Web2 Architecture

## Overview

Danger Ghost is a 33-level platformer RPG. This version (`v2.0.0`) has been migrated from a DeSo blockchain-dependent Web3 architecture to a clean, standalone Web2 system with full offline support and multi-platform preparation.

## Key Architecture Changes

### Removed
- `js/web3/deso_api.js` — DeSo blockchain API (archived to `_archive/`)
- DeSo identity iframe and login popup flow
- All NFT mint/burn operations
- Blockchain-based character save/load
- Online leaderboard via DeSo posts

### Added / Replaced
| Old | New |
|---|---|
| `js/web3/deso_api.js` | `js/web2/game_core.js` |
| DeSo NFT character creation | Local random character generation (3 slots) |
| Blockchain save state | `localStorage` save state (`dg_local_characters`) |
| DeSo high scores | Local leaderboard (`dg_leaderboard`, top 10) |
| Token-gating VIP access | Open access (`g_hasCreatorCoin = true` always) |

## File Structure

```
js/
  web2/
    game_core.js   — Local auth, character creation, save/load
    scores.js      — Local leaderboard + SyncScoreToServer() stub
  ui/
    ui_manager.js  — UI rendering (no blockchain calls)
  game/
    engine.js      — Game loop (cleaned of dead DeSo code)
  core/
    event_bus.js   — Event system
rpg_system.js      — RPG logic (stats, leveling, items — unchanged)
index.html         — Entry point
_archive/
  deso_api.js.bak  — Original DeSo integration (reference only)
```

## localStorage Keys

| Key | Purpose |
|---|---|
| `dg_local_characters` | Array of saved Ghost character objects (max 3) |
| `dg_deso_public_key` | Local player key (`LOCAL_PLAYER_KEY`) |
| `dg_deso_character_id` | Last selected character ID |
| `dg_leaderboard` | Top 10 local high scores |
| `dg_soul_essence` | Soul Essence points for evolved ghost creation |
| `DangerGhost_RPG_Save` | Legacy LZ-compressed game state (compatibility) |

## Running Locally

```bash
npm run dev
# Opens http://localhost:3000
```

## Future: Desktop with Electron

Electron is listed in `devDependencies`. Once installed:

```bash
npm install
npm run electron
```

You will need to create `main.js` as the Electron entry point:

```js
const { app, BrowserWindow } = require('electron');
const path = require('path');

app.whenReady().then(() => {
  const win = new BrowserWindow({ width: 1024, height: 768 });
  win.loadFile('index.html');
});
```

## API Sync Stub

`js/web2/scores.js` exports `SyncScoreToServer(characterId, score, level, name)`.
This is a no-op stub ready for future REST backend integration.
Implement the `fetch()` call inside this function when a backend is available.

## Migration History

| Phase | Description | Status |
|---|---|---|
| 1 | Audit & Interface Shim (`game_core.js` mock) | ✅ Done |
| 2 | Remove Web3 UI & clean HTML | ✅ Done |
| 3 | Local random character generation (3 slots) | ✅ Done |
| 4 | Local leaderboard + score hook | ✅ Done |
| 5 | Final cleanup & multi-platform prep | ✅ Done |

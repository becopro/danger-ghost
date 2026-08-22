---
name: crossplatform-deploy
description: Use whenever a client-side change (gameplay, auth, UI) needs to ship to both the website and the Android app, or when deploying a server change to the production VPS. Covers mirroring a fix to mobile, rebuilding the APK, cache-busting, and the exact production deploy steps for this project's hosting setup.
---

# Shipping a change to both platforms and to production

Danger Ghost is one backend serving two clients (`danger ghost/` website, `danger_ghost_mobile/` Android app via Capacitor) that do **not** share files — a fix in one does not exist in the other until it's manually mirrored and rebuilt. This skill is the checklist for getting a change genuinely live everywhere, not just on the website.

## 1. Identify what actually needs mirroring
A `server/*.js` change needs no mirroring — both clients talk to the same backend. A `js/...` or `rpg_system.js` change on the website almost always needs a mirror in `danger_ghost_mobile/www/js/...` — check the equivalent path there. **Do not assume the mobile file is byte-identical** — read it before patching; this project's mobile and web copies have genuine, deliberate differences in places (extra guard clauses, different alert flows), and blind-copying a diff has caused a real bug here before.

## 2. Watch for two decoy locations (do not edit, do not debug "why didn't my fix apply")
- `danger_ghost_mobile/` files **outside** `www/` (root-level `index.html`, `rpg_system.js`, etc.) — an abandoned prototype, never part of the shipped app. Only `www/` gets packaged (`capacitor.config.json`'s `webDir`).
- `danger ghost/www/` (inside the website repo) — a separate abandoned Capacitor experiment. The live website loads its root-level `js/...`, not this folder.

## 3. Rebuild the Android APK after any mobile `www/` change
```
cd danger_ghost_mobile
npx cap sync android
cd android
./gradlew assembleDebug
```
JDK 21 (the default) works fine — no special JAVA_HOME juggling needed. Then copy the output to **both** places the game ships from:
```
cp android/app/build/outputs/apk/debug/app-debug.apk ../danger_ghost_mobile/DangerGhostMobile.apk
cp android/app/build/outputs/apk/debug/app-debug.apk "../danger ghost/DangerGhostMobile.apk"
```
The website is the download page for the APK — copying to only one location means players keep downloading a stale build.

## 4. Cache-bust every changed file on the website
`danger ghost/index.html` loads scripts with `?v=NN` query strings and the APK download link the same way. Bump the version number for **every file you actually changed** (including the APK link itself, if it changed) — browsers and the mobile WebView both cache aggressively; an unbumped version means the fix silently never loads for a returning visitor.

## 5. Test locally before touching production
For mobile, point `danger_ghost_mobile/www/js/game/network.js`'s `BACKEND_URL` at `http://localhost:3000` temporarily, serve `www/` with a minimal static file server, and drive it against a locally-running `server/index.js` (see the `e2e-db-verification` skill). **Always `git diff` after reverting `BACKEND_URL` back to `https://ghostgames.club`** to confirm the revert is genuinely clean before committing anything else.

## 6. Git: two repos, two different rules
- `danger ghost/` → commit, then **push to `origin/main` only with the human's explicit go-ahead each time** — approval doesn't carry over from a previous push.
- `danger_ghost_mobile/` → commit **locally only**. Its history has diverged from any shared remote; never push without being explicitly told to.
- If a new dependency was added (`npm install` in `server/`), remember `node_modules/` is gitignored here — only `package.json`/`package-lock.json` travel in the commit, which means the **production deploy needs an `npm install` step**, not just `git pull`.

## 7. Production deploy (VPS console)
```
cd /home/becopro/danger-ghost/server
git pull
npm install        # only if a dependency changed this deploy — harmless to run anyway
pm2 restart ghost   # process name is "ghost", not "danger-ghost-server" — check `pm2 list` if unsure
pm2 logs ghost --lines 20
```
**The remote console's keyboard drops Shift** — `~` silently becomes `` ` ``, breaking `cd ~/...`; use the absolute path (`/home/becopro/...`) instead of `~` to sidestep this entirely, and avoid typing `_`/uppercase where an all-lowercase alternative exists (this is also why this project's env vars are named `dbhost`/`jwtsecret` and not `DB_HOST`/`JWT_SECRET`).

## 8. After deploy
Read `pm2 logs` for genuine errors (not routine `[Socket] Player connected/disconnected` noise or `[Save] Rejected: Player not authenticated` for a guest — that's expected). Then do the real cross-device test from the `e2e-db-verification` skill against production, not just locally — a local pass doesn't guarantee the deployed environment variables and build are actually correct.

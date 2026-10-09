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
- `danger ghost/` → **production does NOT follow `main`.** It follows a deploy branch (e.g. `fix/legacy-reset`, then `fix/cliente-final`), because `main` carries work that is deliberately held back from production (e.g. the OG seal). Work on a branch made from the commit that is live in production, never from `main`. Commit files by name (never `git add .`; never commit the untracked `.claude/` files). **Push only with the human's explicit go-ahead each time** — approval doesn't carry over from a previous push. Before pushing, show `git log origin/<branch>..HEAD --oneline` and `git diff --stat`. Never force-push. The repo is public: no commit messages or comments that describe security weaknesses.
- `danger_ghost_mobile/` → commit **locally only**. Its history has diverged from any shared remote; never push without being explicitly told to.
- If a new dependency was added in `server/`, remember `node_modules/` is gitignored — only `package.json`/`package-lock.json` travel in the commit, so the deploy needs an install step on the VPS. **Stop and ask the human first** (see §7).

## 7. Production deploy of the game (VPS)
Two apps run on the same VPS: pm2 `ghost` (this game, `/home/becopro/danger-ghost`) and pm2 `legacy` (the separate `ghostgames-onchain` service, deployed its own way). **Never deploy both at the same time.** Every command on the VPS needs the human's explicit OK; the human runs them in their own terminal (`ssh -i "$HOME\.ssh\becopro_vps" becopro@<IP>`, IP in `dragaMP/saida_noite/D1_RUNBOOK.md`). Never read or print `.env`, `server/.jwtsecret` or any other secret.

**On the VPS the local branch is called `main` but points at the production commit.** Deploy = fetch + reset to the exact commit. **Never `git pull`** (it would merge GitHub's `main` into production), and never `deploy.sh` (wrong pm2 name, unpinned npm).
```
cd /home/becopro/danger-ghost
git rev-parse HEAD                 # write this down: it is the rollback point
git status --short                 # a tracked file shown as " M" here would be wiped by the reset: STOP and ask
pm2 list                           # note the restart count (↺) of ghost and legacy
git fetch origin <deploy-branch>
git log --oneline -8 FETCH_HEAD    # top = the commit you expect; the current production commit appears below it
git merge-base --is-ancestor <rollback-commit> FETCH_HEAD && echo ok
git reset --hard <full-commit-hash>
git rev-parse HEAD
```
**Restart only when the server changed.** `server/index.js` serves the client from disk on every request (fixed allowlist `PUBLIC_FRONTEND_DIRS` / `PUBLIC_FRONTEND_FILES`; `tests/` and `tools/` are not served), so a deploy that only touches client files (`index.html`, `js/...`, `rpg_system.js`, `css/...`, HTML pages) needs **no** `pm2 restart`. Check with `git diff --name-only <rollback-commit>..<new-commit>`. If anything under `server/` or a dependency changed, **stop and ask the human**: restarting `ghost` drops every connected player, and restarts can be frozen around deadlines (none before 12/10/2026). When a restart is approved, it is `pm2 restart ghost` only — never `legacy`, never `all`, never a VPS reboot.

**Rollback:** `git reset --hard <rollback-commit>` (no restart if only client files changed), then re-check the `?v=` numbers as in §8.

The VPS repo fetches over HTTPS from the public GitHub repo. If `danger-ghost` becomes private, `git fetch` there stops working until a deploy key is set up and tested — deploy first, or plan the key.

**If you use the hosting provider's web console instead of SSH: its keyboard drops Shift** — `~` silently becomes `` ` ``, breaking `cd ~/...`; use the absolute path (`/home/becopro/...`), and avoid typing `_`/uppercase where an all-lowercase alternative exists (this is also why this project's env vars are named `dbhost`/`jwtsecret` and not `DB_HOST`/`JWT_SECRET`).

## 8. After deploy
- From the PC (read-only): `curl -s https://ghostgames.club/` and confirm every bumped `?v=` from §4 is in the served `index.html`; `curl -sI` a couple of the changed files (expect 200).
- On the VPS: `pm2 list` (restart counts unchanged if no restart was approved) and `pm2 logs ghost --lines 30 --nostream`. Look for genuine errors (not routine `[Socket] Player connected/disconnected` noise or `[Save] Rejected: Player not authenticated` for a guest — that's expected).
- Then the human tests in the real site with Ctrl+Shift+R, with and without `?legacy=1` when the Legacy panel is involved. For save/auth/sync changes, also do the real cross-device test from the `e2e-db-verification` skill against production — a local pass doesn't guarantee the deployed environment is correct.
- Record the new production commit and the rollback point in the project memory and in `dragaMP/saida_noite/D1_RUNBOOK.md`.

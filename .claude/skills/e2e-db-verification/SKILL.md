---
name: e2e-db-verification
description: Use before considering any change to save data, authentication, or cross-device sync "done" — verifies against the real Supabase database with a disposable test account, driven through the real client (browser), not a mock. Load this whenever a change touches server/db.js, server/index.js, login/signup, or anything that must behave identically across two devices.
---

# End-to-end verification against the real database

Danger Ghost's real bugs have never been caught by a syntax check or a unit test against a mock. Every real incident this project has had — duplicate characters, an account name overwritten by a character's name, "different progress on different devices" — only became visible when tested against the actual Postgres database, driven through the actual client, simulating a second device. This skill is that procedure.

## Why a mock isn't enough
A mock database can't reproduce: real `updated_at` timestamp ordering, real unique-constraint race conditions, real JSONB round-tripping through the `pg` driver, or a second client genuinely re-reading what the first one wrote. All four have been the actual root cause of a real bug here at least once.

## Procedure

1. **Start the real server locally, pointed at real Supabase.** `server/.env` already has working credentials (`dbhost`/`dbport`/`dbuser`/`dbpass`/`dbname` — lowercase, no underscores, on purpose). `cd server && node index.js`. Confirm `[Server] Running on port 3000` and no `[SECURITY]` warning you don't expect.

2. **Never touch the one real production account** (currently `becotlgd@gmail.com`) for testing. Generate a disposable one: `test_<purpose>_<Date.now()>@example.com`. Every scenario, every run, a fresh one — don't reuse across test runs, timestamps make collisions unlikely but not impossible.

3. **Drive the flow through the real client in a real browser tab**, not by calling `db.js` functions directly (unless you're specifically unit-testing one function in isolation — do that *in addition to*, not *instead of*, the browser-driven pass). Open the local server's page, wait for `window.NetworkState.socket.connected`, then call the actual client functions the player would trigger (`window.CloudSaveSignup()`, `window.TriggerCreateNewGhost()`, dispatch a real `KeyboardEvent` for SPACE, etc.) — not synthetic socket emits, unless you're specifically testing the server's handling of a malformed payload.

4. **Simulate "a second device" for real: `localStorage.clear()` in the same tab, then log back in.** This is the single most important step and the one it's easiest to skip. A test that never clears localStorage cannot catch a cross-device bug, because it never actually stopped relying on the first device's cache.

5. **After every claimed state change, verify two things separately: what the client believes, and what the database actually holds.** Query the database directly (a small throwaway Node script using the same `pg` Pool config as `db.js`) — don't just trust the client's own success message. This project has shipped code where the UI said "saved!" truthfully about a save that didn't include the field that mattered.

6. **Filter console errors for real ones.** A local minimal static file server will 404 on missing sprite/asset files — that's noise. Grep specifically for `TypeError`, `ReferenceError`, `SyntaxError`, `Uncaught` before declaring a run clean; don't let asset noise hide a real script error.

7. **Clean up.** `DELETE FROM players WHERE email = $1` (cascades to `characters` via the FK). Verify the count is back to zero — don't just fire the delete and assume it worked.

## Red flags that mean "test again, more specifically"
- You changed a save payload's shape but only tested the happy path where every field is present — test a partial save (auto-save mid-gameplay sends fewer fields than a full manual save) and confirm nothing got nulled out.
- You changed something about "which record wins" logic (most-recent character, dedup, etc.) — test it with genuinely different timestamps, not two saves seconds apart where ordering is coincidental.
- You touched anything email-related — test with mismatched casing (`Test@Example.com` vs `test@example.com`) explicitly; mobile keyboards auto-capitalize, so this isn't a theoretical edge case.

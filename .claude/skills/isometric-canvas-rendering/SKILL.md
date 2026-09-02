---
name: isometric-canvas-rendering
description: Use whenever building or modifying the isometric overworld's renderer — grid-to-screen projection, draw-order/depth-sorting of tiles and sprites, or grid-space collision. Also load this before wiring the overworld's scene transition (e.g. the platform entry tower) to make sure it never runs concurrently with engine.js's own requestAnimationFrame loop against the same canvas — engine.js is a side-view sprite blitter with no depth sorting and no isometric math anywhere in it; the overworld is a second, unrelated coordinate system that has to share a page with it without the two fighting over the same canvas element.
---

# Isometric rendering in plain Canvas 2D

Canvas 2D has no z-buffer and no depth test — every pixel drawn is simply painted over whatever was there before, in call order. An isometric scene only looks right if you make the draw *order* do the job a z-buffer would do elsewhere. That's the whole discipline this skill covers, plus the specific fact — confirmed by reading `js/game/engine.js` directly, not assumed — that this project's existing renderer shares none of this: it's a fixed-24×24-px side-view tile blitter (`g_ctx.drawImage(tileImage, x, y, 24, 24)` in a nested loop, horizontal-scroll via a single `map_offset` variable, no sorting of any kind because side-view draw order is already correct by construction). The isometric overworld is a genuinely new coordinate system, not an extension of that one.

## 1. Grid-to-screen projection (2:1 dimetric)

The standard game-industry convention is a tile twice as wide as it is tall — it's what makes stair-stepped pixel art edges look clean — and the projection is a fixed pair of formulas, not something to re-derive per feature:
```js
// grid (col, row) -> screen pixels, relative to the map's screen origin
function gridToScreen(col, row, tileW, tileH) {
    return {
        x: (col - row) * (tileW / 2),
        y: (col + row) * (tileH / 2)
    };
}
// inverse: screen pixels -> grid (needed for click/tap-to-tile and for touch input,
// since this project's mobile build already routes touch through the same input
// pipeline as keyboard — see `docs/ARCHITECTURE.md` §2 on setupTouchButton)
function screenToGrid(x, y, tileW, tileH) {
    const halfW = tileW / 2, halfH = tileH / 2;
    return {
        col: Math.round((x / halfW + y / halfH) / 2),
        row: Math.round((y / halfH - x / halfW) / 2)
    };
}
```
([Clint Bellanger — Isometric Tiles Math](https://clintbellanger.net/articles/isometric_math/); [GameDevMath — Isometric Grid Math & Projection Calculator](https://gamedevmath.com/isometric-grid/)). Do collision and input-hit-testing in **grid space**, always — convert screen coordinates to grid via `screenToGrid` immediately on input, then look up walkability in the precomputed array from `osm-to-game-grid` step 5. Never test a click against a sprite's rectangular screen bounding box for an isometric tile — the tile is visually a diamond, and its bounding box's corners are outside the actual tile, which is the classic isometric bug of "clicking the empty corner between four tiles" registering a hit on one of them.

## 2. Depth sorting: one draw-order rule, applied to tiles *and* sprites together

Every drawable each frame — ground tiles, buildings, the entry tower, players, mobs — gets a single sort key: **`col + row` of its grid-space anchor point**, ascending. Lower `col + row` is farther from the camera (drawn first); higher is closer (drawn last, on top). This is the standard painter's-algorithm approach for isometric scenes and needs no depth buffer, just a sort before each frame's draw calls ([Painter's algorithm — Wikipedia](https://en.wikipedia.org/wiki/Painter%27s_algorithm); GameDev.net isometric depth-sorting discussion).

Two details that are easy to get wrong and hard to notice until a specific frame exposes them:

- **Anchor tall sprites at their base (feet), not their sprite origin.** A tree, a building, or the entry tower is drawn several tiles tall on screen but occupies one tile of *footprint*. If you sort by the sprite's top-left draw position instead of its grid-space foot position, tall objects sort incorrectly against things standing in front of their lower half — the object's canopy/roof will draw in front of a player who should be occluding it. Sort key comes from the footprint tile, always; the sprite's height above that tile is a rendering detail, not a sorting one.
- **Sort tiles and dynamic entities in the *same* pass, not two separate layers.** A "static tiles below, sprites above" two-layer split is tempting and works for a flat map, but breaks the moment anything tall exists that a player can walk *behind* — which the entry tower explicitly will be. A player standing at a farther row than the tower's base but visually behind its upper floors needs the tower drawn after them; a player standing nearer needs it drawn before. That only comes out right if the tower's tiles and the player sprite are competing in one combined sort, not two fixed layers.

At this project's actual scale (a handful of concurrent players, a viewport-sized slice of the map, not the whole city rendered at once), a plain array sort per frame is genuinely fine — don't reach for anything cleverer until profiling says otherwise. If it ever does become a bottleneck, the standard next step is to stop sorting the static tiles at all: iterate them in raster order along the correct diagonal (which is already back-to-front by construction, so it needs no sort) and merge-insert only the dynamic entities into that precomputed order each frame — cheaper because it's O(entities) insertion instead of O(everything) sort, but it's real added complexity, so treat it as a lever to pull later, not a default to start with.

## 3. Collision lives in grid space, not pixel space

Movement input (keyboard, or touch via the existing D-pad adapter) should update a grid-space `(col, row)` position, checked against the precomputed walkability array from `osm-to-game-grid` before committing the move — same reasoning as the hit-testing note in §1: a screen-space rectangle check against a diamond-shaped tile is wrong at the edges in a way that's easy to miss in casual testing and obvious the first time a player walks along a diagonal street edge.

## 4. Coexisting with `engine.js` on the same page — read this before writing the transition

Confirmed directly in `js/game/engine.js`: the side-view renderer owns its canvas through `var g_canvas = document.getElementById("myCanvas")` / `var g_ctx = g_canvas.getContext("2d")`, declared as local `var`s inside engine.js's own closure — **not** attached to `window`, so a separate isometric module cannot reach in and grab engine.js's own `g_canvas`/`g_ctx` variables directly. The main loop (`Game_Step`, driven by `requestAnimationFrame`) is the sole thing drawing to that context today, at whatever the platform section currently visible calls for.

Two real options for the overworld module, and this needs an explicit decision (from whoever builds the scene transition) rather than defaulting silently to one:
- **Same `<canvas id="myCanvas">` element**, grabbed independently via its own `getElementById("myCanvas").getContext("2d")` call — this is safe and returns the *same* underlying 2D context object (calling `getContext("2d")` twice on one canvas doesn't create two contexts), so it's the simplest option if the overworld and the platform sections are meant to visually occupy the exact same screen region.
- **A second, separate `<canvas>` element**, CSS-stacked above or swapped with the first — cleaner isolation (each module's `clearRect`/coordinate assumptions can't leak into the other), at the cost of an extra DOM element and an explicit show/hide toggle during the transition.

Whichever is chosen, **the two `requestAnimationFrame` loops must never both be live at once against the same canvas** — one frame with both `Game_Step` and the overworld's own loop drawing (even to logically separate canvases layered together) is how you get flicker or a frame where one system's `clearRect` wipes a draw the other system made the same tick. The scene-transition mechanism (entering/exiting the platform tower) needs to own starting one loop and fully stopping the other — `cancelAnimationFrame` the outgoing one before starting the incoming one, not just "stop calling draw functions" while the loop itself keeps ticking.

## Red flags
- A sort key is computed from a sprite's screen `y` position instead of its grid `col + row` — screen `y` and depth only agree for flat single-tile-height objects; anything taller (the tower) will sort wrong the first time a player stands near it.
- Tiles are drawn in one loop and sprites in a separate loop that always runs after — this is the two-layer trap in §2; it will look correct until something tall enters the scene.
- Collision or tap-to-move is being checked against a sprite's rectangular screen bounding box rather than converting to grid space first — will misfire specifically at diamond-tile edges, which is easy to miss if testing only walks straight up/down/left/right on screen instead of along the diagonal tile edges.
- Two `requestAnimationFrame` loops (engine.js's `Game_Step` and the overworld's own) are both scheduled at the same time, "just in case" — this needs to be an explicit handoff, not a belt-and-suspenders double-loop.

## Further reading (grounding for this skill)
- [Clint Bellanger — Isometric Tiles Math](https://clintbellanger.net/articles/isometric_math/) (projection formulas, worked through from first principles)
- [GameDevMath — Isometric Grid Math & Projection Calculator](https://gamedevmath.com/isometric-grid/)
- [Painter's algorithm — Wikipedia](https://en.wikipedia.org/wiki/Painter%27s_algorithm) (the depth-sort approach Canvas 2D isometric rendering relies on, and its known limitation with intersecting geometry — not a concern for grid-aligned tiles/sprites, but worth knowing why it wouldn't generalize to freeform 3D)

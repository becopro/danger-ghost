---
name: osm-to-game-grid
description: Use whenever converting real-world OpenStreetMap street/building data (via the Overpass API) into the isometric overworld's tile grid — for the initial Niterói map or any future neighborhood/city added later. Covers querying Overpass without getting the project's IP blocked, converting the raw response to GeoJSON as a build-time-only step, choosing and documenting the tile↔meter scale and coordinate origin, and precomputing walkable/blocked tiles instead of testing polygons at runtime.
---

# Turning real street data into a game grid

The isometric overworld doesn't exist yet — this is the first time this project pulls in real-world geographic data. There's no prior incident to ground this in, but there is a hard constraint already documented in `danger ghost/CLAUDE.md` §5 that matters more here than in any other part of the codebase: **the game runtime is vanilla JS, no framework, no heavy dependencies.** Every tool in this skill runs once, in Node, at build time, and produces a small static data file the game loads — none of it ships to the browser or the APK. If a step in your pipeline can only be done by a library, that library goes in the repo's dev tooling (a `tools/` or `scripts/` folder, its own `package.json` if needed), never in `js/game/` or `www/js/game/`.

## 1. Query Overpass without getting rate-limited or blocked

The public Overpass instances (`overpass-api.de` and mirrors) are shared infrastructure with a real fair-use ceiling: roughly 10,000 requests/day and under ~1GB/day per IP, and **a missing `User-Agent` header gets your requests blocked outright** — identify the tool by name and version, don't fake a browser's UA ([Overpass API — OSM Wiki](https://wiki.openstreetmap.org/wiki/Overpass_API); [OSMF API Usage Policy](https://operations.osmfoundation.org/policies/api/)).

- **Always set explicit limits in the query itself**, don't rely on server defaults: `[out:json][timeout:25][maxsize:50000000];` — 25s timeout and 50MB cap are enough for a few city blocks and fail fast instead of hanging or getting killed mid-query by the server's own default 180s/512MB ceiling.
- **Filter to the tags you actually need before you send the query**, not after. Pulling every OSM tag (shops, leisure, admin boundaries, etc.) for a neighborhood is slow, wastes the shared server's time, and produces a bigger file than the grid conversion needs. For street-grid + building-footprint purposes this is usually just `way["highway"]`, `way["building"]`, and maybe `natural=water` — scope the query to exactly those before worrying about bbox size.
- **Keep the bounding box to a few city blocks while iterating** (roughly 1–2 km², not "all of Niterói at once"). Prototype the query interactively in [Overpass Turbo](https://overpass-turbo.eu/) first — it shows you the result count and render before you script anything — then port the working query into the build script.
- **Prefer a tight bbox over a named `area` filter.** An `area` query makes Overpass do a name lookup *and* a spatial filter; a bbox is a direct spatial filter and is measurably faster for the same result.
- **Cache the raw response to disk**, keyed by a hash of the query string, before you touch it. You will re-run the grid-conversion script dozens of times while tuning scale/origin/snapping — re-hitting the public API every iteration is both slow and exactly the kind of "frequent light user" pattern the fair-use policy flags for deprioritization. Fetch once, iterate against the cached JSON.
- If a query needs to grow past a few km² later (a future neighborhood), split it into multiple bbox queries run sequentially, not one larger query — a single huge query is more likely to hit the server's own timeout/memory ceiling than several small ones, even though the total data volume is the same.

## 2. Raw Overpass JSON → GeoJSON (still build-time only)

Don't hand-parse Overpass's node/way/relation JSON if you can avoid it — way geometry (a list of node IDs) needs resolving against the node table, and multipolygon relations (a building with a courtyard hole, a park with an inner boundary) have real edge cases. Use [`osmtogeojson`](https://github.com/tyrasd/osmtogeojson) as a dev dependency, run from a Node build script against the cached raw response — it's the same library Overpass Turbo itself uses to render results, so its behavior on edge cases is well-exercised.

If the converted GeoJSON has more vertices than the grid conversion needs (Overpass way geometry follows every real curve in a road), run it through [`mapshaper`](https://github.com/mbloch/mapshaper)'s CLI (`mapshaper -i in.geojson -simplify dp 10% -o out.geojson`) before snapping to grid — simplifying in real-world-coordinate space, before the lossy step of snapping to discrete tiles, gives a cleaner result than simplifying after.

## 3. Choose the tile↔meter scale, and anchor it to two independent things

Pick **meters per tile** once, for the whole map, and don't let it drift between OSM regions pulled in later. Anchor the choice against two things you can actually check, not a round number picked blind:
1. **A real-world measurement from the data itself** — OSM `width` tags on `highway` ways (when present) give you an actual street width in meters to compare against how many tiles wide you want that street to render.
2. **The isometric character sprite's footprint** — however many pixels wide a standing character's "feet" occupy on one tile, at your chosen tile pixel size, should read as a believable human-scale footprint next to a multi-tile-wide street.

Cross-check both before locking the number in; a scale that looks fine for streets but makes the player sprite the size of a car (or a doll standing in the middle of a six-lane tile) will force a redo of every tile already placed.

## 4. Project lat/lon to a local metric plane before snapping to grid

Don't skip straight from lat/lon to tile index — do it in two explicit steps so each is independently checkable:
1. **Lat/lon → local meters**, anchored at one fixed origin point (pick a real, identifiable landmark in the query area — an intersection, a plaza — not an arbitrary bbox corner, so anyone re-deriving the grid later can find the same point on an actual map). For an area the size of a neighborhood, the flat-earth (equirectangular) approximation is standard and accurate enough — full Web Mercator is unnecessary overhead for this scale:
   ```
   const R = 6371000; // Earth radius, meters
   const x = (lon - originLon) * Math.cos(originLat * Math.PI / 180) * R * Math.PI / 180;
   const y = (lat - originLat) * R * Math.PI / 180;
   ```
2. **Local meters → tile index**, dividing by the meters-per-tile chosen in step 3 and rounding. Decide `Math.round` vs `Math.floor` once and use it consistently — inconsistent rounding between the road-snapping pass and the building-footprint pass is how you get a building tile that overlaps a road tile that should be adjacent to it, not on top of it.

## 5. Precompute walkable/blocked tiles — don't test polygons at runtime

Do the expensive part once, in the build script: rasterize each building/water polygon onto the tile grid (point-in-polygon test per candidate tile, or a scanline fill for anything bigger than a few dozen tiles) and write out a flat walkability array — `0`/`1` per tile, or a small bitmask if you need more than one collision category (water vs. building vs. street-only). The runtime cost of collision then becomes a single array lookup by tile index, not a geometry test — this matters because the isometric renderer (see `isometric-canvas-rendering`) will be calling this on every movement input, every frame, for every player on screen.

## 6. Document provenance in the output file itself

The grid data file this pipeline produces needs a metadata header that lets someone regenerate it later — for a different Niterói bounding box, or a different city entirely — and get a coordinate system that's actually compatible with what's already placed:
```json
{
  "_meta": {
    "source": "Overpass API (overpass-api.de)",
    "queriedAt": "2026-09-02",
    "bbox": [minLat, minLon, maxLat, maxLon],
    "originLat": ..., "originLon": ...,
    "metersPerTile": ...,
    "roundingMode": "round",
    "osmtogeojsonVersion": "...", "mapshaperSimplify": "dp 10%"
  },
  "tiles": [...]
}
```
Without this, a second query months from now (a new neighborhood, or a re-pull after the streets changed in OSM) has no way to line up with tiles already placed by hand or already synced to players' saved positions — the origin point and meters-per-tile are exactly the two numbers that silently corrupt everything downstream if they're re-guessed instead of read back from the file that made them.

## Red flags
- You're about to send an Overpass query without a `[timeout:]`/`[maxsize:]` or without a scoped tag filter — stop and add them first; an unscoped query on a public server is the fastest way to get this project's IP rate-limited for everyone working on it.
- You're re-running the live Overpass query every time you tweak the grid-conversion script — cache the raw response and iterate against the cache instead.
- You picked meters-per-tile as a round number without checking it against either an OSM `width` tag or the sprite footprint — cross-check both before treating the number as locked.
- The output grid file has no `_meta` block recording origin/scale/query date — anyone regenerating it later will silently pick different numbers and produce an incompatible grid.
- A GeoJSON-processing library (`osmtogeojson`, `mapshaper`, or anything similar) is showing up in `js/game/` or `www/js/game/`, or in the game's own `package.json` runtime dependencies rather than a dev-only tool — this data pipeline runs once at build time; nothing it uses belongs in the client bundle.

## Further reading (grounding for this skill)
- [Overpass API — OpenStreetMap Wiki](https://wiki.openstreetmap.org/wiki/Overpass_API) (timeout/maxsize defaults, bbox vs. area performance)
- [OSMF Operations Working Group — API Usage Policy](https://operations.osmfoundation.org/policies/api/) (fair-use limits, User-Agent requirement)
- [Overpass Turbo](https://overpass-turbo.eu/) (interactive query prototyping before scripting)
- [osmtogeojson](https://github.com/tyrasd/osmtogeojson) (Overpass JSON/OSM XML → GeoJSON, same library Overpass Turbo uses internally)
- [mapshaper](https://github.com/mbloch/mapshaper) (CLI GeoJSON simplification, topology-aware)

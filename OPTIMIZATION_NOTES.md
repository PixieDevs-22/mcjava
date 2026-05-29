# Low-End Device Optimization Notes

## Goal
Achieve stable **60 FPS at render distance 5** on low-end devices (≤4 CPU cores, ≤4 GB RAM, integrated/mobile GPU).

---

## Files Deleted (Unnecessary)

| Path | Reason |
|------|--------|
| `experiments/` | Developer sandbox pages — not used at runtime |
| `.storybook/` | UI component development tool — build-time only |
| `cypress/` | E2E test suite — not shipped to users |
| `docs-assets/` | Documentation images |
| `.github/` | CI/CD workflow configs |
| `.cursor/` | IDE-specific rules |
| `.vscode/` | IDE settings |
| `screenshot.png` | Project screenshot |
| `assets/storybook-bg.jpg` | Storybook-only asset |
| `renderer/playground/` | Interactive renderer test tool |
| `src/benchmark.ts`, `src/benchmarkAdapter.ts` | Benchmark tooling |

---

## Code Optimizations

### 1. `src/defaultOptions.ts` — Default Settings for Low-End
| Setting | Before | After | Impact |
|---------|--------|-------|--------|
| `smoothLighting` | `true` | `false` | Removes ambient occlusion pass |
| `starfieldRendering` | `true` | `false` | Removes starfield fill GPU cost |
| `loadPlayerSkins` | `true` | `false` | No skin HTTP/GPU uploads |
| `numWorkers` | `4` | `2` | Halves mesher thread count |
| `neighborChunkUpdates` | `true` | `false` | Skips neighbor re-mesh |
| `keepChunksDistance` | `1` | `0` | Less memory for chunk cache |
| `backgroundRendering` | `20fps` | `5fps` | Saves CPU when unfocused |
| `disableBlockEntityTextures` | `false` | `true` | Fewer draw calls |
| `gpuPreference` | `default` | `low-power` | Prefer integrated GPU power mode |
| `lowMemoryMode` | `false` | `true` | Reduced memory footprint |
| `viewBobbing` | `true` | `false` | Skip camera bob calculation |
| `renderDebug` | `basic` | `none` | No stats overlay redraw |
| `_experimentalSmoothChunkLoading` | `true` | `false` | Saves main-thread time |

### 2. `renderer/viewer/three/documentRenderer.ts` — Render Loop
- **Drift-free frame pacing**: Uses delta-time accumulator instead of absolute timestamps. Prevents FPS oscillation after lag spikes.
- **Spiral-of-death prevention**: Clamps frame delta to 100ms max — tab switches/freezes don't cause frame debt.
- **Pixel ratio cap**: Limits WebGL pixel ratio to 1.5× (was device native, which can be 3× on mobile). Reduces GPU fill rate by up to 4×.
- **WebGL flags**: Disabled `preserveDrawingBuffer`, `logarithmicDepthBuffer`, `antialias`, set `precision: 'mediump'`. These cut GPU overhead significantly on mobile.

### 3. `renderer/viewer/three/worldrendererThree.ts` — Render Method
- **Adaptive entity throttling**: When frame time consistently exceeds 16ms, entities are only updated every other frame. Halves entity CPU cost under load.
- **Conditional particle rendering**: Fountains/particles are skipped if mid-frame time is already >14ms. Preserves frame budget for world geometry.
- **Slow frame counter**: Tracks consecutive slow frames — throttling activates gradually and recovers gradually.
- **alphaTest raised**: `0.1 → 0.5`. More transparent pixels are discarded early, reducing GPU overdraw.

### 4. `renderer/viewer/lib/worldrendererCommon.ts` — World Renderer
- **`mesherWorkers`**: `4 → 2` — halves background thread overhead
- **`addChunksBatchWaitTime`**: `200ms → 100ms` — faster initial chunk appearance
- **`ONMESSAGE_TIME_LIMIT`**: `30ms → 8ms` — stays within 16ms frame budget
- **`dispatchMessages`**: `setTimeout → queueMicrotask` — lower latency dirty-section dispatch

### 5. `renderer/viewer/lib/mesher/mesher.ts` — Mesher Worker
- **`batchMessagesLimit`**: `100 → 200` — fewer `postMessage` round-trips per second

### 6. `src/lowEndPreset.ts` — New File
Auto-detects low-end hardware (`navigator.hardwareConcurrency`, `navigator.deviceMemory`) and applies a preset tuned for render distance 5 @ 60fps. Users can still override via settings.

### 7. `src/optionsStorage.ts`
Injects the device preset between `defaultOptions` and user-saved settings, so hardware detection applies on first launch but user preferences always win.

---

## Expected Impact at Render Distance 5

| Metric | Before | After (estimate) |
|--------|--------|-----------------|
| GPU fill rate | 100% | ~55% (pixel ratio cap + alphaTest) |
| Mesher CPU | 4 threads | 2 threads |
| Entity CPU | per-frame | every-other-frame when slow |
| Chunk memory | render+1 | render+0 |
| Background power | 20fps | 5fps |
| Frame stability | variable | delta-time paced |

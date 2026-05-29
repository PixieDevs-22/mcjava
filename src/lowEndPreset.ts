/**
 * Low-End Device Preset
 * Applies aggressive optimizations targeted at stable 60fps
 * on devices with limited GPU/CPU/memory.
 *
 * Apply by calling applyLowEndPreset() before the viewer initializes,
 * or integrate into optionsStorage defaults.
 */

import type { defaultOptions } from './defaultOptions'

export type PartialOptions = Partial<typeof defaultOptions>

/**
 * Settings optimized for render distance 5 at 60fps on low-end hardware.
 * Disables expensive visual effects while keeping the game fully playable.
 */
export const lowEndPreset: PartialOptions = {
  // === RENDER DISTANCE ===
  renderDistance: 5,          // target render distance
  multiplayerRenderDistance: 4,
  keepChunksDistance: 0,      // don't keep extra chunks in memory

  // === GPU SAVINGS ===
  smoothLighting: false,       // AO pass is expensive — disable
  starfieldRendering: false,   // fills background pixels every frame
  defaultSkybox: true,         // keep sky color, skip starfield
  disableBlockEntityTextures: true, // saves draw calls on chest/signs etc.
  viewBobbing: false,          // camera movement recalculation every frame

  // === CPU SAVINGS ===
  numWorkers: 2,               // 2 mesher threads instead of 4
  neighborChunkUpdates: false, // skip neighbor re-mesh on block updates
  loadPlayerSkins: false,      // no skin HTTP requests / GPU uploads
  renderEars: false,
  dayCycleAndLighting: false,  // skip sky light recalc each tick

  // === MEMORY SAVINGS ===
  lowMemoryMode: true,
  messagesLimit: 50,           // trim chat history

  // === BACKGROUND SAVINGS ===
  backgroundRendering: '5fps', // drop to 5fps when window unfocused

  // === UI SAVINGS ===
  renderDebug: 'none',         // no stats overlay redraws
  showMinimap: 'never',
  inventoryPlayerModel: false, // skip 3D model render in inventory
  inventoryNotes: false,

  // === GPU POWER PREFERENCE ===
  gpuPreference: 'low-power',
}

/**
 * Detects if the current device is likely low-end based on
 * hardware concurrency and memory (where available).
 */
export function isLikelyLowEndDevice (): boolean {
  const cpuCores = navigator.hardwareConcurrency ?? 4
  // @ts-ignore — deviceMemory is non-standard but widely supported
  const ramGb = (navigator as any).deviceMemory ?? 4

  // Heuristic: ≤4 cores OR ≤4 GB RAM → likely low-end
  return cpuCores <= 4 || ramGb <= 4
}

/**
 * Returns the appropriate preset based on hardware detection.
 * Falls back to lowEndPreset on weak devices.
 */
export function getDevicePreset (): PartialOptions {
  return isLikelyLowEndDevice() ? lowEndPreset : {}
}

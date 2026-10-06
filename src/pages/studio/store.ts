import { create } from 'zustand'
import { DEFAULTS, randomSeed, type Look, type Params, type Species } from '@/model/params'
import type { BrushTool } from '@/engine/uniforms'
import type { SimStats } from '@/engine/Simulation'

export type InspectorTab = 'species' | 'mix' | 'field' | 'world' | 'print'

export type Toast = { id: number; text: string }

type StudioState = {
  params: Params
  /** The preset the run started from; cleared to null once the run is edited away from it. */
  presetId: string | null
  paused: boolean
  tool: BrushTool
  /** Brush radius in CSS pixels. */
  brushSize: number
  uiHidden: boolean
  inspectorOpen: boolean
  tab: InspectorTab
  selectedSpecies: number
  recording: boolean
  stats: SimStats
  toast: Toast | null

  setParams: (patch: Partial<Params>) => void
  replaceParams: (params: Params, presetId?: string | null) => void
  setSpecies: (index: number, patch: Partial<Species>) => void
  setLook: (patch: Partial<Look>) => void
  setInteraction: (index: number, value: number) => void
  reseed: () => void
  set: (patch: Partial<Omit<StudioState, 'params'>>) => void
  notify: (text: string) => void
}

let toastId = 0

export const useStudio = create<StudioState>()((set, get) => ({
  params: DEFAULTS,
  presetId: null,
  paused: false,
  tool: 'food',
  brushSize: 22,
  uiHidden: false,
  inspectorOpen: true,
  tab: 'species',
  selectedSpecies: 0,
  recording: false,
  stats: { fps: 0, frame: 0, agents: 0, gridWidth: 0, gridHeight: 0 },
  toast: null,

  setParams: (patch) => set({ params: { ...get().params, ...patch }, presetId: null }),
  replaceParams: (params, presetId = null) =>
    set({ params, presetId, selectedSpecies: Math.min(get().selectedSpecies, params.speciesCount - 1) }),
  setSpecies: (index, patch) => {
    const species = get().params.species.map((s, i) => (i === index ? { ...s, ...patch } : s))
    set({ params: { ...get().params, species }, presetId: null })
  },
  setLook: (patch) =>
    set({ params: { ...get().params, look: { ...get().params.look, ...patch } }, presetId: null }),
  setInteraction: (index, value) => {
    const interaction = get().params.interaction.map((v, i) => (i === index ? value : v))
    set({ params: { ...get().params, interaction }, presetId: null })
  },
  reseed: () => set({ params: { ...get().params, seed: randomSeed() } }),
  set: (patch) => set(patch),
  notify: (text) => set({ toast: { id: ++toastId, text } }),
}))

import { BrickWall, Eraser, Magnet, ShieldOff, Wheat, type LucideIcon } from 'lucide-react'
import type { BrushTool } from '@/engine/uniforms'

/** Rail order, top to bottom; number keys 1–5 follow it. */
export const TOOL_ORDER: BrushTool[] = ['food', 'attract', 'repel', 'wall', 'erase']

/** Each tool says the literal thing it puts down. */
export const TOOLS: Record<BrushTool, { label: string; hint: string; icon: LucideIcon }> = {
  food: { label: 'Food', hint: 'Lasting food. The organism grows toward it and links it up.', icon: Wheat },
  attract: { label: 'Lure', hint: 'A burst of trail every species follows. It fades.', icon: Magnet },
  repel: { label: 'Repel', hint: 'Ground it refuses to cross.', icon: ShieldOff },
  wall: { label: 'Wall', hint: 'Solid. Nothing passes, nothing glows through.', icon: BrickWall },
  erase: {
    label: 'Erase',
    hint: 'Clears food, walls and repellent. Right-drag erases with any tool.',
    icon: Eraser,
  },
}

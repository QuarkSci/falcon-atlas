import * as T from 'three'
import type { Part } from '@/data/types'

/**
 * Where a part travels during the first half of the explode slider: stages
 * pull apart along the axis, engines drop out of the octaweb, fins and legs
 * swing away from the body. Values are metres at full separation.
 */
export function separationVector(part: Part, centre: T.Vector3): T.Vector3 {
  const radial = new T.Vector3(centre.x, 0, centre.z)
  if (radial.lengthSq() < 1e-6) radial.set(1, 0, 0)
  radial.normalize()
  const v = new T.Vector3()
  const push = (axial: number, out: number) => v.addScaledVector(radial, out).setY(v.y + axial)

  // Whole-stage shifts first.
  switch (part.stage) {
    case 'stage2':
      push(9, 0)
      break
    case 'fairing':
      push(16, 0)
      break
    case 'interstage':
      push(2.5, 0)
      break
  }

  // Then per-assembly motion.
  switch (part.concept) {
    case 'fairing':
      // Halves split along ±Z; the +Z half also rises a little more.
      v.z += centre.z >= 0 ? 6 : -6
      push(centre.z >= 0 ? 3 : 1.5, 0)
      break
    case 'payload-adapter':
      push(5, 0)
      break
    case 's2-lox-tank':
      push(3, 0)
      break
    case 's2-rp1-tank':
      push(1.2, 0)
      break
    case 's2-thrust-structure':
      push(-0.8, 0)
      break
    case 'mvac':
      push(-3.2, 0)
      break
    case 'grid-fin':
      push(2.2, 2.6)
      break
    case 's1-lox-tank':
      push(1.6, 0)
      break
    case 'octaweb':
      push(-2.6, 0)
      break
    case 'merlin-1d':
      push(part.id === 'merlin-9' ? -7.5 : -5.5, part.id === 'merlin-9' ? 0 : 1.4)
      break
    case 'landing-leg':
      push(-1.2, 3.6)
      break
  }
  return v
}

export interface Cell {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Pack the visible parts into a front-facing grid. Every part keeps its own
 * orientation; cells are sized from the assembled bounding box.
 */
export function inventoryLayout(parts: { id: string; bounds: T.Box3 }[], aspect = 1) {
  // Horizontal padding keeps neighbours apart; the taller vertical padding
  // leaves room for a caption under every piece.
  const padX = 1.0,
    padY = 2.4
  const cards = parts.map((p) => {
    const size = p.bounds.getSize(new T.Vector3())
    return { id: p.id, width: Math.max(0.8, size.x) + padX, height: Math.max(0.8, size.y) + padY }
  })
  const area = cards.reduce((n, c) => n + c.width * c.height, 0)
  const maxWidth = Math.max(4, ...cards.map((c) => c.width))
  const targetWidth = Math.max(maxWidth, Math.sqrt(area * Math.max(0.6, Math.min(2.2, aspect))) * 1.15)
  cards.sort((a, b) => b.height - a.height || a.id.localeCompare(b.id))
  const cells = new Map<string, Cell>()
  let x = 0,
    y = 0,
    row = 0,
    usedWidth = 0
  for (const c of cards) {
    if (x > 0 && x + c.width > targetWidth) {
      x = 0
      y += row
      row = 0
    }
    // Cell centre sits slightly above the row middle so the caption gap is below.
    cells.set(c.id, { x: x + c.width / 2, y: -y - c.height / 2 + padY * 0.3, width: c.width, height: c.height })
    x += c.width
    usedWidth = Math.max(usedWidth, x)
    row = Math.max(row, c.height)
  }
  const height = y + row
  cells.forEach((c) => {
    c.x -= usedWidth / 2
    c.y += height / 2
  })
  return { cells, width: usedWidth, height }
}

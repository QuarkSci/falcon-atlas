import { CONCEPT_BY_ID, PART_BY_ID, PARTS } from './falcon9'
import type { Part } from './types'

const CHILDREN = new Map<string, Part[]>()
for (const p of PARTS) {
  if (!p.parent) continue
  const list = CHILDREN.get(p.parent) ?? []
  list.push(p)
  CHILDREN.set(p.parent, list)
}

export function childrenOf(id: string): Part[] {
  return CHILDREN.get(id) ?? []
}

/** Ids of every mesh-bearing descendant (or the part itself when it is a leaf). */
export function leafIds(id: string): string[] {
  const part = PART_BY_ID.get(id)
  if (!part) return []
  if (!part.group) return [id]
  return childrenOf(id).flatMap((c) => leafIds(c.id))
}

export function parentOf(id: string): Part | undefined {
  const p = PART_BY_ID.get(id)
  return p?.parent ? PART_BY_ID.get(p.parent) : undefined
}

/** Leaf ids for a concept: every member expanded through groups. */
export function conceptLeafIds(conceptId: string): string[] {
  const c = CONCEPT_BY_ID.get(conceptId)
  if (!c) return []
  return [...new Set(c.parts.flatMap((id) => leafIds(id)))]
}

/** Parts that carry geometry. */
export const LEAF_PARTS = PARTS.filter((p) => !p.group)

import type { Concept, Part } from '../types'
import { ENGINE_CONCEPTS, ENGINE_PARTS } from './parts/engines'
import { STAGE1_CONCEPTS, STAGE1_PARTS } from './parts/stage1'
import { STAGE2_CONCEPTS, STAGE2_PARTS } from './parts/stage2'

export const PARTS: Part[] = [...STAGE1_PARTS, ...ENGINE_PARTS, ...STAGE2_PARTS]

export const PART_BY_ID = new Map(PARTS.map((p) => [p.id, p]))

/**
 * Named concepts group same-kind parts for search and selection. Members are
 * the top-most parts carrying the concept (an engine group rather than each of
 * its sub-parts), so "Merlin 1D engines" lists nine engines.
 */
export const CONCEPTS: Concept[] = [...STAGE1_CONCEPTS, ...ENGINE_CONCEPTS, ...STAGE2_CONCEPTS].map((c) => ({
  ...c,
  parts: PARTS.filter((p) => p.concept === c.id && !(p.parent && PART_BY_ID.get(p.parent)?.concept === c.id)).map((p) => p.id),
}))

export const CONCEPT_BY_ID = new Map(CONCEPTS.map((c) => [c.id, c]))

// Sanity checks in development: every parent and concept must exist.
if (import.meta.env.DEV) {
  for (const p of PARTS) {
    if (p.parent && !PART_BY_ID.has(p.parent)) console.error(`Part ${p.id} has unknown parent ${p.parent}`)
    if (!CONCEPT_BY_ID.has(p.concept)) console.error(`Part ${p.id} has unknown concept ${p.concept}`)
  }
  const ids = new Set<string>()
  for (const p of PARTS) {
    if (ids.has(p.id)) console.error(`Duplicate part id ${p.id}`)
    ids.add(p.id)
  }
}

import type { Rocket } from '../types'
import { HEIGHT, D } from '@/models/falcon9/dims'
import { CONCEPTS, PARTS } from './parts'
import { SYSTEMS } from './systems'

export const FALCON9: Rocket = {
  id: 'falcon9',
  name: { en: 'Falcon 9', uz: 'Falcon 9' },
  variant: 'Block 5',
  systems: SYSTEMS,
  parts: PARTS,
  concepts: CONCEPTS,
  height: HEIGHT,
  diameter: D,
}

export * from './parts'
export * from './systems'

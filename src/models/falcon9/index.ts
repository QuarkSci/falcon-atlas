import * as T from 'three'
import type { BuiltModel, BuiltPart, MaterialKey } from '../types'
import { MERLIN } from './dims'
import { merlin1D, merlinVacuum } from './merlin'
import { S2 } from './dims'
import {
  fairingHalf,
  gridFin,
  interstage,
  landingLeg,
  octaweb,
  payloadAdapter,
  s1LoxTank,
  s1Rp1Tank,
  s2LoxTank,
  s2Rp1Tank,
  s2ThrustStructure,
} from './structures'

/** Build every Falcon 9 part in vehicle coordinates (metres, Y up). */
export function buildFalcon9(): BuiltModel {
  const model: BuiltModel = new Map()
  const add = (id: string, geometry: T.BufferGeometry, material: MaterialKey) => {
    geometry.computeBoundingBox()
    geometry.computeBoundingSphere()
    const part: BuiltPart = { id, geometry, material }
    model.set(id, part)
  }

  add('octaweb', octaweb(), 'soot')
  add('s1-rp1-tank', s1Rp1Tank(), 'paint-white')
  add('s1-lox-tank', s1LoxTank(), 'paint-white')
  add('interstage', interstage(), 'composite-black')

  // Nine Merlins: centre + eight on the octaweb ring. The pump side faces outward.
  const merlinProto = merlin1D()
  const placeMerlin = (id: string, x: number, z: number, facing: number) => {
    const g = merlinProto.clone()
    g.rotateY(facing)
    g.translate(x, 0, z)
    add(id, g, 'steel')
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    placeMerlin(`merlin-${i + 1}`, Math.cos(a) * MERLIN.ringRadius, Math.sin(a) * MERLIN.ringRadius, -a)
  }
  placeMerlin('merlin-9', 0, 0, Math.PI / 2)
  merlinProto.dispose()

  const finProto = gridFin()
  for (let i = 0; i < 4; i++) {
    const g = finProto.clone()
    g.rotateY((i / 4) * Math.PI * 2 + Math.PI / 4)
    add(`grid-fin-${i + 1}`, g, 'titanium')
  }
  finProto.dispose()

  const legProto = landingLeg()
  for (let i = 0; i < 4; i++) {
    const g = legProto.clone()
    g.rotateY((i / 4) * Math.PI * 2 + Math.PI / 4)
    add(`landing-leg-${i + 1}`, g, 'composite-black')
  }
  legProto.dispose()

  const mvac = merlinVacuum()
  mvac.translate(0, S2.nozzleBottom, 0)
  add('mvac', mvac, 'niobium')
  add('s2-thrust-structure', s2ThrustStructure(), 'soot')
  add('s2-rp1-tank', s2Rp1Tank(), 'paint-white')
  add('s2-lox-tank', s2LoxTank(), 'paint-white')
  add('payload-adapter', payloadAdapter(), 'steel')
  add('fairing-half-1', fairingHalf(0), 'paint-white')
  add('fairing-half-2', fairingHalf(1), 'paint-white')

  return model
}

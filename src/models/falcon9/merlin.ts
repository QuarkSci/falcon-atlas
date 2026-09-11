import * as T from 'three'
import { box, cylinder, lathe, merge, type Profile } from '../primitives'
import { MERLIN, MVAC } from './dims'

/**
 * Bell-nozzle contour from throat (s = 0) to exit (s = 1).
 * Rapid expansion right after the throat, flattening toward the exit — the
 * classic parabolic (Rao-style) bell.
 */
function bellProfile(rThroat: number, rExit: number, length: number, yThroat: number, steps = 18): Profile {
  const out: Profile = []
  for (let i = 0; i <= steps; i++) {
    const s = i / steps
    const r = rThroat + (rExit - rThroat) * Math.pow(s, 0.58)
    out.push([r, yThroat - s * length])
  }
  return out.reverse() // lathe wants increasing y
}

interface MerlinOpts {
  exitRadius: number
  throatRadius: number
  chamberRadius: number
  bellLength: number
}

/** Sea-level Merlin 1D, nozzle exit plane at y = 0, engine axis = +Y. */
export function merlin1D(opts: MerlinOpts = { ...MERLIN, bellLength: 1.55 }) {
  const { exitRadius, throatRadius, chamberRadius, bellLength } = opts
  const yThroat = bellLength
  const bell = bellProfile(throatRadius, exitRadius, bellLength, yThroat)
  // Converging section, cylindrical chamber and injector dome.
  const chamber: Profile = [
    [throatRadius, yThroat],
    [throatRadius * 1.15, yThroat + 0.05],
    [chamberRadius, yThroat + 0.28],
    [chamberRadius, yThroat + 0.72],
    [chamberRadius * 0.92, yThroat + 0.8],
    [chamberRadius * 0.55, yThroat + 0.9],
    [0.001, yThroat + 0.94],
  ]
  const body = lathe([...bell, ...chamber], 48)

  const top = yThroat + 0.94
  const px = chamberRadius + 0.26 // turbopump axis offset from engine axis

  // Turbopump assembly hangs beside the chamber: pump body, turbine housing on top.
  const pump = cylinder(0.17, 0.17, 0.62, px, yThroat + 0.5, 0, 20)
  const turbine = cylinder(0.145, 0.145, 0.22, px, yThroat + 0.93, 0, 20)
  // Gas generator on the far side of the pump.
  const gasGen = cylinder(0.07, 0.07, 0.2, px, yThroat + 0.3, 0.22, 12)
  // Gimbal block on top of the injector dome.
  const gimbal = box(0.34, 0.26, 0.34, 0, top + 0.13, 0)

  // Horizontal ducts from the pump to the chamber head.
  const duct = (r: number, y: number, z: number) => {
    const g = cylinder(r, r, px - chamberRadius + 0.1, 0, 0, 0, 10)
    g.rotateZ(Math.PI / 2)
    g.translate((chamberRadius + px) / 2, y, z)
    return g
  }
  const loxDuct = duct(0.055, yThroat + 0.86, 0.06)
  const fuelDuct = duct(0.045, yThroat + 0.62, -0.08)

  const geometry = merge([body, pump, turbine, gasGen, gimbal, loxDuct, fuelDuct])
  return geometry as T.BufferGeometry
}

/** Merlin Vacuum: same power head, much longer radiatively-cooled nozzle extension. */
export function merlinVacuum() {
  return merlin1D({ ...MVAC, bellLength: 3.35 })
}

/**
 * Falcon 9 Block 5 layout in metres, Y up, X/Z centred on the vehicle axis.
 * y = 0 is the exit plane of the first-stage Merlin nozzles.
 *
 * Published numbers (SpaceX Falcon User's Guide, 2021): height 70 m, core
 * diameter 3.66 m, fairing 5.2 m × 13.1 m. Stage lengths overlap because the
 * second-stage nozzle sits inside the interstage and the fairing base wraps
 * the top of the second stage; the split below reproduces the 70 m total.
 */
export const R = 1.83 // core radius
export const D = R * 2

export const S1 = {
  nozzleBottom: 0,
  nozzleTop: 2.9, // Merlin 1D overall height ≈ 2.92 m
  octawebBottom: 1.45,
  octawebTop: 4.4,
  rp1Bottom: 4.4,
  rp1Top: 19.6,
  loxBottom: 19.6,
  loxTop: 41.2,
  top: 41.2,
}

export const INTERSTAGE = {
  bottom: 41.2,
  top: 47.9,
}

export const S2 = {
  nozzleBottom: 43.7,
  nozzleTop: 47.2,
  thrustBottom: 47.2,
  thrustTop: 48.6,
  rp1Bottom: 48.6,
  rp1Top: 53.0,
  loxBottom: 53.0,
  loxTop: 59.6,
  top: 59.6,
}

export const FAIRING = {
  radius: 2.6,
  bottom: 56.9,
  cylinderTop: 63.6,
  top: 70.0,
}

export const HEIGHT = FAIRING.top

/** Elliptical tank domes: height / radius ratio. */
export const DOME_RATIO = 0.62

export const MERLIN = {
  /** Sea-level Merlin 1D: exit diameter ≈ 0.92 m (expansion ratio 16). */
  exitRadius: 0.46,
  throatRadius: 0.115,
  chamberRadius: 0.24,
  /** Octaweb ring radius for the 8 outer engines. */
  ringRadius: 1.24,
  /**
   * Outer engines sit in a pinwheel: each turbopump points mostly tangentially
   * (plus a little outward) so nine power heads fit inside the 3.66 m skirt.
   */
  pinwheel: Math.PI / 2 + 0.35,
}

export const MVAC = {
  /** MVac expansion ratio 165 → exit diameter ≈ 3.0 m. */
  exitRadius: 1.5,
  throatRadius: 0.115,
  chamberRadius: 0.24,
}

export const GRID_FIN = {
  /** Centre height: hinged at the top of the interstage, hanging down when stowed. */
  y: 47.1,
  width: 1.55,
  height: 1.2,
  thickness: 0.28,
}

export const LEG = {
  hingeY: 2.4,
  length: 11.5,
  rootWidth: 0.9,
  tipWidth: 0.35,
}

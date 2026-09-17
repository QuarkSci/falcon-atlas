import * as T from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import type { Part, Rocket, SystemId } from '@/data/types'
import type { BuiltModel } from '@/models/types'
import type { View } from '@/store/useAtlas'
import { inventoryLayout, separationVector } from './explode'
import { flightPose, type FlightPose } from './flight'
import { createFlame, updateFlame, type Flame } from './flame'
import { createGround } from './ground'
import { createPartMaterial, tint, type PartMaterial } from './materials'
import { PointerTap } from './PointerTap'

export interface SceneSnapshot {
  visible: SystemId[]
  selected: string[]
  isolate: boolean
  explode: number
  view: View
  autoRotate: boolean
  cutaway: boolean
  cutawayAngle: number
  flight: boolean
  flightTime: number
  resetTick: number
  inspectorOpen: boolean
  hovered: string | null
}

export interface SceneCallbacks {
  onSelect: (id: string | null) => void
  onHover: (id: string | null) => void
  onError: (message: string) => void
}

interface PartEntry {
  part: Part
  id: string
  system: SystemId
  mesh: T.Mesh<T.BufferGeometry, PartMaterial>
  /** Assembled-position bounds, never mutated. */
  bounds: T.Box3
  centre: T.Vector3
  /** Full-separation displacement (first half of the slider). */
  separation: T.Vector3
  /** Inventory displacement (second half), recomputed per layout. */
  inventory: T.Vector3
  /** Inventory cell width in metres, for label fitting. */
  cellWidth: number
  selectedAmount: number
  hoverAmount: number
  poweredAmount: number
  /** Scratch object reused every frame by the flight-sequence pose computation. */
  flight: FlightPose
  label: HTMLDivElement
}

interface Insets {
  top: number
  bottom: number
  left: number
  right: number
}

/** The atlas renders dark only: the pad and sky read as a night launch. */
const THEME = { clear: '#0b0e14', ground: '#151a22', platform: '#1b2029', ring: '#465061', hemiSky: 0xbfcbe0, hemiGround: 0x1a1d24 } as const

/** Slider fraction where separation ends and the inventory grid begins. */
const SPLIT = 0.5

/**
 * Owns the WebGL renderer, camera and every part mesh. React drives it through
 * `setState`; the scene renders only when something changed.
 */
export class RocketScene {
  renderer: T.WebGLRenderer
  scene = new T.Scene()
  camera: T.PerspectiveCamera
  controls: OrbitControls
  private host: HTMLElement
  private rocket: Rocket
  private cb: SceneCallbacks
  private parts: PartEntry[] = []
  private byId = new Map<string, PartEntry>()
  private raycaster = new T.Raycaster()
  private tap = new PointerTap()
  private clock = new T.Clock()
  private frame = 0
  private dirty = true
  /** Extra frames rendered after the last change so compositors always get a settled image. */
  private settle = 0
  private disposed = false
  private state: SceneSnapshot | null = null
  private last: SceneSnapshot | null = null
  private pendingHover: { x: number; y: number } | null = null
  private hoveredId: string | null = null
  private observer: ResizeObserver
  private ground: T.Mesh
  private platform: T.Mesh
  private padRing: T.Mesh
  private padRingInner: T.Mesh
  private stars: T.Points
  private hemi: T.HemisphereLight
  private env: T.Texture
  private fly: { pos: T.Vector3; target: T.Vector3; t: number } | null = null
  private isolateKey = ''
  private layoutKey = ''
  /** Shared clip plane for the cutaway view; pushed far away (constant) to disable. */
  private clipPlane = new T.Plane(new T.Vector3(1, 0, 0), 1e4)
  private clipIndicator: T.Group
  /** Shared matte material for cut interiors, so a slice reads clearly as "hollow" rather than showing the same glossy exterior mirrored inward. */
  private interiorMaterial: T.MeshStandardMaterial
  private labelLayer: HTMLDivElement
  /** One exhaust flame per engine nozzle, parented to that nozzle's mesh. */
  private flames: { nozzle: PartEntry; flame: Flame }[] = []
  /** Smoothed explode amount that chases the store value. */
  private amount = 0
  private lastFitAmount = -1

  constructor(host: HTMLElement, rocket: Rocket, model: BuiltModel, cb: SceneCallbacks) {
    this.host = host
    this.rocket = rocket
    this.cb = cb
    this.renderer = new T.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
    const r = this.renderer
    r.setPixelRatio(Math.min(devicePixelRatio, host.clientWidth < 768 ? 1.5 : 2))
    r.outputColorSpace = T.SRGBColorSpace
    r.toneMapping = T.ACESFilmicToneMapping
    r.toneMappingExposure = 1.05
    r.localClippingEnabled = true
    r.domElement.setAttribute('aria-label', 'Interactive Falcon 9. Drag to orbit, scroll to zoom, tap a part to inspect it.')
    host.appendChild(r.domElement)

    this.labelLayer = document.createElement('div')
    this.labelLayer.className = 'part-labels'
    host.appendChild(this.labelLayer)

    this.camera = new T.PerspectiveCamera(30, 1, 0.1, 4000)
    this.controls = new OrbitControls(this.camera, r.domElement)
    const c = this.controls
    c.enableDamping = true
    c.dampingFactor = 0.08
    c.minDistance = 1.5
    c.maxDistance = 600
    // Keep a small margin off both poles: near vertical, azimuth becomes
    // ill-defined and OrbitControls can snap or spin unpredictably.
    c.minPolarAngle = Math.PI * 0.05
    c.maxPolarAngle = Math.PI * 0.92
    // Disabled while isolating a part (see the frame loop): cursor-relative
    // zoom does not account for the camera's view offset there and can
    // fling the framed part off-screen.
    c.zoomToCursor = true
    c.target.set(0, rocket.height / 2, 0)
    this.camera.position.set(60, rocket.height * 0.62, 150)
    c.addEventListener('change', () => (this.dirty = true))
    c.addEventListener('start', () => (this.fly = null))

    // Image-based lighting from a neutral studio, plus key, rim and fill lights.
    const pmrem = new T.PMREMGenerator(r)
    const room = new RoomEnvironment()
    this.env = pmrem.fromScene(room, 0.04).texture
    this.scene.environment = this.env
    room.dispose()
    pmrem.dispose()

    this.hemi = new T.HemisphereLight(THEME.hemiSky, THEME.hemiGround, 0.9)
    this.scene.add(this.hemi)
    const key = new T.DirectionalLight(0xfff7ee, 2.2)
    key.position.set(-80, 140, 120)
    this.scene.add(key)
    const rim = new T.DirectionalLight(0xdde8ff, 1.6)
    rim.position.set(90, 60, -120)
    this.scene.add(rim)
    const fill = new T.DirectionalLight(0xffffff, 0.5)
    fill.position.set(0, -40, 80)
    this.scene.add(fill)

    // Launch pad: gradient ground, a platform and guide rings.
    this.ground = createGround(THEME.ground, THEME.clear)
    this.scene.add(this.ground)
    this.platform = new T.Mesh(new T.CylinderGeometry(14, 14.4, 0.5, 96), new T.MeshStandardMaterial({ color: THEME.platform, metalness: 0.1, roughness: 0.7 }))
    this.platform.position.y = -0.3
    this.scene.add(this.platform)
    this.padRing = this.ring(12.6, 0.5)
    this.padRingInner = this.ring(9.5, 0.22)
    this.scene.add(this.padRing, this.padRingInner)

    this.stars = this.makeStars()
    this.scene.add(this.stars)

    // A closed shell's exterior material is DoubleSide (thin/open parts like
    // grid fins need to be seen from both sides even without cutting), so
    // its own backface would otherwise render at the exact same depth as
    // this interior cap and win the depth test at random (z-fighting). The
    // polygon offset nudges the cap fractionally closer to the camera so it
    // always wins, with no visible positional shift.
    this.interiorMaterial = new T.MeshStandardMaterial({
      color: '#2e3238',
      roughness: 0.95,
      metalness: 0.05,
      side: T.BackSide,
      clippingPlanes: [this.clipPlane],
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    })

    // Part meshes.
    for (const part of rocket.parts) {
      if (part.group) continue
      const built = model.get(part.id)
      if (!built) {
        console.warn(`No geometry for part ${part.id}`)
        continue
      }
      const material = createPartMaterial(built.material)
      material.clippingPlanes = [this.clipPlane]
      const mesh = new T.Mesh(built.geometry, material)
      mesh.name = part.id
      // A back-facing child sharing the same geometry: invisible normally
      // (front and back faces coincide), it only becomes visible where the
      // clip plane has sliced the shell open, giving the cavity a matte
      // "cut material" look instead of a mirrored copy of the exterior.
      mesh.add(new T.Mesh(built.geometry, this.interiorMaterial))
      const bounds = built.geometry.boundingBox!.clone()
      const centre = bounds.getCenter(new T.Vector3())
      const label = document.createElement('div')
      label.className = 'part-label'
      label.hidden = true
      this.labelLayer.appendChild(label)
      const entry: PartEntry = {
        part,
        id: part.id,
        system: part.system,
        mesh,
        bounds,
        centre,
        separation: separationVector(part, centre),
        inventory: new T.Vector3(),
        cellWidth: 0,
        selectedAmount: 0,
        hoverAmount: 0,
        poweredAmount: 0,
        flight: { offset: new T.Vector3(), quaternion: new T.Quaternion(), powered: 0 },
        label,
      }
      this.parts.push(entry)
      this.byId.set(part.id, entry)
      this.scene.add(mesh)
    }

    this.clipIndicator = this.makeClipIndicator()
    this.scene.add(this.clipIndicator)

    // One flame per engine, anchored at its nozzle's exit plane and parented
    // to that nozzle mesh so it automatically follows the engine through
    // every explode, isolate and flight-sequence transform.
    const nozzleIds = [...Array.from({ length: 9 }, (_, i) => `merlin-${i + 1}-nozzle`), 'mvac-nozzle-extension']
    for (const id of nozzleIds) {
      const nozzle = this.byId.get(id)
      if (!nozzle) continue
      const box = nozzle.bounds
      const exitRadius = Math.max(0.1, (box.max.x - box.min.x) / 2, (box.max.z - box.min.z) / 2)
      const flame = createFlame(exitRadius)
      flame.group.position.set((box.min.x + box.max.x) / 2, box.min.y, (box.min.z + box.max.z) / 2)
      nozzle.mesh.add(flame.group)
      this.flames.push({ nozzle, flame })
    }

    this.renderer.setClearColor(THEME.clear)

    this.observer = new ResizeObserver(() => this.resize())
    this.observer.observe(host)
    this.resize()

    const el = r.domElement
    el.addEventListener('pointerdown', this.onDown)
    el.addEventListener('pointermove', this.onMove)
    el.addEventListener('pointerup', this.onUp)
    el.addEventListener('pointercancel', this.onCancel)
    el.addEventListener('pointerleave', this.onLeave)
    el.addEventListener('webglcontextlost', this.onContextLost)
    // Attached to the host (the canvas's parent), not the canvas itself:
    // OrbitControls' own wheel listener lives on the canvas, and a listener
    // on the same target fires in registration order regardless of the
    // capture flag. A true ancestor genuinely sees the event first during
    // the capture phase, letting us stop it before OrbitControls ever does.
    this.host.addEventListener('wheel', this.onWheel, { capture: true, passive: false })

    this.animate()
  }

  // ── Public API ──────────────────────────────────────────────────────

  setState(state: SceneSnapshot) {
    this.state = state
    this.dirty = true
  }

  /** Part names for the inventory labels, in the active language. */
  setLabels(names: Record<string, string>) {
    for (const p of this.parts) p.label.textContent = names[p.id] ?? p.id
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.frame)
    this.observer.disconnect()
    const el = this.renderer.domElement
    el.removeEventListener('pointerdown', this.onDown)
    el.removeEventListener('pointermove', this.onMove)
    el.removeEventListener('pointerup', this.onUp)
    el.removeEventListener('pointercancel', this.onCancel)
    el.removeEventListener('pointerleave', this.onLeave)
    el.removeEventListener('webglcontextlost', this.onContextLost)
    this.host.removeEventListener('wheel', this.onWheel, { capture: true })
    this.controls.dispose()
    this.scene.traverse((o) => {
      if (o instanceof T.Mesh || o instanceof T.Points || o instanceof T.LineSegments) {
        o.geometry.dispose()
        const ms = Array.isArray(o.material) ? o.material : [o.material]
        ms.forEach((m) => m.dispose())
      }
    })
    this.env.dispose()
    this.renderer.dispose()
    this.labelLayer.remove()
    el.remove()
  }

  // ── Setup helpers ───────────────────────────────────────────────────

  private ring(radius: number, opacity: number) {
    const m = new T.Mesh(new T.RingGeometry(radius, radius + 0.08, 160), new T.MeshBasicMaterial({ color: THEME.ring, transparent: true, opacity, side: T.DoubleSide }))
    m.rotation.x = -Math.PI / 2
    m.position.y = -0.04
    return m
  }

  private makeStars() {
    const n = 1800
    const pos = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const v = new T.Vector3().randomDirection().multiplyScalar(1500)
      if (v.y < -100) v.y = -v.y
      pos.set([v.x, v.y, v.z], i * 3)
    }
    const g = new T.BufferGeometry()
    g.setAttribute('position', new T.BufferAttribute(pos, 3))
    const m = new T.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.55, depthWrite: false })
    const p = new T.Points(g, m)
    p.frustumCulled = false
    return p
  }

  /**
   * A faint quad marking the cutaway plane, plus a bright edge — the plane
   * itself has no visible thickness, so without this the "missing" half of
   * the rocket would give no sense of where the cut actually is. Oriented at
   * rotation.y = 0 for a plane whose normal is +Z; the frame loop rotates the
   * whole group to match the clip plane's current angle.
   */
  private makeClipIndicator() {
    const group = new T.Group()
    const height = this.rocket.height + 6
    const width = Math.max(30, this.rocket.diameter * 5)
    const fill = new T.Mesh(
      new T.PlaneGeometry(width, height),
      new T.MeshBasicMaterial({ color: 0x3ed2c0, transparent: true, opacity: 0.05, side: T.DoubleSide, depthWrite: false }),
    )
    fill.position.y = this.rocket.height / 2
    group.add(fill)
    const edges = new T.EdgesGeometry(new T.PlaneGeometry(width, height))
    const line = new T.LineSegments(edges, new T.LineBasicMaterial({ color: 0x3ed2c0, transparent: true, opacity: 0.35 }))
    line.position.y = this.rocket.height / 2
    group.add(line)
    group.visible = false
    group.renderOrder = 5
    return group
  }

  private resize() {
    const w = this.host.clientWidth,
      h = this.host.clientHeight
    if (!w || !h) return
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, w < 768 || h < 600 ? 1.5 : 2))
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
    this.layoutKey = ''
    this.isolateKey = ''
    this.lastFitAmount = -1
    if (this.state) this.frameFor(this.state, false)
    this.dirty = true
  }

  // ── Camera ──────────────────────────────────────────────────────────

  private viewDirection(view: View) {
    switch (view) {
      case 'front':
        return new T.Vector3(0, 0.04, 1)
      case 'back':
        return new T.Vector3(0, 0.04, -1)
      case 'side':
        return new T.Vector3(1, 0.04, 0)
      default:
        return new T.Vector3(0.42, 0.14, 1).normalize()
    }
  }

  private isMobile() {
    return this.host.clientWidth < 768
  }

  /**
   * Screen areas covered by UI chrome, in CSS pixels. Measured from the real
   * DOM (siblings of the canvas in `.studio`) rather than guessed, so the
   * isolated-part camera always leaves clear space next to whatever panels
   * actually happen to be open, at any window size.
   */
  private insets(): Insets {
    const mobile = this.isMobile()
    const hostRect = this.host.getBoundingClientRect()
    const gap = 20
    const base: Insets = mobile ? { top: 88, bottom: 84, left: 16, right: 16 } : { top: 88, bottom: 96, left: 24, right: 24 }
    const root = this.host.parentElement
    const overlapsV = (r: DOMRect) => r.bottom > hostRect.top && r.top < hostRect.bottom
    const overlapsH = (r: DOMRect) => r.right > hostRect.left && r.left < hostRect.right
    const grow = (key: keyof Insets, value: number) => {
      base[key] = Math.max(base[key], value)
    }
    if (root) {
      const identity = root.querySelector('.identity')
      const topActions = root.querySelector('.top-actions')
      for (const el of [identity, topActions]) {
        if (!el) continue
        const r = el.getBoundingClientRect()
        if (r.width > 0 && overlapsH(r)) grow('top', r.bottom - hostRect.top + 16)
      }
      const rail = root.querySelector('.side-rail')
      if (rail) {
        const r = rail.getBoundingClientRect()
        if (r.width > 0 && overlapsV(r)) grow('left', r.right - hostRect.left + gap)
      }
      const dock = root.querySelector('.bottom-dock')
      if (dock) {
        const r = dock.getBoundingClientRect()
        if (r.width > 0) grow('bottom', hostRect.bottom - r.top + 16)
      }
      if (mobile) {
        // Panels are bottom sheets or a top strip on narrow screens.
        const inspector = root.querySelector('.inspector.open')
        const systems = root.querySelector('.sheet.open')
        const search = root.querySelector('.search-panel')
        for (const el of [inspector, systems]) {
          if (!el) continue
          const r = (el as HTMLElement).getBoundingClientRect()
          if (r.width > 0 && overlapsH(r)) grow('bottom', hostRect.bottom - r.top + gap)
        }
        if (search) {
          const r = (search as HTMLElement).getBoundingClientRect()
          if (r.width > 0) grow('top', r.bottom - hostRect.top + gap)
        }
      } else {
        const systems = root.querySelector('.sheet.open')
        if (systems) {
          const r = systems.getBoundingClientRect()
          if (r.width > 0 && overlapsV(r)) grow('left', r.right - hostRect.left + gap)
        }
        const inspector = root.querySelector('.inspector.open')
        if (inspector) {
          const r = (inspector as HTMLElement).getBoundingClientRect()
          if (r.width > 0 && overlapsV(r)) grow('right', hostRect.right - r.left + gap)
        }
      }
    }
    return base
  }

  /** Aim the camera so `box` fills the region left free by `insets`. */
  private fitBox(box: T.Box3, view: View, insets: Insets, animate: boolean, margin = 1.08) {
    const w = this.host.clientWidth,
      h = this.host.clientHeight
    const left = insets.left,
      right = w - insets.right,
      top = insets.top,
      bottom = h - insets.bottom
    const availW = Math.max(150, right - left),
      availH = Math.max(80, bottom - top)
    const centre = box.getCenter(new T.Vector3()),
      size = box.getSize(new T.Vector3())
    this.camera.setViewOffset(w, h, w / 2 - (left + right) / 2, h / 2 - (top + bottom) / 2, w, h)
    const fov = T.MathUtils.degToRad(this.camera.fov / 2)
    const dir = this.viewDirection(view)
    // Depth along the view direction adds to the needed distance.
    const depth = Math.abs(size.x * dir.x) + Math.abs(size.z * dir.z)
    const distance = Math.max(1.5, (Math.max((size.y * h) / availH, (Math.hypot(size.x * dir.z, size.z * dir.x) * w) / availW / this.camera.aspect) / (2 * Math.tan(fov))) * margin + depth / 2)
    this.controls.maxDistance = Math.max(600, distance * 3)
    this.goTo(centre.clone().addScaledVector(dir, distance), centre, animate)
  }

  private goTo(pos: T.Vector3, target: T.Vector3, animate: boolean) {
    if (!animate) {
      this.camera.position.copy(pos)
      this.controls.target.copy(target)
      this.controls.update()
      this.fly = null
    } else {
      this.fly = { pos, target, t: 0 }
    }
    this.dirty = true
  }

  /** Bounding box of the currently visible parts at their current offsets. */
  private visibleBox() {
    const box = new T.Box3()
    for (const p of this.parts) if (p.mesh.visible) box.union(p.bounds.clone().translate(p.mesh.position))
    return box
  }

  /** Choose the framing for the current mode: assembled, exploded, isolated or flying. */
  private frameFor(s: SceneSnapshot, animate: boolean) {
    if (s.flight) {
      const box = this.visibleBox()
      if (!box.isEmpty()) this.fitBox(box, 'three-quarter', this.insets(), animate, 1.12)
      return
    }
    if (s.isolate) {
      const box = this.visibleBox()
      if (!box.isEmpty()) this.fitBox(box, s.view, this.insets(), animate, 1.3)
      return
    }
    if (this.amount < 0.02) {
      const box = new T.Box3(new T.Vector3(-this.rocket.diameter * 1.5, -1, -this.rocket.diameter * 1.5), new T.Vector3(this.rocket.diameter * 1.5, this.rocket.height + 1, this.rocket.diameter * 1.5))
      this.fitBox(box, s.view, this.insets(), animate)
      return
    }
    const box = this.visibleBox()
    if (!box.isEmpty()) this.fitBox(box, this.amount > 0.8 ? 'front' : s.view, this.insets(), animate, 1.06)
  }

  // ── Explode ─────────────────────────────────────────────────────────

  /** Recompute inventory cells whenever the visible set or aspect changes. */
  private updateLayout(visibleParts: PartEntry[]) {
    const key = visibleParts.map((p) => p.id).join(',') + ':' + this.camera.aspect.toFixed(3)
    if (key === this.layoutKey) return
    this.layoutKey = key
    const { cells } = inventoryLayout(visibleParts, this.camera.aspect)
    for (const p of this.parts) {
      const cell = cells.get(p.id)
      if (cell) {
        p.inventory.set(cell.x - p.centre.x, cell.y + this.rocket.height * 0.55 - p.centre.y, -p.centre.z)
        p.cellWidth = cell.width
      } else p.inventory.set(0, 0, 0)
    }
  }

  /** Apply the blended separation / inventory offsets to every mesh. */
  private applyOffsets() {
    const a = this.amount
    for (const p of this.parts) {
      const pos = p.mesh.position
      if (a <= SPLIT) {
        const t = smooth(a / SPLIT)
        pos.copy(p.separation).multiplyScalar(t)
      } else {
        const t = smooth((a - SPLIT) / (1 - SPLIT))
        pos.copy(p.separation).lerp(p.inventory, t)
      }
      p.mesh.quaternion.identity()
    }
  }

  /** Pose every part along the scripted flight sequence at time `t`. */
  private applyFlight(t: number) {
    for (const p of this.parts) {
      flightPose(p.part, p.centre, t, p.flight)
      p.mesh.position.copy(p.flight.offset)
      p.mesh.quaternion.copy(p.flight.quaternion)
    }
  }

  // ── Pointer ─────────────────────────────────────────────────────────

  private onDown = (e: PointerEvent) => {
    this.tap.down(e.pointerId, e.clientX, e.clientY, e.pointerType === 'touch' ? 12 : 5)
  }
  private onMove = (e: PointerEvent) => {
    this.tap.move(e.pointerId, e.clientX, e.clientY)
    if (e.buttons || e.pointerType === 'touch') {
      this.pendingHover = null
      this.setHovered(null)
      return
    }
    const rect = this.host.getBoundingClientRect()
    this.pendingHover = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    this.dirty = true
  }
  private onLeave = () => {
    this.pendingHover = null
    this.setHovered(null)
  }
  private onCancel = (e: PointerEvent) => this.tap.cancel(e.pointerId)
  private onUp = (e: PointerEvent) => {
    if (!this.tap.up(e.pointerId, e.clientX, e.clientY)) return
    const rect = this.host.getBoundingClientRect()
    this.cb.onSelect(this.pick(e.clientX - rect.left, e.clientY - rect.top))
  }
  private onContextLost = (e: Event) => {
    e.preventDefault()
    this.cb.onError('context-lost')
  }

  /**
   * Trackpads send plain two-finger scrolling and pinch-to-zoom as the same
   * DOM `wheel` event, distinguished only by `ctrlKey` (which the browser
   * sets synthetically for a pinch gesture). OrbitControls treats every
   * wheel event as zoom, which is why a plain scroll — meant to pan down to
   * the rest of the vehicle — instead just zoomed in and out. This handler
   * runs in the capture phase so it sees the event before OrbitControls'
   * own bubble-phase listener does, and stops it there.
   */
  private onWheel = (e: WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const c = this.controls
    if (e.ctrlKey) {
      // Pinch: dolly toward/away from the current target.
      const offset = this.camera.position.clone().sub(c.target)
      const scale = Math.pow(0.985, -e.deltaY)
      const dist = T.MathUtils.clamp(offset.length() * scale, c.minDistance, c.maxDistance)
      offset.setLength(dist)
      this.camera.position.copy(c.target).add(offset)
    } else {
      // Plain scroll: pan across the view plane, screen-space proportional
      // like OrbitControls' own drag-to-pan. The camera moves *with* the
      // fingers (so the vehicle travels the opposite way), which is what
      // scrolling a document does and what this reads as in practice — the
      // reverse felt like dragging the model around and was disorienting.
      const offset = this.camera.position.clone().sub(c.target)
      const targetDistance = offset.length() * Math.tan(T.MathUtils.degToRad(this.camera.fov / 2))
      const panX = new T.Vector3().setFromMatrixColumn(this.camera.matrix, 0)
      const panY = new T.Vector3().setFromMatrixColumn(this.camera.matrix, 1)
      const h = this.host.clientHeight || 1
      panX.multiplyScalar((e.deltaX * 2 * targetDistance) / h)
      panY.multiplyScalar((-e.deltaY * 2 * targetDistance) / h)
      const pan = panX.add(panY)
      this.camera.position.add(pan)
      c.target.add(pan)
    }
    c.update()
    this.fly = null
    this.dirty = true
  }

  private pick(x: number, y: number): string | null {
    const w = this.host.clientWidth,
      h = this.host.clientHeight
    const ndc = new T.Vector2((x / w) * 2 - 1, -(y / h) * 2 + 1)
    this.raycaster.setFromCamera(ndc, this.camera)
    const candidates = this.parts.filter((p) => p.mesh.visible).map((p) => p.mesh)
    const hits = this.raycaster.intersectObjects(candidates, false)
    return hits[0] ? hits[0].object.name : null
  }

  private setHovered(id: string | null) {
    if (id === this.hoveredId) return
    this.hoveredId = id
    this.renderer.domElement.style.cursor = id ? 'pointer' : this.amount > 0.8 ? 'move' : 'grab'
    this.cb.onHover(id)
    this.dirty = true
  }

  // ── Labels ──────────────────────────────────────────────────────────

  private updateLabels() {
    const show = this.amount > 0.72 && !this.state?.isolate
    const w = this.host.clientWidth,
      h = this.host.clientHeight
    const v = new T.Vector3()
    const edge = new T.Vector3()
    const fade = Math.min(1, (this.amount - 0.72) / 0.2)
    this.labelLayer.style.opacity = String(fade)
    const selection = new Set(this.state?.selected ?? [])
    for (const p of this.parts) {
      let visible = show && p.mesh.visible
      if (visible) {
        // Anchor just below the part's bounding box; measure the cell width on screen.
        v.set(p.centre.x + p.mesh.position.x, p.bounds.min.y + p.mesh.position.y - 0.4, p.centre.z + p.mesh.position.z).project(this.camera)
        edge.set(p.centre.x + p.mesh.position.x + p.cellWidth / 2, p.bounds.min.y + p.mesh.position.y - 0.4, p.centre.z + p.mesh.position.z).project(this.camera)
        const cellPx = Math.abs(edge.x - v.x) * w
        const emphasised = p.id === this.hoveredId || selection.has(p.id)
        if (v.z < -1 || v.z > 1 || (cellPx < 46 && !emphasised)) visible = false
        else {
          const x = ((v.x + 1) * w) / 2,
            y = ((1 - v.y) * h) / 2
          p.label.style.transform = `translate(-50%, 0) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`
          p.label.style.maxWidth = emphasised ? '220px' : `${Math.max(46, cellPx - 6).toFixed(0)}px`
          p.label.classList.toggle('emphasised', emphasised)
        }
      }
      if (p.label.hidden !== !visible) p.label.hidden = !visible
    }
  }

  // ── Frame loop ──────────────────────────────────────────────────────

  private animate = () => {
    if (this.disposed) return
    this.frame = requestAnimationFrame(this.animate)
    const dt = Math.min(this.clock.getDelta(), 0.05)
    const s = this.state
    if (!s) return
    const last = this.last
    const first = last === null


    // Cutaway plane: rotate to the chosen azimuth, or push it far away to
    // disable clipping entirely (cheaper than toggling clippingPlanes on
    // every material).
    if (first || last.cutaway !== s.cutaway || last.cutawayAngle !== s.cutawayAngle) {
      if (s.cutaway) {
        const rad = T.MathUtils.degToRad(s.cutawayAngle)
        // Negated: we want to remove the near (camera-facing) half so the
        // cut reveals the interior toward the viewer, not the far side.
        this.clipPlane.normal.set(-Math.cos(rad), 0, -Math.sin(rad))
        this.clipPlane.constant = 0
        this.clipIndicator.rotation.y = Math.PI / 2 - rad
      } else {
        this.clipPlane.constant = 1e4
      }
      this.dirty = true
    }
    const showIndicator = s.cutaway && !s.isolate
    if (this.clipIndicator.visible !== showIndicator) {
      this.clipIndicator.visible = showIndicator
      this.dirty = true
    }

    // Explode amount chases the slider (irrelevant while the flight sequence drives poses).
    const moving = !s.flight && Math.abs(this.amount - s.explode) > 0.0005
    if (moving) {
      this.amount = T.MathUtils.damp(this.amount, s.explode, 9, dt)
      if (Math.abs(this.amount - s.explode) < 0.0005) this.amount = s.explode
    }

    // Visibility.
    const visibleSet = new Set(s.visible),
      selection = new Set(s.selected)
    const visibilityChanged = first || last.visible !== s.visible || last.selected !== s.selected || last.isolate !== s.isolate
    if (visibilityChanged) {
      for (const p of this.parts) p.mesh.visible = s.isolate ? selection.has(p.id) : visibleSet.has(p.system) || selection.has(p.id)
      this.dirty = true
    }
    // Kept visible during flight too, on purpose: as the vehicle climbs away
    // from it, the pad drifting out of the auto-fit frame is what actually
    // sells the sense of lifting off.
    const showPad = !s.isolate && this.amount < 0.45
    this.ground.visible = this.platform.visible = this.padRing.visible = this.padRingInner.visible = showPad

    // Offsets.
    const flightTimeChanged = s.flight && (first || last.flight !== s.flight || last.flightTime !== s.flightTime)
    if (s.flight) {
      if (flightTimeChanged) {
        this.applyFlight(s.flightTime)
        this.dirty = true
      }
    } else if (moving || visibilityChanged || (last?.flight && !s.flight)) {
      this.updateLayout(this.parts.filter((p) => p.mesh.visible))
      this.applyOffsets()
      this.dirty = true
    }

    // Camera framing.
    const viewChanged = first || last.resetTick !== s.resetTick || last.view !== s.view
    const isolateKey = s.isolate ? `${s.selected.join(',')}:${s.inspectorOpen}` : ''
    const isolateChanged = isolateKey !== this.isolateKey
    if (s.flight) {
      if (flightTimeChanged) this.frameFor(s, false)
    } else if (viewChanged || isolateChanged) {
      this.frameFor(s, !first)
      this.isolateKey = isolateKey
      this.lastFitAmount = this.amount
    } else if (moving && !s.isolate && this.amount > 0.02) {
      // Follow the expanding assembly while the slider moves.
      this.frameFor(s, false)
      this.lastFitAmount = this.amount
    } else if (!moving && this.lastFitAmount > 0.02 && this.amount < 0.02) {
      this.frameFor(s, true)
      this.lastFitAmount = 0
    }

    // Camera fly-to.
    if (this.fly) {
      this.fly.t = Math.min(1, this.fly.t + dt / 0.75)
      const k = 1 - Math.pow(1 - this.fly.t, 3)
      this.camera.position.lerp(this.fly.pos, k)
      this.controls.target.lerp(this.fly.target, k)
      if (this.fly.t >= 1) this.fly = null
      this.dirty = true
    }

    // Hover raycast (once per frame at most).
    if (this.pendingHover) {
      this.setHovered(this.pick(this.pendingHover.x, this.pendingHover.y))
      this.pendingHover = null
    }

    // Smooth highlight amounts (engine glow is already a smooth function of
    // flight time, so it needs no damping of its own — just picking it up).
    for (const p of this.parts) {
      const targetSel = selection.has(p.id) ? 1 : 0
      const targetHov = p.id === this.hoveredId ? 1 : 0
      const targetPow = s.flight ? p.flight.powered : 0
      if (Math.abs(p.selectedAmount - targetSel) > 0.002 || Math.abs(p.hoverAmount - targetHov) > 0.002 || Math.abs(p.poweredAmount - targetPow) > 0.002) {
        p.selectedAmount = T.MathUtils.damp(p.selectedAmount, targetSel, 14, dt)
        p.hoverAmount = T.MathUtils.damp(p.hoverAmount, targetHov, 18, dt)
        p.poweredAmount = targetPow
        tint(p.mesh.material, p.selectedAmount, p.hoverAmount, p.poweredAmount)
        this.dirty = true
      }
    }

    // Exhaust flames flicker every frame while firing, so they update
    // unconditionally rather than only on change like the tint above.
    if (s.flight) {
      for (const { nozzle, flame } of this.flames) {
        if (flame.group.visible || nozzle.poweredAmount > 0.01) this.dirty = true
        updateFlame(flame, nozzle.poweredAmount)
      }
    } else if (this.flames.some((f) => f.flame.group.visible)) {
      for (const { flame } of this.flames) flame.group.visible = false
      this.dirty = true
    }

    // Controls behave like a 2D board once the inventory is laid out.
    const board = this.amount > 0.8
    const c = this.controls
    c.enableRotate = !board
    c.mouseButtons.LEFT = board ? T.MOUSE.PAN : T.MOUSE.ROTATE
    c.touches.ONE = board ? T.TOUCH.PAN : T.TOUCH.ROTATE
    c.zoomToCursor = !s.isolate
    c.autoRotate = s.autoRotate && !s.isolate && this.amount < 0.4
    c.autoRotateSpeed = 0.6
    c.update()
    if (c.autoRotate) this.dirty = true

    this.last = s
    if (this.dirty) this.settle = 3
    if (this.settle > 0) {
      this.settle--
      this.renderer.render(this.scene, this.camera)
      this.updateLabels()
      this.dirty = false
    }
  }
}

/** Ease-in-out so pieces settle gently at both ends of a phase. */
function smooth(t: number) {
  const x = Math.max(0, Math.min(1, t))
  return x * x * (3 - 2 * x)
}

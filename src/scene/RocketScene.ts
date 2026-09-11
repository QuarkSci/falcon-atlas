import * as T from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import type { Rocket, SystemId } from '@/data/types'
import type { BuiltModel } from '@/models/types'
import type { Theme, View } from '@/store/useAtlas'
import { createPartMaterial, retheme, tint, type PartMaterial } from './materials'
import { PointerTap } from './PointerTap'
import { createGround, rethemeGround } from './ground'

export interface SceneSnapshot {
  visible: SystemId[]
  selected: string[]
  isolate: boolean
  explode: number
  view: View
  autoRotate: boolean
  resetTick: number
  theme: Theme
  inspectorOpen: boolean
  hovered: string | null
}

export interface SceneCallbacks {
  onSelect: (id: string | null) => void
  onHover: (id: string | null) => void
  onError: (message: string) => void
}

interface PartEntry {
  id: string
  system: SystemId
  mesh: T.Mesh<T.BufferGeometry, PartMaterial>
  /** Assembled-position bounds, never mutated. */
  bounds: T.Box3
  centre: T.Vector3
  selectedAmount: number
  hoverAmount: number
}

const THEME = {
  dark: { clear: '#0b0e14', ground: '#151a22', platform: '#1b2029', ring: '#465061', hemiSky: 0xbfcbe0, hemiGround: 0x1a1d24 },
  light: { clear: '#f2f3f4', ground: '#dfe2e5', platform: '#e9ebed', ring: '#8c969f', hemiSky: 0xffffff, hemiGround: 0xa7acb2 },
} as const

/**
 * Owns the WebGL renderer, camera and every part mesh. React drives it through
 * `setState`; the scene renders only when something changed.
 */
export class RocketScene {
  renderer: T.WebGLRenderer
  scene = new T.Scene()
  camera: T.PerspectiveCamera
  controls: OrbitControls
  private parts: PartEntry[] = []
  private byId = new Map<string, PartEntry>()
  private raycaster = new T.Raycaster()
  private tap = new PointerTap()
  private clock = new T.Clock()
  private frame = 0
  private dirty = true
  private disposed = false
  private state: SceneSnapshot | null = null
  private lastApplied: SceneSnapshot | null = null
  private pendingHover: { x: number; y: number } | null = null
  private hoveredId: string | null = null
  private observer: ResizeObserver
  private ground: T.Mesh
  private padRing: T.Mesh
  private padRingInner: T.Mesh
  private stars: T.Points
  private hemi: T.HemisphereLight
  private env: T.Texture
  private fly: { pos: T.Vector3; target: T.Vector3; t: number } | null = null
  private isolateKey = ''
  private host: HTMLElement
  private rocket: Rocket
  private cb: SceneCallbacks

  constructor(host: HTMLElement, rocket: Rocket, model: BuiltModel, cb: SceneCallbacks, theme: Theme) {
    this.host = host
    this.rocket = rocket
    this.cb = cb
    this.renderer = new T.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
    const r = this.renderer
    r.setPixelRatio(Math.min(devicePixelRatio, host.clientWidth < 768 ? 1.5 : 2))
    r.outputColorSpace = T.SRGBColorSpace
    r.toneMapping = T.ACESFilmicToneMapping
    r.toneMappingExposure = 1.05
    r.domElement.setAttribute('aria-label', 'Interactive Falcon 9. Drag to orbit, scroll to zoom, tap a part to inspect it.')
    host.appendChild(r.domElement)

    this.camera = new T.PerspectiveCamera(30, 1, 0.1, 4000)
    this.controls = new OrbitControls(this.camera, r.domElement)
    const c = this.controls
    c.enableDamping = true
    c.dampingFactor = 0.08
    c.minDistance = 1.5
    c.maxDistance = 600
    c.maxPolarAngle = Math.PI * 0.94
    c.zoomToCursor = true
    c.target.set(0, rocket.height / 2, 0)
    this.camera.position.set(60, rocket.height * 0.62, 150)
    c.addEventListener('change', () => (this.dirty = true))
    c.addEventListener('start', () => (this.fly = null))

    // Image-based lighting from a neutral studio, plus key and rim lights.
    const pmrem = new T.PMREMGenerator(r)
    const room = new RoomEnvironment()
    this.env = pmrem.fromScene(room, 0.04).texture
    this.scene.environment = this.env
    room.dispose()
    pmrem.dispose()

    this.hemi = new T.HemisphereLight(THEME[theme].hemiSky, THEME[theme].hemiGround, 0.9)
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

    // Launch pad: a wide ground disc, a pad platform and guide rings.
    this.ground = createGround(THEME[theme].ground, THEME[theme].clear)
    this.scene.add(this.ground)
    const platform = new T.Mesh(new T.CylinderGeometry(14, 14.4, 0.5, 96), new T.MeshStandardMaterial({ color: THEME[theme].platform, metalness: 0.1, roughness: 0.7 }))
    platform.position.y = -0.3
    platform.name = 'platform'
    this.scene.add(platform)
    this.padRing = new T.Mesh(new T.RingGeometry(12.6, 12.7, 160), new T.MeshBasicMaterial({ color: THEME[theme].ring, transparent: true, opacity: 0.5, side: T.DoubleSide }))
    this.padRing.rotation.x = -Math.PI / 2
    this.padRing.position.y = -0.04
    this.scene.add(this.padRing)
    this.padRingInner = new T.Mesh(new T.RingGeometry(9.5, 9.55, 160), new T.MeshBasicMaterial({ color: THEME[theme].ring, transparent: true, opacity: 0.22, side: T.DoubleSide }))
    this.padRingInner.rotation.x = -Math.PI / 2
    this.padRingInner.position.y = -0.04
    this.scene.add(this.padRingInner)

    this.stars = this.makeStars()
    this.scene.add(this.stars)

    // Part meshes.
    for (const part of rocket.parts) {
      const built = model.get(part.id)
      if (!built) {
        console.warn(`No geometry for part ${part.id}`)
        continue
      }
      const material = createPartMaterial(built.material, theme)
      const mesh = new T.Mesh(built.geometry, material)
      mesh.name = part.id
      mesh.frustumCulled = true
      const bounds = built.geometry.boundingBox!.clone()
      const entry: PartEntry = { id: part.id, system: part.system, mesh, bounds, centre: bounds.getCenter(new T.Vector3()), selectedAmount: 0, hoverAmount: 0 }
      this.parts.push(entry)
      this.byId.set(part.id, entry)
      this.scene.add(mesh)
    }

    this.applyTheme(theme)

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

    this.animate()
  }

  // ── Public API ──────────────────────────────────────────────────────

  setState(state: SceneSnapshot) {
    this.state = state
    this.dirty = true
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
    this.controls.dispose()
    this.scene.traverse((o) => {
      if (o instanceof T.Mesh || o instanceof T.Points) {
        o.geometry.dispose()
        const ms = Array.isArray(o.material) ? o.material : [o.material]
        ms.forEach((m) => m.dispose())
      }
    })
    this.env.dispose()
    this.renderer.dispose()
    el.remove()
  }

  // ── Setup helpers ───────────────────────────────────────────────────

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

  private applyTheme(theme: Theme) {
    const t = THEME[theme]
    this.renderer.setClearColor(t.clear)
    rethemeGround(this.ground, t.ground, t.clear)
    ;(this.padRing.material as T.MeshBasicMaterial).color.set(t.ring)
    ;(this.padRingInner.material as T.MeshBasicMaterial).color.set(t.ring)
    const platform = this.scene.getObjectByName('platform') as T.Mesh | undefined
    if (platform) (platform.material as T.MeshStandardMaterial).color.set(t.platform)
    this.hemi.color.set(t.hemiSky)
    this.hemi.groundColor.set(t.hemiGround)
    this.stars.visible = theme === 'dark'
    for (const p of this.parts) retheme(p.mesh.material, theme)
    this.dirty = true
  }

  private resize() {
    const w = this.host.clientWidth,
      h = this.host.clientHeight
    if (!w || !h) return
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, w < 768 || h < 600 ? 1.5 : 2))
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
    if (this.state) this.fit(this.state.view, false)
    this.isolateKey = ''
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

  /** Frame the whole vehicle, leaving room for the UI chrome. */
  private fit(view: View, animate = true) {
    const w = this.host.clientWidth,
      h = this.host.clientHeight
    const mobile = w < 768
    const reservedTop = mobile ? 140 : 96,
      reservedBottom = mobile ? 200 : 150
    const usable = Math.max(200, h - reservedTop - reservedBottom)
    const fov = T.MathUtils.degToRad(this.camera.fov / 2)
    const height = this.rocket.height + 2
    let distance = (height / 2 / Math.tan(fov)) * (h / usable) * 1.04
    // Ensure the width fits too on very narrow viewports.
    const hFov = Math.atan(Math.tan(fov) * this.camera.aspect)
    distance = Math.max(distance, (this.rocket.diameter * 3) / 2 / Math.tan(hFov))
    // Centre the rocket in the band between the top chrome and the bottom dock:
    // the band centre sits (reservedBottom - reservedTop) / 2 px above the canvas centre.
    const target = new T.Vector3(0, this.rocket.height / 2 - ((reservedBottom - reservedTop) / 2) * (height / usable), 0)
    const pos = target.clone().addScaledVector(this.viewDirection(view), distance)
    this.camera.clearViewOffset()
    this.controls.maxDistance = Math.max(600, distance * 2)
    this.goTo(pos, target, animate)
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

  /** Fit the camera around the isolated selection, keeping clear of open panels. */
  private fitIsolated(s: SceneSnapshot) {
    const box = new T.Box3()
    for (const id of s.selected) {
      const p = this.byId.get(id)
      if (p && p.mesh.visible) box.union(p.bounds.clone().translate(p.mesh.position))
    }
    if (box.isEmpty()) return
    const w = this.host.clientWidth,
      h = this.host.clientHeight
    const mobile = w < 768
    let left = 24,
      right = w - 24,
      top = mobile ? 170 : 110,
      bottom = h - 170
    if (s.inspectorOpen) {
      if (mobile) bottom = h * 0.5
      else {
        right = w - 400
        left = w > 1100 ? 300 : 24
      }
    }
    const availW = Math.max(150, right - left),
      availH = Math.max(80, bottom - top)
    const centre = box.getCenter(new T.Vector3()),
      size = box.getSize(new T.Vector3())
    this.camera.setViewOffset(w, h, w / 2 - (left + right) / 2, h / 2 - (top + bottom) / 2, w, h)
    const fov = T.MathUtils.degToRad(this.camera.fov / 2)
    const distance = Math.max(1.5, (Math.max((size.y * h) / availH, (size.x * w) / availW / this.camera.aspect, size.z) / (2 * Math.tan(fov))) * 1.35)
    this.controls.maxDistance = Math.max(600, distance * 3)
    const dir = this.viewDirection(s.view)
    this.goTo(centre.clone().addScaledVector(dir, distance), centre, true)
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
    const hit = this.pick(e.clientX - rect.left, e.clientY - rect.top)
    this.cb.onSelect(hit)
  }
  private onContextLost = (e: Event) => {
    e.preventDefault()
    this.cb.onError('context-lost')
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
    this.renderer.domElement.style.cursor = id ? 'pointer' : 'grab'
    this.cb.onHover(id)
    this.dirty = true
  }

  // ── Frame loop ──────────────────────────────────────────────────────

  private animate = () => {
    if (this.disposed) return
    this.frame = requestAnimationFrame(this.animate)
    const dt = Math.min(this.clock.getDelta(), 0.05)
    const s = this.state
    if (!s) return

    if (this.lastApplied?.theme !== s.theme) this.applyTheme(s.theme)

    // Visibility.
    const visible = new Set(s.visible),
      selection = new Set(s.selected)
    const visibilityChanged = this.lastApplied?.visible !== s.visible || this.lastApplied?.selected !== s.selected || this.lastApplied?.isolate !== s.isolate
    if (visibilityChanged) {
      for (const p of this.parts) p.mesh.visible = s.isolate ? selection.has(p.id) : visible.has(p.system) || selection.has(p.id)
      this.ground.visible = this.padRing.visible = this.padRingInner.visible = !s.isolate
      const platform = this.scene.getObjectByName('platform')
      if (platform) platform.visible = !s.isolate
      this.dirty = true
    }

    // Camera: view change / reset / isolate.
    if (this.lastApplied?.resetTick !== s.resetTick || this.lastApplied?.view !== s.view) {
      if (!s.isolate) this.fit(s.view, this.lastApplied !== null)
      this.isolateKey = ''
    }
    const isolateKey = s.isolate ? `${s.selected.join(',')}:${s.inspectorOpen}:${s.view}:${s.resetTick}` : ''
    if (isolateKey !== this.isolateKey) {
      if (s.isolate) this.fitIsolated(s)
      else if (this.isolateKey) {
        this.camera.clearViewOffset()
        this.fit(s.view)
      }
      this.isolateKey = isolateKey
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
      const id = this.pick(this.pendingHover.x, this.pendingHover.y)
      this.setHovered(id)
      this.pendingHover = null
    }

    // Smooth highlight amounts.
    for (const p of this.parts) {
      const targetSel = selection.has(p.id) ? 1 : 0
      const targetHov = p.id === this.hoveredId ? 1 : 0
      if (Math.abs(p.selectedAmount - targetSel) > 0.002 || Math.abs(p.hoverAmount - targetHov) > 0.002) {
        p.selectedAmount = T.MathUtils.damp(p.selectedAmount, targetSel, 14, dt)
        p.hoverAmount = T.MathUtils.damp(p.hoverAmount, targetHov, 18, dt)
        tint(p.mesh.material, p.selectedAmount, p.hoverAmount)
        this.dirty = true
      }
    }

    this.controls.autoRotate = s.autoRotate && !s.isolate
    this.controls.autoRotateSpeed = 0.6
    this.controls.update()
    if (this.controls.autoRotate) this.dirty = true

    this.lastApplied = s
    if (this.dirty) {
      this.renderer.render(this.scene, this.camera)
      this.dirty = false
    }
  }
}

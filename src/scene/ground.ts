import * as T from 'three'

/**
 * Unlit ground disc that fades radially from the pad colour into the sky
 * colour, so the horizon never shows as a hard line.
 */
export function createGround(pad: string, sky: string, radius = 900) {
  const material = new T.ShaderMaterial({
    uniforms: {
      pad: { value: new T.Color(pad) },
      sky: { value: new T.Color(sky) },
      inner: { value: 30 },
      outer: { value: 320 },
    },
    vertexShader: `
      varying vec2 vPos;
      void main() {
        vPos = position.xy;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 pad; uniform vec3 sky; uniform float inner; uniform float outer;
      varying vec2 vPos;
      void main() {
        float d = length(vPos);
        float t = smoothstep(inner, outer, d);
        gl_FragColor = vec4(mix(pad, sky, t), 1.0);
        #include <colorspace_fragment>
      }
    `,
    depthWrite: true,
  })
  const mesh = new T.Mesh(new T.CircleGeometry(radius, 96), material)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = -0.55
  mesh.name = 'ground'
  return mesh
}


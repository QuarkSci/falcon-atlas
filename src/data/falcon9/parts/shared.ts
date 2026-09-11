import type { L10n, Part, Source, Spec } from '../../types'

export const SRC = {
  userGuide: { title: 'SpaceX Falcon User’s Guide (2021)', url: 'https://www.spacex.com/media/falcon-users-guide-2021-09.pdf' },
  spacexF9: { title: 'SpaceX — Falcon 9', url: 'https://www.spacex.com/vehicles/falcon-9/' },
  wikiF9: { title: 'Wikipedia — Falcon 9 Block 5', url: 'https://en.wikipedia.org/wiki/Falcon_9_Block_5' },
  wikiMerlin: { title: 'Wikipedia — SpaceX Merlin', url: 'https://en.wikipedia.org/wiki/SpaceX_Merlin' },
  wikiLanding: { title: 'Wikipedia — Falcon 9 first-stage landing tests', url: 'https://en.wikipedia.org/wiki/Falcon_9_first-stage_landing_tests' },
  wikiCopv: { title: 'Wikipedia — Composite overwrapped pressure vessel', url: 'https://en.wikipedia.org/wiki/Composite_overwrapped_pressure_vessel' },
  wikiGasGen: { title: 'Wikipedia — Gas-generator cycle', url: 'https://en.wikipedia.org/wiki/Gas-generator_cycle' },
  wikiPintle: { title: 'Wikipedia — Pintle injector', url: 'https://en.wikipedia.org/wiki/Pintle_injector' },
  wikiAmos6: { title: 'Wikipedia — AMOS-6 anomaly', url: 'https://en.wikipedia.org/wiki/Amos-6#Launch_failure' },
  wikiGridFin: { title: 'Wikipedia — Grid fin', url: 'https://en.wikipedia.org/wiki/Grid_fin' },
  nasaCrs: { title: 'NASA — Falcon 9 launch vehicle overview', url: 'https://www.nasa.gov/reference/spacex-falcon-9/' },
} satisfies Record<string, Source>

export const spec = (en: string, uz: string, value: string): Spec => ({ label: { en, uz }, value })

/** Build N numbered copies of a template part. */
export function repeat(n: number, template: Omit<Part, 'id' | 'name'> & { id: string; name: (i: number) => L10n }, parent?: (i: number) => string): Part[] {
  return Array.from({ length: n }, (_, k) => {
    const i = k + 1
    return { ...template, id: `${template.id}-${i}`, name: template.name(i), parent: parent ? parent(i) : template.parent }
  })
}

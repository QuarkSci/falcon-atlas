import type { L10n } from '../types'

/**
 * A stylised flight timeline: normalized time `t` (0..1) maps to the named
 * milestones below. The spacing is chosen for a legible animation, not
 * proportional to real elapsed seconds — the coast to landing takes far
 * longer in reality than the ascent, but would leave the scrubber mostly
 * empty if drawn to scale. `missionTime` gives an illustrative T+ for a
 * typical low-orbit mission; exact timing varies a lot by payload and orbit.
 */
export interface FlightMilestone {
  id: string
  t: number
  missionTime: string
  name: L10n
  caption: L10n
}

export const FLIGHT_MILESTONES: FlightMilestone[] = [
  {
    id: 'liftoff',
    t: 0,
    missionTime: 'T+00:00',
    name: { en: 'Liftoff', uz: 'Uchish' },
    caption: {
      en: 'All nine first-stage Merlins ignite and the vehicle clears the pad.',
      uz: "Birinchi bosqichning to'qqizta Merlin dvigateli yonadi va raketa maydondan ko'tariladi.",
    },
  },
  {
    id: 'meco',
    t: 0.15,
    missionTime: '~T+02:33',
    name: { en: 'Main engine cutoff (MECO)', uz: "Asosiy dvigatel o'chirilishi (MECO)" },
    caption: {
      en: 'The first stage has used most of its propellant and shuts down its engines.',
      uz: "Birinchi bosqich yoqilg'isining ko'p qismini sarflab, dvigatellarini o'chiradi.",
    },
  },
  {
    id: 'separation',
    t: 0.18,
    missionTime: '~T+02:35',
    name: { en: 'Stage separation', uz: 'Bosqichlar ajralishi' },
    caption: {
      en: 'Pneumatic pushers split the stages; seconds later the second-stage engine ignites.',
      uz: "Pnevmatik iturgichlar bosqichlarni ajratadi; bir necha soniyadan so'ng ikkinchi bosqich dvigateli yonadi.",
    },
  },
  {
    id: 'boostback',
    t: 0.28,
    missionTime: '~T+02:50',
    name: { en: 'Boostback burn', uz: 'Boostback yonishi' },
    caption: {
      en: 'The booster flips to point its engines the way it came and burns to reverse course, heading back toward the landing site.',
      uz: "Booster kelgan tomoniga dvigatellarini burish uchun aylanadi va orqaga, qo'nish joyi tomon yo'nalish o'zgartirish uchun yonadi.",
    },
  },
  {
    id: 'fairing',
    t: 0.38,
    missionTime: '~T+03:20',
    name: { en: 'Fairing separation', uz: 'Obtekatel ajralishi' },
    caption: {
      en: 'Above the sensible atmosphere, the two fairing halves release and fall away.',
      uz: "Sezilarli atmosferadan yuqorida obtekatelning ikkala yarmi bo'shatiladi va tushib ketadi.",
    },
  },
  {
    id: 'entry',
    t: 0.6,
    missionTime: '~T+06:30',
    name: { en: 'Entry burn', uz: 'Kirish yonishi' },
    caption: {
      en: 'Falling back through the thickening atmosphere, the centre engine relights briefly to slow the booster and protect it from re-entry heating.',
      uz: "Zichlashib borayotgan atmosfera orqali tushar ekan, markaziy dvigatel boosterni sekinlashtirish va kirish qizishidan himoya qilish uchun qisqa muddat qayta yoqiladi.",
    },
  },
  {
    id: 'landing',
    t: 0.78,
    missionTime: '~T+08:00',
    name: { en: 'Landing burn & touchdown', uz: "Qo'nish yonishi va qo'nish" },
    caption: {
      en: 'Grid fins steer the descent, legs deploy, and a final burn on the centre engine brings the booster to a gentle landing.',
      uz: "Panjarali qanotlar tushishni boshqaradi, oyoqlar ochiladi va markaziy dvigateldagi yakuniy yonish boosterni yumshoq qo'nishga olib keladi.",
    },
  },
  {
    id: 'payload',
    t: 1,
    missionTime: '~T+09:00+',
    name: { en: 'Payload deployed', uz: "Foydali yuk chiqarildi" },
    caption: {
      en: 'The second stage releases its payload into orbit — anywhere from minutes to over half an hour after liftoff, depending on the destination.',
      uz: "Ikkinchi bosqich foydali yukni orbitaga chiqaradi — manzilga qarab, uchishdan bir necha daqiqadan yarim soatdan ortiq vaqtgacha o'tishi mumkin.",
    },
  },
]

export const T = Object.fromEntries(FLIGHT_MILESTONES.map((m) => [m.id, m.t])) as Record<string, number>

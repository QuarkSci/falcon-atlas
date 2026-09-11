import type { Concept, L10n, Part, Source } from '../types'

const USER_GUIDE: Source = {
  title: 'SpaceX Falcon User’s Guide (2021)',
  url: 'https://www.spacex.com/media/falcon-users-guide-2021-09.pdf',
}
const SPACEX_F9: Source = { title: 'SpaceX — Falcon 9', url: 'https://www.spacex.com/vehicles/falcon-9/' }
const WIKI_F9: Source = { title: 'Wikipedia — Falcon 9 Block 5', url: 'https://en.wikipedia.org/wiki/Falcon_9_Block_5' }
const WIKI_MERLIN: Source = { title: 'Wikipedia — SpaceX Merlin', url: 'https://en.wikipedia.org/wiki/SpaceX_Merlin' }

const spec = (en: string, uz: string, value: string) => ({ label: { en, uz }, value })

/** Build N numbered copies of a template part. */
function repeat(
  n: number,
  template: Omit<Part, 'id' | 'name'> & { id: string; name: (i: number) => L10n },
): Part[] {
  return Array.from({ length: n }, (_, k) => {
    const i = k + 1
    return { ...template, id: `${template.id}-${i}`, name: template.name(i) }
  })
}

const merlinTemplate = {
  id: 'merlin',
  name: (i: number): L10n => ({ en: `Merlin 1D engine ${i}`, uz: `Merlin 1D dvigateli ${i}` }),
  system: 'propulsion' as const,
  stage: 'stage1' as const,
  parent: 'octaweb',
  concept: 'merlin-1d',
  description: {
    en: 'A gas-generator cycle rocket engine burning RP-1 kerosene and liquid oxygen. Nine are arranged in the octaweb: eight around the rim and one in the centre. Each produces about 845 kN of thrust at sea level and can throttle down to roughly 40%.',
    uz: "RP-1 kerosin va suyuq kislorodda ishlaydigan gaz-generator siklidagi raketa dvigateli. To'qqiztasi oktavebda joylashgan: sakkiztasi chetda, bittasi markazda. Har biri dengiz sathida taxminan 845 kN tortish kuchi beradi va 40% gacha pasaytirilishi mumkin.",
  },
  role: {
    en: 'Engines 1–8 gimbal for pitch, yaw and roll control. The centre engine (and two outer ones for the entry burn) relights for boostback, entry and landing burns.',
    uz: "1–8 dvigatellar tangaj, riskanie va krenni boshqarish uchun gimbal qiladi. Markaziy dvigatel (kirish yonishida yana ikkita chetdagisi) boostback, kirish va qo'nish yonishlari uchun qayta yoqiladi.",
  },
  specs: [
    spec('Thrust (sea level)', 'Tortish (dengiz sathi)', '845 kN'),
    spec('Thrust (vacuum)', 'Tortish (vakuum)', '981 kN'),
    spec('Specific impulse (SL)', 'Solishtirma impuls (DS)', '282 s'),
    spec('Chamber pressure', 'Kamera bosimi', '≈ 9.7 MPa'),
    spec('Expansion ratio', 'Kengayish nisbati', '16 : 1'),
    spec('Throttle range', 'Tortish diapazoni', '40 – 100 %'),
    spec('Dry mass', 'Quruq massa', '≈ 470 kg'),
  ],
  material: {
    en: 'Regeneratively cooled copper-alloy chamber, Inconel turbopump housing, niobium-free steel nozzle',
    uz: "Regenerativ sovutiladigan mis qotishmali kamera, Inconel turbonasos korpusi, po'lat soplo",
  },
  facts: [
    { en: 'Merlin has the highest thrust-to-weight ratio of any flown booster engine, around 180 : 1.', uz: "Merlin uchgan barcha booster dvigatellari ichida eng yuqori tortish/og'irlik nisbatiga ega — taxminan 180 : 1." },
    { en: 'Ignition uses TEA-TEB, a pyrophoric mixture that bursts into green flame on contact with oxygen.', uz: "Yoqish TEA-TEB — kislorod bilan tegishganda yashil alanga bilan yonadigan pirofor aralashma orqali amalga oshadi." },
  ],
  sources: [WIKI_MERLIN, USER_GUIDE],
}

export const PARTS: Part[] = [
  // ── Stage 1 · airframe ────────────────────────────────────────────────
  {
    id: 'octaweb',
    name: { en: 'Octaweb thrust structure', uz: 'Oktaveb tortish tuzilmasi' },
    system: 'airframe',
    stage: 'stage1',
    concept: 'octaweb',
    description: {
      en: 'A bolted aluminium structure at the base of the first stage that mounts the nine Merlin engines in an octagonal pattern and transfers their combined 7.6 MN of thrust into the tank walls.',
      uz: "Birinchi bosqich asosidagi bolt bilan yig'ilgan alyuminiy tuzilma; to'qqizta Merlin dvigatelini sakkizburchak shaklida o'rnatadi va ularning jami 7,6 MN tortishini bak devorlariga uzatadi.",
    },
    role: {
      en: 'Replaced the earlier 3×3 "tic-tac-toe" layout of Falcon 9 v1.0. The octagonal arrangement is lighter, easier to build and gives the vehicle its landing-burn engine-out tolerance.',
      uz: "Falcon 9 v1.0 dagi avvalgi 3×3 joylashuv o'rnini egalladi. Sakkizburchak joylashuv yengilroq, yasash osonroq va qo'nish yonishida dvigatel ishdan chiqishiga bardoshlilikni beradi.",
    },
    specs: [spec('Engines mounted', "O'rnatilgan dvigatellar", '9'), spec('Total thrust', 'Jami tortish', '7.6 MN')],
    material: { en: 'Aluminium alloy, machined and bolted; heat-shielded on the underside', uz: "Alyuminiy qotishmasi, frezalangan va bolt bilan yig'ilgan; pastki tomoni issiqlik qalqoni bilan" },
    sources: [WIKI_F9, SPACEX_F9],
  },
  {
    id: 's1-rp1-tank',
    name: { en: 'First-stage RP-1 tank', uz: 'Birinchi bosqich RP-1 baki' },
    system: 'tanks',
    stage: 'stage1',
    concept: 's1-rp1-tank',
    description: {
      en: 'The lower first-stage tank holds about 123 tonnes of RP-1, a highly refined kerosene. Fuel sits below the oxidiser so the heavier liquid oxygen keeps the centre of mass high for stability.',
      uz: "Birinchi bosqichning pastki baki taxminan 123 tonna RP-1 — yuqori darajada tozalangan kerosin saqlaydi. Yoqilg'i oksidlovchi ostida joylashgan, shunda og'irroq suyuq kislorod barqarorlik uchun massa markazini yuqorida tutadi.",
    },
    specs: [spec('Propellant', "Yoqilg'i", 'RP-1, ≈ 123 t'), spec('Diameter', 'Diametr', '3.66 m'), spec('Temperature', 'Harorat', 'chilled to ≈ –7 °C')],
    material: { en: 'Aluminium-lithium alloy 2195, friction-stir welded', uz: 'Alyuminiy-litiy qotishmasi 2195, ishqalanish bilan payvandlangan' },
    facts: [{ en: 'SpaceX chills the RP-1 below room temperature to increase its density and fit more fuel in the same tank.', uz: "SpaceX zichlikni oshirish va bir xil bakka ko'proq yoqilg'i sig'dirish uchun RP-1 ni xona haroratidan past sovutadi." }],
    sources: [USER_GUIDE, WIKI_F9],
  },
  {
    id: 's1-lox-tank',
    name: { en: 'First-stage LOX tank', uz: 'Birinchi bosqich LOX baki' },
    system: 'tanks',
    stage: 'stage1',
    concept: 's1-lox-tank',
    description: {
      en: 'The upper and larger first-stage tank holds roughly 287 tonnes of liquid oxygen, sub-cooled to about –207 °C — well below its boiling point — to pack in extra mass.',
      uz: "Birinchi bosqichning yuqori va kattaroq baki taxminan 287 tonna suyuq kislorod saqlaydi; qo'shimcha massa sig'dirish uchun u qaynash nuqtasidan ancha past — taxminan –207 °C gacha sovutiladi.",
    },
    specs: [spec('Propellant', "Yoqilg'i", 'LOX, ≈ 287 t'), spec('Diameter', 'Diametr', '3.66 m'), spec('Temperature', 'Harorat', '≈ –207 °C')],
    material: { en: 'Aluminium-lithium alloy 2195, friction-stir welded', uz: 'Alyuminiy-litiy qotishmasi 2195, ishqalanish bilan payvandlangan' },
    facts: [{ en: 'The frost seen on a Falcon 9 before launch is atmospheric moisture freezing on the LOX tank skin.', uz: "Uchishdan oldin Falcon 9 da ko'rinadigan qirov — LOX bak terisida muzlayotgan atmosfera namligi." }],
    sources: [USER_GUIDE, WIKI_F9],
  },
  {
    id: 'interstage',
    name: { en: 'Interstage', uz: 'Interstage (bosqichlararo)' },
    system: 'airframe',
    stage: 'interstage',
    concept: 'interstage',
    description: {
      en: 'A carbon-fibre composite cylinder that joins the first and second stages and shelters the second-stage MVac nozzle. It stays attached to the booster after separation, which is why recovered first stages have a black top.',
      uz: "Birinchi va ikkinchi bosqichlarni bog'lovchi hamda ikkinchi bosqich MVac soplosini yashiruvchi uglerod tolali kompozit silindr. Ajralishdan keyin u boosterda qoladi — shu sababli qaytarilgan birinchi bosqichlarning tepasi qora.",
    },
    specs: [spec('Length', 'Uzunlik', '≈ 6.7 m'), spec('Diameter', 'Diametr', '3.66 m')],
    material: { en: 'Carbon-fibre / aluminium-honeycomb sandwich', uz: 'Uglerod tola / alyuminiy asal uyasi sendvich' },
    facts: [{ en: 'The four grid fins are hinged to the top of the interstage.', uz: "To'rtta panjarali qanot interstage tepasiga sharnir bilan biriktirilgan." }],
    sources: [WIKI_F9],
  },
  // ── Stage 1 · propulsion ─────────────────────────────────────────────
  ...repeat(9, merlinTemplate),
  // ── Stage 1 · recovery ───────────────────────────────────────────────
  ...repeat(4, {
    id: 'grid-fin',
    name: (i) => ({ en: `Grid fin ${i}`, uz: `Panjarali qanot ${i}` }),
    system: 'recovery',
    stage: 'stage1',
    parent: 'interstage',
    concept: 'grid-fin',
    description: {
      en: 'A lattice of aerodynamic surfaces that folds flat against the interstage during ascent and deploys after separation. By rotating, the four fins steer the booster through hypersonic and supersonic descent toward the landing site.',
      uz: "Ko'tarilishda interstage'ga yopishib turadigan va ajralishdan keyin ochiladigan aerodinamik sirtlar panjarasi. Aylanish orqali to'rtta qanot boosterni gipertovush va supertovush tushishda qo'nish joyiga yo'naltiradi.",
    },
    specs: [spec('Material', 'Material', 'Cast and machined titanium'), spec('Size', "O'lcham", '≈ 1.5 × 1.2 m'), spec('Actuation', 'Boshqaruv', 'Hydraulic, open-loop')],
    material: { en: 'Single-piece cast titanium — survives re-entry heating without ablative coating', uz: 'Yaxlit quyma titan — kirish qizishiga ablyativ qoplamasiz bardosh beradi' },
    facts: [{ en: 'Earlier aluminium fins caught fire on re-entry; Block 5 switched to the largest titanium castings ever made.', uz: "Avvalgi alyuminiy qanotlar kirishda yonib ketgan; Block 5 shu paytgacha yasalgan eng katta titan quymalarga o'tdi." }],
    sources: [WIKI_F9],
  }),
  ...repeat(4, {
    id: 'landing-leg',
    name: (i) => ({ en: `Landing leg ${i}`, uz: `Qo'nish oyog'i ${i}` }),
    system: 'recovery',
    stage: 'stage1',
    parent: 'octaweb',
    concept: 'landing-leg',
    description: {
      en: 'One of four carbon-fibre legs stowed along the base of the first stage. Seconds before touchdown, high-pressure helium extends a telescoping strut and swings the leg outward to a span of about 18 metres.',
      uz: "Birinchi bosqich asosi bo'ylab yig'ilgan to'rtta uglerod tolali oyoqdan biri. Qo'nishdan bir necha soniya oldin yuqori bosimli geliy teleskopik tirgakni cho'zadi va oyoqni tashqariga — taxminan 18 metr kenglikka ochadi.",
    },
    specs: [spec('Deployed span', 'Ochilgan kenglik', '≈ 18 m'), spec('Mass (set of 4)', "Massa (4 tasi)", '≈ 2 100 kg'), spec('Deployment', 'Ochilish', 'Helium pneumatic')],
    material: { en: 'Carbon-fibre with aluminium honeycomb core', uz: 'Alyuminiy asal uyali o‘zakli uglerod tola' },
    facts: [{ en: 'A crushable aluminium honeycomb core in each strut absorbs the landing impact and is replaced between flights.', uz: "Har bir tirgakdagi eziluvchi alyuminiy asal uyasi qo'nish zarbasini yutadi va parvozlar orasida almashtiriladi." }],
    sources: [WIKI_F9],
  }),
  // ── Stage 2 ───────────────────────────────────────────────────────────
  {
    id: 'mvac',
    name: { en: 'Merlin Vacuum (MVac) engine', uz: 'Merlin Vacuum (MVac) dvigateli' },
    system: 'propulsion',
    stage: 'stage2',
    parent: 's2-thrust-structure',
    concept: 'mvac',
    description: {
      en: 'A single Merlin 1D adapted for space, with a much larger nozzle extension made of niobium alloy that is cooled purely by radiating heat. The larger expansion ratio raises efficiency in vacuum to 348 seconds of specific impulse.',
      uz: "Kosmos uchun moslashtirilgan yagona Merlin 1D; faqat issiqlik nurlanishi bilan sovutiladigan niobiy qotishmali ancha katta soplo kengaytmasiga ega. Kattaroq kengayish nisbati vakuumdagi samaradorlikni 348 soniya solishtirma impulsgacha oshiradi.",
    },
    specs: [spec('Thrust (vacuum)', 'Tortish (vakuum)', '981 kN'), spec('Specific impulse', 'Solishtirma impuls', '348 s'), spec('Expansion ratio', 'Kengayish nisbati', '165 : 1'), spec('Restarts', 'Qayta yoqish', 'Multiple')],
    material: { en: 'Niobium-alloy radiatively cooled nozzle extension', uz: "Nurlanish bilan sovutiladigan niobiy qotishmali soplo kengaytmasi" },
    facts: [{ en: 'The nozzle extension glows red-hot in flight because it has no cooling channels — it simply radiates heat into space.', uz: "Soplo kengaytmasi parvozda qizil cho'g' bo'lib yonadi, chunki unda sovutish kanallari yo'q — u issiqlikni shunchaki kosmosga nurlantiradi." }],
    sources: [WIKI_MERLIN, USER_GUIDE],
  },
  {
    id: 's2-thrust-structure',
    name: { en: 'Second-stage thrust structure', uz: 'Ikkinchi bosqich tortish tuzilmasi' },
    system: 'airframe',
    stage: 'stage2',
    concept: 's2-thrust-structure',
    description: {
      en: 'The conical structure at the base of the second stage that carries the MVac engine, its gimbal actuators, and the pneumatic separation pushers.',
      uz: "Ikkinchi bosqich asosidagi konussimon tuzilma; MVac dvigatelini, uning gimbal aktuatorlarini va pnevmatik ajratish iturgichlarini ko'taradi.",
    },
    material: { en: 'Aluminium alloy', uz: 'Alyuminiy qotishmasi' },
    sources: [WIKI_F9],
  },
  {
    id: 's2-rp1-tank',
    name: { en: 'Second-stage RP-1 tank', uz: 'Ikkinchi bosqich RP-1 baki' },
    system: 'tanks',
    stage: 'stage2',
    concept: 's2-rp1-tank',
    description: {
      en: 'The second stage is a shorter version of the first, built with the same tooling and diameter. Its lower tank carries about 32 tonnes of RP-1.',
      uz: "Ikkinchi bosqich — birinchisining qisqaroq nusxasi, xuddi shu asbob-uskuna va diametrda yasalgan. Uning pastki baki taxminan 32 tonna RP-1 tashiydi.",
    },
    specs: [spec('Propellant', "Yoqilg'i", 'RP-1, ≈ 32 t'), spec('Diameter', 'Diametr', '3.66 m')],
    material: { en: 'Aluminium-lithium alloy 2195', uz: 'Alyuminiy-litiy qotishmasi 2195' },
    sources: [USER_GUIDE, WIKI_F9],
  },
  {
    id: 's2-lox-tank',
    name: { en: 'Second-stage LOX tank', uz: 'Ikkinchi bosqich LOX baki' },
    system: 'tanks',
    stage: 'stage2',
    concept: 's2-lox-tank',
    description: {
      en: 'Holds roughly 75 tonnes of sub-cooled liquid oxygen. Because the second stage may coast for hours before a relight, the tank is painted grey on long missions to absorb sunlight and keep the kerosene from freezing.',
      uz: "Taxminan 75 tonna o'ta sovutilgan suyuq kislorod saqlaydi. Ikkinchi bosqich qayta yoqishdan oldin soatlab inertsiya bilan uchishi mumkinligi sababli, uzoq missiyalarda bak quyosh nurini yutish va kerosinni muzlatmaslik uchun kulrang bo'yaladi.",
    },
    specs: [spec('Propellant', "Yoqilg'i", 'LOX, ≈ 75 t'), spec('Diameter', 'Diametr', '3.66 m')],
    material: { en: 'Aluminium-lithium alloy 2195', uz: 'Alyuminiy-litiy qotishmasi 2195' },
    sources: [USER_GUIDE, WIKI_F9],
  },
  // ── Payload ───────────────────────────────────────────────────────────
  {
    id: 'payload-adapter',
    name: { en: 'Payload attach fitting', uz: "Foydali yuk biriktirgichi" },
    system: 'payload',
    stage: 'stage2',
    concept: 'payload-adapter',
    description: {
      en: 'A conical adapter on top of the second stage that carries the satellite on a standard clamp-band interface and releases it in orbit.',
      uz: "Ikkinchi bosqich tepasidagi konussimon adapter; sun'iy yo'ldoshni standart qisqich-tasma interfeysida ko'taradi va orbitada bo'shatadi.",
    },
    specs: [spec('Interface', 'Interfeys', '1 575 mm / 2 624 mm clamp band')],
    sources: [USER_GUIDE],
  },
  ...repeat(2, {
    id: 'fairing-half',
    name: (i) => ({ en: `Payload fairing half ${i}`, uz: `Obtekatel yarmi ${i}` }),
    system: 'payload',
    stage: 'fairing',
    concept: 'fairing',
    description: {
      en: 'One of two clamshell halves that shield the payload from aerodynamic heating and acoustic loads. About three minutes into flight, once above the sensible atmosphere, pneumatic pushers separate the halves.',
      uz: "Foydali yukni aerodinamik qizish va akustik yuklardan himoya qiluvchi ikkita yarim qobiqdan biri. Parvozning taxminan uchinchi daqiqasida, sezilarli atmosferadan yuqoriga chiqqach, pnevmatik iturgichlar yarmlarni ajratadi.",
    },
    specs: [spec('Diameter', 'Diametr', '5.2 m'), spec('Length', 'Uzunlik', '13.1 m'), spec('Mass (both halves)', 'Massa (ikkalasi)', '≈ 1 900 kg')],
    material: { en: 'Carbon-fibre skin over aluminium honeycomb', uz: 'Alyuminiy asal uyasi ustidagi uglerod tolali teri' },
    facts: [{ en: 'Each half steers itself with cold-gas thrusters and a parafoil, then is fished out of the ocean and reflown.', uz: "Har bir yarim o'zini sovuq gazli dvigatelchalar va parafoil bilan boshqaradi, so'ng okeandan olinib qayta uchiriladi." }],
    sources: [USER_GUIDE, WIKI_F9],
  }),
]

export const PART_BY_ID = new Map(PARTS.map((p) => [p.id, p]))

/** Named concepts group same-kind parts for search and selection. */
export const CONCEPTS: Concept[] = [
  { id: 'merlin-1d', name: { en: 'Merlin 1D engines', uz: 'Merlin 1D dvigatellari' }, aliases: ['engine', 'dvigatel', 'motor'] },
  { id: 'octaweb', name: { en: 'Octaweb', uz: 'Oktaveb' }, aliases: ['thrust structure'] },
  { id: 's1-rp1-tank', name: { en: 'First-stage RP-1 tank', uz: 'Birinchi bosqich RP-1 baki' }, aliases: ['kerosene', 'fuel', 'kerosin', 'yoqilgi'] },
  { id: 's1-lox-tank', name: { en: 'First-stage LOX tank', uz: 'Birinchi bosqich LOX baki' }, aliases: ['oxygen', 'oxidizer', 'kislorod'] },
  { id: 'interstage', name: { en: 'Interstage', uz: 'Interstage' } },
  { id: 'grid-fin', name: { en: 'Grid fins', uz: 'Panjarali qanotlar' }, aliases: ['fins', 'qanot'] },
  { id: 'landing-leg', name: { en: 'Landing legs', uz: "Qo'nish oyoqlari" }, aliases: ['legs', 'oyoq'] },
  { id: 'mvac', name: { en: 'Merlin Vacuum', uz: 'Merlin Vacuum' }, aliases: ['mvac', 'vacuum engine'] },
  { id: 's2-thrust-structure', name: { en: 'Second-stage thrust structure', uz: 'Ikkinchi bosqich tortish tuzilmasi' } },
  { id: 's2-rp1-tank', name: { en: 'Second-stage RP-1 tank', uz: 'Ikkinchi bosqich RP-1 baki' } },
  { id: 's2-lox-tank', name: { en: 'Second-stage LOX tank', uz: 'Ikkinchi bosqich LOX baki' } },
  { id: 'payload-adapter', name: { en: 'Payload attach fitting', uz: 'Foydali yuk biriktirgichi' }, aliases: ['adapter', 'paf'] },
  { id: 'fairing', name: { en: 'Payload fairing', uz: 'Obtekatel' }, aliases: ['nose cone', 'shroud'] },
].map((c) => ({ ...c, parts: PARTS.filter((p) => p.concept === c.id).map((p) => p.id) }))

export const CONCEPT_BY_ID = new Map(CONCEPTS.map((c) => [c.id, c]))

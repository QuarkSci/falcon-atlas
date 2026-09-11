import type { L10n, Part, StageId } from '../../types'
import { SRC, spec } from './shared'

interface SubSpec {
  key: string
  system: Part['system']
  concept: string
  name: L10n
  description: L10n
  role?: L10n
  specs?: Part['specs']
  material?: L10n
  facts?: L10n[]
  sources?: Part['sources']
}

/** Sub-assemblies shared by every Merlin 1D power head (sea level and vacuum). */
const POWER_HEAD: SubSpec[] = [
  {
    key: 'chamber',
    system: 'propulsion',
    concept: 'combustion-chamber',
    name: { en: 'Combustion chamber & throat', uz: "Yonish kamerasi va bo'g'iz" },
    description: {
      en: 'Where kerosene and oxygen burn at about 3 300 °C and 9.7 MPa. The chamber narrows to the throat, the smallest cross-section, where the exhaust reaches the speed of sound before expanding through the nozzle.',
      uz: "Kerosin va kislorod taxminan 3 300 °C va 9,7 MPa da yonadigan joy. Kamera bo'g'iz — eng tor kesimga torayadi; u yerda gaz soplo orqali kengayishdan oldin tovush tezligiga yetadi.",
    },
    role: {
      en: 'Converts chemical energy into hot, high-pressure gas. The throat fixes the mass flow for a given chamber pressure, so throttling the engine means changing chamber pressure.',
      uz: "Kimyoviy energiyani issiq, yuqori bosimli gazga aylantiradi. Bo'g'iz berilgan kamera bosimida massa sarfini belgilaydi, shuning uchun dvigatelni tormozlash — kamera bosimini o'zgartirish demakdir.",
    },
    specs: [spec('Chamber pressure', 'Kamera bosimi', '≈ 9.7 MPa (97 bar)'), spec('Combustion temperature', 'Yonish harorati', '≈ 3 300 °C'), spec('Mixture ratio (O/F)', 'Aralashma nisbati (O/F)', '≈ 2.36')],
    material: { en: 'Copper-alloy liner with milled cooling channels, electroformed nickel jacket', uz: "Frezalangan sovutish kanallari bo'lgan mis qotishmali qatlam, elektroformalangan nikel qobiq" },
    facts: [{ en: 'Fuel flows through channels in the chamber wall before it is burned — the wall would melt in seconds otherwise.', uz: "Yoqilg'i yonishdan oldin kamera devoridagi kanallardan oqib o'tadi — aks holda devor soniyalarda erib ketardi." }],
    sources: [SRC.wikiMerlin],
  },
  {
    key: 'injector',
    system: 'propulsion',
    concept: 'injector',
    name: { en: 'Pintle injector dome', uz: 'Pintl injektor gumbazi' },
    description: {
      en: 'The dome on top of the chamber that sprays propellant. Merlin uses a single central pintle injector: oxygen flows through the middle and kerosene through a ring around it, colliding into a fine mixing sheet.',
      uz: "Kamera tepasidagi yoqilg'ini purkovchi gumbaz. Merlin bitta markaziy pintl injektor ishlatadi: kislorod o'rtadan, kerosin uning atrofidagi halqadan oqib, mayda aralashuvchi pardaga to'qnashadi.",
    },
    role: {
      en: 'Atomises and mixes the propellants evenly so combustion is stable. The pintle design, inherited from the Apollo Lunar Module engine, throttles deeply without combustion instability.',
      uz: "Yonish barqaror bo'lishi uchun yoqilg'ilarni bir tekis purkab aralashtiradi. Apollo Oy moduli dvigatelidan meros qolgan pintl dizayni yonish beqarorligisiz chuqur tormozlanadi.",
    },
    facts: [{ en: 'Merlin is the only orbital-class booster engine flying with a pintle injector; most engines use hundreds of small injector elements.', uz: "Merlin — pintl injektor bilan uchadigan yagona orbital sinf booster dvigateli; aksariyat dvigatellar yuzlab kichik injektor elementlaridan foydalanadi." }],
    sources: [SRC.wikiPintle, SRC.wikiMerlin],
  },
  {
    key: 'turbopump',
    system: 'propulsion',
    concept: 'turbopump',
    name: { en: 'Turbopump', uz: 'Turbonasos' },
    description: {
      en: 'A single shaft carrying a turbine and two pumps. Hot gas from the gas generator spins the turbine at around 36 000 rpm; the LOX pump and the RP-1 pump on the same shaft raise the propellants to chamber pressure.',
      uz: "Bitta o'qda turbina va ikkita nasos. Gaz generatoridan kelgan issiq gaz turbinani taxminan 36 000 ayl/daq tezlikda aylantiradi; o'sha o'qdagi LOX nasosi va RP-1 nasosi yoqilg'ilarni kamera bosimigacha ko'taradi.",
    },
    role: {
      en: 'Delivers roughly 300 kg of propellant per second. The pump also supplies high-pressure kerosene that acts as hydraulic fluid for the gimbal actuators.',
      uz: "Soniyasiga taxminan 300 kg yoqilg'i yetkazadi. Nasos shuningdek gimbal aktuatorlari uchun gidravlik suyuqlik vazifasini bajaruvchi yuqori bosimli kerosin ham beradi.",
    },
    specs: [spec('Shaft power', "O'q quvvati", '≈ 7.5 MW'), spec('Turbine speed', 'Turbina tezligi', '≈ 36 000 rpm'), spec('Propellant flow', "Yoqilg'i sarfi", '≈ 300 kg/s')],
    material: { en: 'Inconel turbine, aluminium and steel pump housings', uz: "Inconel turbina, alyuminiy va po'lat nasos korpuslari" },
    facts: [{ en: 'Turbine wheel cracks in early Merlin 1D pumps were flagged by NASA; the redesigned wheel flew from Block 5 onward.', uz: "Dastlabki Merlin 1D nasoslaridagi turbina g'ildiragi yoriqlarini NASA ko'rsatib o'tgan; qayta loyihalangan g'ildirak Block 5 dan boshlab uchdi." }],
    sources: [SRC.wikiMerlin, SRC.wikiGasGen],
  },
  {
    key: 'gas-generator',
    system: 'propulsion',
    concept: 'gas-generator',
    name: { en: 'Gas generator', uz: 'Gaz generatori' },
    description: {
      en: 'A small combustion chamber that burns a fuel-rich mixture of the same propellants to produce cooler gas (≈ 700 °C) for the turbine. Fuel-rich combustion keeps the turbine blades from melting.',
      uz: "O'sha yoqilg'ilarning yoqilg'iga boy aralashmasini yoqib, turbina uchun salqinroq (≈ 700 °C) gaz hosil qiluvchi kichik yonish kamerasi. Yoqilg'iga boy yonish turbina parraklarini erishdan saqlaydi.",
    },
    role: {
      en: 'Defines the "gas-generator cycle": a few percent of the propellant is spent driving the pump and is then dumped overboard, which is simpler but slightly less efficient than a staged-combustion engine.',
      uz: "\"Gaz-generator sikli\"ni belgilaydi: yoqilg'ining bir necha foizi nasosni aylantirishga sarflanib, so'ng tashqariga chiqariladi — bu bosqichli yonish dvigateliga qaraganda soddaroq, lekin biroz kam samarali.",
    },
    sources: [SRC.wikiGasGen, SRC.wikiMerlin],
  },
  {
    key: 'exhaust-duct',
    system: 'propulsion',
    concept: 'exhaust-duct',
    name: { en: 'Turbine exhaust duct', uz: 'Turbina chiqindi quvuri' },
    description: {
      en: 'The pipe that carries spent turbine gas away from the turbopump and dumps it into the side of the nozzle. On the sea-level Merlin it is the dark tube hugging the bell; the sooty gas is what makes Falcon 9 exhaust look smoky at the base.',
      uz: "Sarflangan turbina gazini turbonasosdan olib chiqib, soplo yon tomoniga tashlovchi quvur. Dengiz sathi Merlinida bu — qo'ng'iroqqa yopishib turgan qora naycha; qurumli gaz Falcon 9 chiqindisini asosda tutunli ko'rsatadi.",
    },
    role: {
      en: 'Dumping the exhaust into the nozzle adds a little thrust and forms a cool film that protects the lower nozzle wall.',
      uz: "Chiqindini sopoga tashlash ozgina tortish qo'shadi va soplo pastki devorini himoya qiluvchi salqin parda hosil qiladi.",
    },
    sources: [SRC.wikiMerlin],
  },
  {
    key: 'gimbal',
    system: 'propulsion',
    concept: 'gimbal',
    name: { en: 'Gimbal & hydraulic actuators', uz: 'Gimbal va gidravlik aktuatorlar' },
    description: {
      en: 'A universal joint at the top of the engine, mounted to the thrust structure, and two hydraulic actuators that tilt the whole engine a few degrees in any direction to steer the rocket.',
      uz: "Dvigatel tepasidagi, tortish tuzilmasiga o'rnatilgan universal sharnir va butun dvigatelni raketani boshqarish uchun istalgan yo'nalishda bir necha gradusga og'diruvchi ikkita gidravlik aktuator.",
    },
    role: {
      en: 'Thrust vector control. The actuators use high-pressure RP-1 from the turbopump as hydraulic fluid instead of a separate hydraulic system.',
      uz: "Tortish vektorini boshqarish. Aktuatorlar alohida gidravlik tizim o'rniga turbonasosdan kelgan yuqori bosimli RP-1 ni gidravlik suyuqlik sifatida ishlatadi.",
    },
    specs: [spec('Gimbal range', 'Gimbal diapazoni', '≈ ± 5°')],
    sources: [SRC.wikiMerlin],
  },
  {
    key: 'valves',
    system: 'plumbing',
    concept: 'engine-valves',
    name: { en: 'Main propellant valves & inlet lines', uz: "Asosiy yoqilg'i klapanlari va kirish quvurlari" },
    description: {
      en: 'Flexible inlet ducts bring LOX and RP-1 from the stage manifolds into the pumps, and the main valves open in a precise sequence to start the engine and slam shut to stop it.',
      uz: "Egiluvchan kirish quvurlari LOX va RP-1 ni bosqich kollektorlaridan nasoslarga olib keladi; asosiy klapanlar dvigatelni ishga tushirish uchun aniq ketma-ketlikda ochiladi va to'xtatish uchun keskin yopiladi.",
    },
    role: {
      en: 'Start-up: TEA-TEB igniter fluid enters, the fuel valve opens, then the oxidiser valve — the order matters to avoid a hard start.',
      uz: "Ishga tushirish: TEA-TEB yoqish suyuqligi kiradi, yoqilg'i klapani ochiladi, so'ng oksidlovchi klapani — qattiq startdan qochish uchun tartib muhim.",
    },
    sources: [SRC.wikiMerlin],
  },
]

const SEA_LEVEL_NOZZLE: SubSpec = {
  key: 'nozzle',
  system: 'propulsion',
  concept: 'nozzle',
  name: { en: 'Nozzle (regeneratively cooled bell)', uz: 'Soplo (regenerativ sovutiladigan qo‘ng‘iroq)' },
  description: {
    en: 'The bell that expands the exhaust from the throat to an exit 0.92 m across, accelerating it to about 2.8 km/s. The wall is a copper-alloy shell with milled channels through which cold kerosene flows before entering the chamber.',
    uz: "Chiqindi gazni bo'g'izdan 0,92 m kenglikdagi chiqishgacha kengaytirib, taxminan 2,8 km/s gacha tezlashtiruvchi qo'ng'iroq. Devor — kameraga kirishdan oldin sovuq kerosin oqib o'tadigan frezalangan kanalli mis qotishmali qobiq.",
  },
  role: {
    en: 'Its 16 : 1 expansion ratio is a compromise: efficient near sea level, where a larger bell would flow-separate, yet still workable at altitude and during landing burns.',
    uz: "16 : 1 kengayish nisbati — murosa: dengiz sathi yaqinida samarali (kattaroq qo'ng'iroqda oqim ajralib ketardi), shu bilan birga balandlikda va qo'nish yonishlarida ham ishlaydi.",
  },
  specs: [spec('Exit diameter', 'Chiqish diametri', '≈ 0.92 m'), spec('Expansion ratio', 'Kengayish nisbati', '16 : 1'), spec('Exhaust velocity', 'Chiqish tezligi', '≈ 2.8 km/s')],
  material: { en: 'Copper-alloy liner, nickel outer jacket', uz: 'Mis qotishmali qatlam, nikel tashqi qobiq' },
  sources: [SRC.wikiMerlin],
}

const VAC_NOZZLE: SubSpec = {
  ...SEA_LEVEL_NOZZLE,
  name: { en: 'Nozzle (cooled section)', uz: 'Soplo (sovutiladigan qism)' },
  description: {
    en: 'The regeneratively cooled upper part of the MVac bell, identical in principle to the sea-level nozzle. Below it bolts the much larger radiatively cooled extension.',
    uz: "MVac qo'ng'irog'ining regenerativ sovutiladigan yuqori qismi; dengiz sathi soplosi bilan bir xil printsipda. Uning ostiga ancha katta nurlanish bilan sovutiladigan kengaytma boltlanadi.",
  },
  specs: undefined,
}

const VAC_EXTENSION: SubSpec = {
  key: 'nozzle-extension',
  system: 'propulsion',
  concept: 'nozzle-extension',
  name: { en: 'Nozzle extension (niobium)', uz: 'Soplo kengaytmasi (niobiy)' },
  description: {
    en: 'A thin niobium-alloy skirt that takes the expansion ratio from 16 : 1 to 165 : 1. It has no cooling channels: it simply glows red-hot and radiates heat into space, which is why it can only be used in vacuum.',
    uz: "Kengayish nisbatini 16 : 1 dan 165 : 1 ga olib chiquvchi yupqa niobiy qotishmali etak. Unda sovutish kanallari yo'q: u shunchaki qizil cho'g' bo'lib qizib, issiqlikni kosmosga nurlantiradi — shuning uchun faqat vakuumda ishlatilishi mumkin.",
  },
  role: {
    en: 'Raises MVac specific impulse to 348 s, about 12% better than the sea-level engine — a big gain for a stage that must reach orbital velocity.',
    uz: "MVac solishtirma impulsini 348 s ga oshiradi — dengiz sathi dvigatelidan taxminan 12% yaxshi; orbital tezlikka chiqishi kerak bo'lgan bosqich uchun katta yutuq.",
  },
  specs: [spec('Exit diameter', 'Chiqish diametri', '≈ 3.0 m'), spec('Expansion ratio', 'Kengayish nisbati', '165 : 1'), spec('Operating temperature', 'Ish harorati', '> 1 000 °C')],
  material: { en: 'Niobium alloy (C-103), radiatively cooled', uz: 'Niobiy qotishmasi (C-103), nurlanish bilan sovutiladi' },
  facts: [{ en: 'The extension is so thin and light that it is shipped protected and installed only after the stage is otherwise complete.', uz: "Kengaytma shunchalik yupqa va yengilki, himoyalangan holda yetkaziladi va faqat bosqich to'liq tayyor bo'lgach o'rnatiladi." }],
  sources: [SRC.wikiMerlin],
}

function sub(prefix: string, engineName: L10n, stage: StageId, s: SubSpec, schematic = true): Part {
  return {
    id: `${prefix}-${s.key}`,
    name: { en: `${s.name.en} · ${engineName.en}`, uz: `${s.name.uz} · ${engineName.uz}` },
    system: s.system,
    stage,
    parent: prefix,
    concept: s.concept,
    description: s.description,
    role: s.role,
    specs: s.specs,
    material: s.material,
    facts: s.facts,
    sources: s.sources,
    schematic,
  }
}

const MERLIN_GROUP = (i: number): Part => ({
  id: `merlin-${i}`,
  name: { en: `Merlin 1D engine ${i}`, uz: `Merlin 1D dvigateli ${i}` },
  system: 'propulsion',
  stage: 'stage1',
  parent: 'octaweb',
  concept: 'merlin-1d',
  group: true,
  description: {
    en: 'A gas-generator cycle rocket engine burning RP-1 kerosene and liquid oxygen. Nine are arranged in the octaweb: eight around the rim and one in the centre. Each produces about 845 kN of thrust at sea level and can throttle down to roughly 40%.',
    uz: "RP-1 kerosin va suyuq kislorodda ishlaydigan gaz-generator siklidagi raketa dvigateli. To'qqiztasi oktavebda joylashgan: sakkiztasi chetda, bittasi markazda. Har biri dengiz sathida taxminan 845 kN tortish kuchi beradi va 40% gacha pasaytirilishi mumkin.",
  },
  role: {
    en: i === 9 ? 'The centre engine. It alone performs the final landing burn, and joins two outer engines for the boostback and entry burns.' : 'One of the eight outer engines. Together they gimbal for pitch, yaw and roll during ascent; two of them relight with the centre engine for the boostback and entry burns.',
    uz: i === 9 ? "Markaziy dvigatel. Yakuniy qo'nish yonishini u yolg'iz bajaradi, boostback va kirish yonishlarida esa ikkita chetki dvigatelga qo'shiladi." : "Sakkizta chetki dvigateldan biri. Ular birgalikda ko'tarilishda tangaj, riskanie va kren uchun gimbal qiladi; ulardan ikkitasi boostback va kirish yonishlari uchun markaziy dvigatel bilan qayta yoqiladi.",
  },
  specs: [
    spec('Thrust (sea level)', 'Tortish (dengiz sathi)', '845 kN'),
    spec('Thrust (vacuum)', 'Tortish (vakuum)', '981 kN'),
    spec('Specific impulse (SL / vac)', 'Solishtirma impuls (DS / vak)', '282 s / 311 s'),
    spec('Chamber pressure', 'Kamera bosimi', '≈ 9.7 MPa'),
    spec('Expansion ratio', 'Kengayish nisbati', '16 : 1'),
    spec('Throttle range', 'Tortish diapazoni', '40 – 100 %'),
    spec('Dry mass', 'Quruq massa', '≈ 470 kg'),
    spec('Height', 'Balandlik', '≈ 2.9 m'),
  ],
  material: { en: 'Copper-alloy chamber and nozzle, Inconel turbine, aluminium pump housings', uz: 'Mis qotishmali kamera va soplo, Inconel turbina, alyuminiy nasos korpuslari' },
  facts: [
    { en: 'Merlin has the highest thrust-to-weight ratio of any flown booster engine, around 180 : 1.', uz: "Merlin uchgan barcha booster dvigatellari ichida eng yuqori tortish/og'irlik nisbatiga ega — taxminan 180 : 1." },
    { en: 'Ignition uses TEA-TEB, a pyrophoric mixture that bursts into green flame on contact with oxygen.', uz: "Yoqish TEA-TEB — kislorod bilan tegishganda yashil alanga bilan yonadigan pirofor aralashma orqali amalga oshadi." },
  ],
  sources: [SRC.wikiMerlin, SRC.userGuide],
})

const MVAC_GROUP: Part = {
  id: 'mvac',
  name: { en: 'Merlin Vacuum (MVac) engine', uz: 'Merlin Vacuum (MVac) dvigateli' },
  system: 'propulsion',
  stage: 'stage2',
  parent: 's2-thrust-structure',
  concept: 'mvac',
  group: true,
  description: {
    en: 'A single Merlin 1D adapted for space, with a much larger nozzle extension made of niobium alloy that is cooled purely by radiating heat. The larger expansion ratio raises efficiency in vacuum to 348 seconds of specific impulse.',
    uz: "Kosmos uchun moslashtirilgan yagona Merlin 1D; faqat issiqlik nurlanishi bilan sovutiladigan niobiy qotishmali ancha katta soplo kengaytmasiga ega. Kattaroq kengayish nisbati vakuumdagi samaradorlikni 348 soniya solishtirma impulsgacha oshiradi.",
  },
  role: {
    en: 'Burns for about six minutes to reach orbit, then can restart several times to raise or circularise the orbit before releasing the payload.',
    uz: "Orbitaga chiqish uchun taxminan olti daqiqa yonadi, so'ng foydali yukni bo'shatishdan oldin orbitani ko'tarish yoki aylanaga keltirish uchun bir necha marta qayta yoqilishi mumkin.",
  },
  specs: [spec('Thrust (vacuum)', 'Tortish (vakuum)', '981 kN'), spec('Specific impulse', 'Solishtirma impuls', '348 s'), spec('Expansion ratio', 'Kengayish nisbati', '165 : 1'), spec('Burn time', 'Yonish vaqti', '≈ 397 s'), spec('Restarts', 'Qayta yoqish', 'Multiple')],
  material: { en: 'Niobium-alloy radiatively cooled nozzle extension', uz: 'Nurlanish bilan sovutiladigan niobiy qotishmali soplo kengaytmasi' },
  facts: [{ en: 'The nozzle extension glows red-hot in flight because it has no cooling channels — it simply radiates heat into space.', uz: "Soplo kengaytmasi parvozda qizil cho'g' bo'lib yonadi, chunki unda sovutish kanallari yo'q — u issiqlikni shunchaki kosmosga nurlantiradi." }],
  sources: [SRC.wikiMerlin, SRC.userGuide],
}

export const ENGINE_PARTS: Part[] = [
  ...Array.from({ length: 9 }, (_, k) => {
    const i = k + 1
    const g = MERLIN_GROUP(i)
    return [g, sub(g.id, g.name, 'stage1', SEA_LEVEL_NOZZLE), ...POWER_HEAD.map((s) => sub(g.id, g.name, 'stage1', s))]
  }).flat(),
  MVAC_GROUP,
  sub('mvac', MVAC_GROUP.name, 'stage2', VAC_EXTENSION),
  sub('mvac', MVAC_GROUP.name, 'stage2', VAC_NOZZLE),
  ...POWER_HEAD.map((s) => sub('mvac', MVAC_GROUP.name, 'stage2', s)),
]

export const ENGINE_CONCEPTS = [
  { id: 'merlin-1d', name: { en: 'Merlin 1D engines', uz: 'Merlin 1D dvigatellari' }, aliases: ['engine', 'dvigatel', 'motor', 'merlin'] },
  { id: 'mvac', name: { en: 'Merlin Vacuum', uz: 'Merlin Vacuum' }, aliases: ['mvac', 'vacuum engine', 'vakuum'] },
  { id: 'nozzle', name: { en: 'Engine nozzles', uz: 'Dvigatel soplolari' }, aliases: ['bell', 'soplo', 'qongiroq'] },
  { id: 'nozzle-extension', name: { en: 'MVac nozzle extension', uz: 'MVac soplo kengaytmasi' }, aliases: ['niobium', 'niobiy', 'skirt'] },
  { id: 'combustion-chamber', name: { en: 'Combustion chambers', uz: 'Yonish kameralari' }, aliases: ['throat', 'bogiz', 'kamera'] },
  { id: 'injector', name: { en: 'Pintle injectors', uz: 'Pintl injektorlar' }, aliases: ['pintle', 'injector'] },
  { id: 'turbopump', name: { en: 'Turbopumps', uz: 'Turbonasoslar' }, aliases: ['pump', 'nasos', 'turbine', 'turbina'] },
  { id: 'gas-generator', name: { en: 'Gas generators', uz: 'Gaz generatorlari' }, aliases: ['preburner'] },
  { id: 'exhaust-duct', name: { en: 'Turbine exhaust ducts', uz: 'Turbina chiqindi quvurlari' }, aliases: ['exhaust'] },
  { id: 'gimbal', name: { en: 'Gimbals & actuators', uz: 'Gimbal va aktuatorlar' }, aliases: ['tvc', 'thrust vector', 'actuator'] },
  { id: 'engine-valves', name: { en: 'Engine valves & inlet lines', uz: 'Dvigatel klapanlari va kirish quvurlari' }, aliases: ['valve', 'klapan'] },
]

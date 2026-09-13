# Falcon Atlas — loyiha holati (Claude uchun qo'llanma)

> Bu fayl **oldingi sessiyalarning to'liq konteksti** — yangi chatda ishni davom
> ettirish uchun shu faylni o'qib, quyida yozilganlarga tayangan holda davom
> etish kerak. Foydalanuvchi (MuhammadYusuf) o'zbek tilida yozadi, javoblar ham
> o'zbek tilida bo'lishi kutiladi. Kodga oid izohlar ingliz tilida (mavjud kod
> uslubiga mos).

## 1. Loyiha nima

**Falcon Atlas** — SpaceX Falcon 9 (Block 5) raketasining interaktiv 3D
"anatomiya" exploreri: https://github.com/ashemag/human-atlas loyihasidan
ilhomlangan (u odam anatomiyasini shunday ko'rsatadi — bu yerda xuddi shunday
g'oya raketa uchun amalga oshirilmoqda).

Foydalanuvchi so'zma-so'z aytgan talab: **"perfektlik vaqtdan ustun"** — sifat
va to'g'rilik tezlikdan muhimroq. Har bir yangi funksiya haqiqiy brauzerda
(headless Puppeteer yoki mcp Browser pane orqali) screenshot bilan tekshirilib,
keyingina "tayyor" deb hisoblanishi kerak. Faraz qilib "ishlaydi" deb
yozmaslik — bir necha marta xato aynan shu sababdan (tekshirmasdan) yuz berdi
(pastda "Ma'lum xatolar tarixi" bo'limida batafsil).

Loyiha papkasi: `/Users/apple/Documents/Loyihalar/falcon-atlas` — git repo,
faqat **bitta branch: `master`**, GitHub remote **yo'q** (hali push
qilinmagan, faqat local commit'lar). Agar GitHub'ga chiqarish so'ralsa,
`gh repo create` bilan yangi repo yaratib shu `master`ni push qilish kifoya
(alohida `main` branch yaratish shart emas, lekin GitHub odatda `main`ni
standart deb hisoblaydi — xohlasa `git branch -m master main` bilan
nomlash mumkin).

## 2. Texnologiyalar (stack)

- **Vite 8** + **React 19** + **TypeScript** (strict)
- **Three.js 0.186** — barcha 3D render, custom `RocketScene` klassi orqali
  (react-three-fiber ISHLATILMAGAN — atayin, quyida sababi bor)
- **Tailwind CSS 4** (`@tailwindcss/vite` plugin) + **shadcn/ui** (radix-ui
  asosida, `nova` preset, style nomi "radix-nova")
- **Zustand 5** — global state (`src/store/useAtlas.ts`)
- **lucide-react** — barcha ikonkalar
- Dev server porti: **3017** (`.claude/launch.json` va `vite.config.ts`da
  belgilangan). `npm run dev` bilan ishga tushadi.
- Build: `npm run build` (tsc + vite build). Har doim commit'dan oldin
  `npx tsc -p tsconfig.app.json --noEmit` va `npm run build` orqali tekshirish
  kerak — ikkalasi ham HOZIR toza (xatosiz) o'tadi.
- `scripts/shot.mjs` — Puppeteer orqali headless screenshot oluvchi yordamchi
  skript (`node scripts/shot.mjs out.png --setup "JS kodi" --wait 1500`).
  Ichida `window.__atlas` (zustand store) va `window.__scene` (RocketScene
  instance) `import.meta.env.DEV` bo'lganda global'ga chiqarilgan — shu orqali
  brauzer konsolida yoki Puppeteer'da to'g'ridan-to'g'ri state'ni
  o'zgartirib/tekshirib bo'ladi (masalan
  `window.__atlas.getState().setFlight(true)`).

### Nega react-three-fiber emas?

Boshida oddiy Three.js sahna qo'lda yozilgan (`RocketScene` klassi), chunki
scene juda ko'p custom, past darajadagi mantiqni talab qiladi: DOM'dan
o'lchangan kamera insets, clip plane, per-part flight pose, custom wheel
handling va h.k. — bularning barchasini r3f'ning deklarativ modelida qilish
ko'proq abstraction ustidan kurashishga aylanardi. Hozir qaytib r3f'ga
o'tkazish **tavsiya etilmaydi** — juda katta qayta yozish bo'ladi va foyda yo'q.

## 3. Papka tuzilishi va har bir qismning vazifasi

```
src/
  data/
    types.ts                — Part, System, Concept, Rocket, L10n (uz/en) tiplari
    catalogue.ts             — childrenOf/leafIds/conceptLeafIds yordamchilari
                                (group qismlar — masalan "merlin-1" — ning
                                bolalarini topish uchun)
    falcon9/
      (dims.ts BU YERDA YO'Q — pastdagi models/falcon9/dims.ts yagona manba,
       data/falcon9/index.ts undan HEIGHT/D import qiladi)
      systems.ts             — 10 ta "tizim" (SystemId): airframe, tanks,
                                propulsion, recovery, payload, avionics,
                                pressurization, plumbing, rcs, separation
      parts/
        shared.ts            — SRC (manbalar ro'yxati), spec(), repeat()
                                (N ta raqamlangan nusxa yaratish helper'i)
        engines.ts            — Merlin 1D ×9 va MVac, HAR BIRI GROUP qism
                                (geometriyasiz) + uning sub-qismlari
                                (chamber, nozzle, injector, turbopump,
                                gas-generator, exhaust-duct, gimbal, valves)
        stage1.ts             — octaweb, tanklar, COPV, avionika, RCS,
                                grid-fin×4, landing-leg×4, interstage va h.k.
        stage2.ts             — S2 tanklar, payload-adapter, fairing-half×2,
                                payload-spacecraft va h.k.
      parts.ts                — PARTS/PART_BY_ID/CONCEPTS/CONCEPT_BY_ID
                                yig'indisi (barcha stage1+engines+stage2)
      flight.ts               — FLIGHT_MILESTONES (8 ta bosqich, t=0..1)
      index.ts                — FALCON9: Rocket obyekti (hammasi shu yerda
                                birlashadi)
  models/
    primitives.ts             — lathe/tank/shell/box/cylinder/torus/loft/merge
                                — past darajadagi geometry helper'lari
    types.ts                  — MaterialKey (paint-white, steel, titanium...),
                                BuiltPart, BuiltModel
    falcon9/
      dims.ts                 — YAGONA o'lchamlar manbasi (metrlarda), Y
                                yuqoriga, y=0 = 1-bosqich soplo chiqish
                                tekisligi. `src/data/falcon9/index.ts`
                                bu yerdan HEIGHT/D import qiladi (Rocket
                                obyekti uchun).
      structures.ts            — octaweb, tanklar, interstage, gridFin,
                                landingLeg, s2ThrustStructure, fairingHalf va h.k.
                                GEOMETRIYA QURUVCHI funksiyalar
      merlin.ts                 — Merlin/MVac dvigatel sub-qismlarining
                                geometriyasi (buildEngine() — Map<key,
                                {geometry, material}> qaytaradi)
      internals.ts              — COPV, manifold, equipmentRing, thrusterPod,
                                separationRing, satellite va h.k. — kichik
                                ichki detallar
      index.ts                  — buildFalcon9(): BuiltModel — HAMMA qismni
                                yig'ib, joylashtirib (placeEngine orqali
                                pinwheel/ring joylashuv bilan) qaytaradi
  scene/
    RocketScene.ts             — ENG MUHIM FAYL (875 qator). Butun Three.js
                                sahnasini boshqaradi: renderer, camera,
                                OrbitControls, barcha part mesh'lari, pick,
                                hover, explode/isolate/cutaway/flight
                                rejimlarini birlashtiruvchi animate() frame
                                loop. Batafsil pastda alohida bo'lim bor.
    SceneView.tsx               — React komponenti, RocketScene'ni yaratadi
                                va zustand store bilan bog'laydi
                                (snapshot() funksiyasi orqali)
    explode.ts                  — separationVector() (explode slайder uchun
                                har bir qismning siljish yo'nalishi),
                                inventoryLayout() (barcha qismlarni katalog
                                ko'rinishida joylashtirish)
    flight.ts                   — flightPose() — HAR BIR qism uchun vaqt (t)
                                bo'yicha pozitsiya/burchak/dvigatel-yorqinligi
                                hisoblovchi funksiya. totalThrust(t) — audio
                                uchun umumiy tortish kuchi (0..1)
    flame.ts                    — dvigatel alangasi (2 qatlamli konus,
                                additive blending)
    audio.ts                    — FlightAudio klassi — Web Audio API orqali
                                SINTEZ qilingan dvigatel guvillashi (litsenziya
                                talab qilmaydi)
    materials.ts                 — createPartMaterial(), tint() (selected/
                                hover/powered rangga bo'yash), retheme()
    ground.ts                    — gradient yer/fon shader'i
    PointerTap.ts                 — tap vs drag farqlash (orbit/tanlash uchun)
  ui/
    Header.tsx                  — Identity (logo/eyebrow), TopActions
                                (qidiruv, flight toggle, til, tema, info)
    SideRail.tsx                 — chap tomondagi vertikal ikonka-panel
                                (Systems + Explode toggle'lari birlashgan)
    SystemsPanel.tsx              — SystemsToggle (ikonka) + SystemsPanel
                                (to'liq panel)
    Explode.tsx                   — ExplodeToggle (ikonka) + ExplodeDock
                                (slайder)
    ViewControls.tsx               — ViewControlsToggle (Compass ikonka) +
                                ViewControls (¾/F/S/B + rotate + cutaway +
                                reset) + CutawayPanel (burchak slайderi)
    Flight.tsx                     — FlightToggle (yuqori panelda),
                                FlightDock (pastki panel: play/pause,
                                scrubber, bosqich belgilari),
                                useFlightPlayback() hook (rAF orqali
                                flightTime'ni avtomatik oshiradi)
    SearchPanel.tsx                 — qism/konsept qidiruv (uz/en, aliaslar
                                bilan)
    Inspector.tsx                    — tanlangan qism haqida to'liq ma'lumot
                                (tavsif, spec, material, fakt, manba,
                                parent/children navigatsiyasi)
    Overlays.tsx                     — Caption (sahna sarlavhasi), Footer
                                (gesture maslahatlari + credit + "Sources"),
                                Loading, HoverLabel
    About.tsx                        — "Atlas haqida" paneli
    useDraggable.ts                   — barcha suzuvchi panellarni drag
                                qilish uchun umumiy hook
  i18n/
    strings.ts                        — barcha UI matnlari (uz/en, bitta
                                obyektda, funksiyalar ham bo'lishi mumkin
                                masalan metaPieces(n))
    index.ts                          — useT() (UI matnlari), useL()
                                (bilingual L10n obyektlarni hal qilish)
  store/
    useAtlas.ts                       — YAGONA global state (zustand).
                                Pastda batafsil.
  App.tsx                             — barcha komponentlarni joylashtiradi
  main.tsx, index.css                 — root, GLOBAL CSS (441 qator — barcha
                                dizayn shu yerda, Tailwind componentlardan
                                deyarli foydalanilmagan, qo'lda yozilgan CSS)
```

**Ishlatilmayotgan/eskirgan fayllar:** `src/assets/hero.png`, `src/assets/vite.svg`
— Vite scaffold'dan qolgan, hech qayerda import qilinmagan. Xohlasangiz
o'chirsa bo'ladi, lekin hozircha zarar keltirmaydi.

## 4. Ma'lumotlar modeli (muhim tushunchalar)

- **Part** — bitta jismoniy (yoki sxematik) qism. `id`, `name` (L10n),
  `system` (SystemId), `stage` (StageId: `stage1|interstage|stage2|fairing`),
  `concept` (bir xil turdagi qismlarni guruhlash uchun, masalan barcha
  Merlin sub-qismlari turli concept'larga ega — pastga qarang),
  `parent?` (ierarxiya uchun), `group?: boolean` (true bo'lsa — bu qismning
  o'zi GEOMETRIYAGA EGA EMAS, faqat uning bolalari bor; RocketScene bunday
  qismlarni **butunlay o'tkazib yuboradi** — `if (part.group) continue`).
- **MUHIM TUZOQ:** Merlin/MVac dvigatellari `group:true` qismlar
  (`merlin-1`...`merlin-9`, `mvac`), ularning HAQIQIY geometriyasi
  sub-qismlarda: `merlin-1-chamber`, `merlin-1-nozzle`, `merlin-1-injector`,
  `merlin-1-turbopump`, `merlin-1-gas-generator`, `merlin-1-exhaust-duct`,
  `merlin-1-gimbal`, `merlin-1-valves` (mvac uchun qo'shimcha
  `mvac-nozzle-extension`). **Bu sub-qismlarning `concept` maydoni
  `'merlin-1d'` EMAS** — har biri o'zining concept'iga ega (`'nozzle'`,
  `'combustion-chamber'` va h.k.). Shuning uchun "bu Merlin dvigateliga
  tegishlimi?" tekshiruvi **concept orqali emas, balki
  `part.id.match(/^merlin-\d+-/)` yoki `part.id.startsWith('mvac-')` orqali**
  qilinishi kerak — `src/scene/flight.ts`da bir marta xato qilingan va
  tuzatilgan joy shu (dvigatel yorug'ligi hisoblanmay qolgandi).
- **Concept** — masalan `'merlin-1d'` konsepti 9 ta ENGINE GROUP qismini
  o'z ichiga oladi (sub-qismlarni emas!). `CONCEPTS` massivi
  `src/data/falcon9/parts.ts`da avtomatik quriladi: har bir concept uchun
  faqat "eng tepadagi" (parent'i shu concept'ga tegishli bo'lmagan) qismlar
  yig'iladi.
- **`src/data/catalogue.ts`** — `leafIds(id)` group qismning barcha
  GEOMETRIYALI (leaf) bolalarini rekursiv topadi; qidiruv/tanlash shu orqali
  ishlaydi (masalan "Merlin 1D dvigatellari" konseptini tanlasangiz — barcha
  9 dvigatelning HAMMA sub-qismlari tanlanadi, `conceptLeafIds()` orqali).

## 5. RocketScene.ts — eng murakkab qism (batafsil)

Bu klass BITTA umumiy `animate()` frame loop'da 4 xil "rejim"ni birlashtiradi:
1. **Explode** (`s.explode`, 0..1) — slайder orqali qismlarni yig'ilgandan
   ajratilgan holatgacha, so'ng "inventar" katalog ko'rinishigacha suradi
   (`explode.ts`dagi `separationVector`/`inventoryLayout`).
2. **Isolate** (`s.isolate`) — faqat tanlangan qism(lar) ko'rinadi, kamera
   ularga yaqinlashadi.
3. **Cutaway** (`s.cutaway`, `s.cutawayAngle`) — clip plane orqali raketani
   kesib, ichini ko'rsatish.
4. **Flight** (`s.flight`, `s.flightTime`) — parvoz animatsiyasi (5-bosqich).

**Kamera moslashuvi (`frameFor`/`fitBox`)** — HAR TO'RTALA rejim uchun ham
umumiy: `visibleBox()` orqali hozir ko'rinadigan qismlarning bounding box'i
hisoblanadi, keyin `fitBox()` uni ekranga (UI panellardan bo'sh joyga)
moslaydi. **`insets()` metodi HAQIQIY DOM elementlaridan** (`.systems-panel`,
`.inspector.open`, `.bottom-dock` va h.k.) o'lchov oladi — qattiq raqamlar
bilan EMAS. Bu ataylab shunday qilingan: agar UI panel o'lchami/joyi
o'zgarsa (masalan endi collapsible bo'lgani uchun), kamera insets AVTOMATIK
to'g'ri ishlaydi, hech narsani qo'lda sozlash shart emas.

**Muhim texnik hiylalar (nega standart yo'ldan chetga chiqilgan):**

1. **Wheel event handling** — OrbitControls standart holda wheel = zoom.
   Foydalanuvchi so'radi: scroll = pan, Ctrl+scroll (trackpadda pinch) =
   zoom. Yechim: `this.host`ga (canvas emas, uning ENG YAQIN ota elementi)
   `{capture:true}` bilan wheel listener qo'yilgan. **SABAB:** agar
   listener xuddi shu canvas elementiga qo'yilsa, OrbitControls'ning o'z
   wheel handleri bilan bir xil elementda ikkalasi ham ishlaydi va
   capture/bubble farqi ISHLAMAYDI (bitta elementdagi listenerlar
   REGISTRATSIYA TARTIBIDA ishlaydi, capture flag'idan qat'i nazar).
   Faqat ANA ELEMENTGA (canvas emas, uning parent'i) qo'yilganda haqiqiy
   capture-phase ustunligi ishlaydi (chunki endi bu ancestor→descendant
   yo'lida haqiqiy bosqich farqi bor). `e.stopPropagation()` chaqirilib,
   OrbitControls'ning o'z handleri UMUMAN ishga tushmaydi.
2. **Clearcoat + clippingPlanes bug** — Three.js'da `MeshPhysicalMaterial`
   ning `clearcoat` xususiyati **clippingPlanes bilan ishlamaydi** (bug/
   cheklov). Bu sababli 'paint-white' materialida clearcoat 0.25 qo'yilgan
   edi — cutaway rejimi BUTUNLAY ko'rinmay qolgan edi (soatlab debug
   qilingan). Yechim: barcha materiallarda `clearcoat: 0` (materials.ts'da
   izoh bor, **hech qachon clearcoat qo'shmang**).
3. **Z-fighting (ichki kesim materiali)** — kesilgan joyni ko'rsatish uchun
   har bir qismga IKKINCHI (ichki, BackSide, matt kulrang) mesh
   qo'shilgan (child sifatida). Muammo: tashqi material `DoubleSide`
   (ba'zi ochiq/yupqa qismlar — panjarali qanotlar kabi — uchun kerak),
   shuning uchun uning BACKFACE'i ichki material bilan BIR XIL chuqurlikda
   raqobatlashadi (z-fighting, tasodifiy g'olib). Yechim:
   `interiorMaterial`ga `polygonOffset: true, polygonOffsetFactor: -4,
   polygonOffsetUnits: -4` — ichki qatlam har doim g'olib chiqadi.
4. **Drag offset + CSS transform to'qnashuvi** — `useDraggable` hook avval
   `style={{transform: ...}}` qaytargan, lekin bu INLINE STYLE CSS'dagi
   markazlashtirish transformlarini (masalan `translateY(-50%)`) BUTUNLAY
   O'CHIRIB YUBORARDI. Yechim: endi `useDraggable` faqat CSS CUSTOM
   PROPERTY qaytaradi (`--drag-x`, `--drag-y`), har bir panelning CSS
   qoidasi o'z transform zanjirini `translate(var(--drag-x, 0px),
   var(--drag-y, 0px))` bilan TUGATADI — shunda markazlashtirish/scale
   animatsiyasi bilan drag birga ishlaydi.
5. **Flame joylashuvi** — har bir dvigatel alangasi nozzle mesh'ining
   `geometry.boundingBox`idan (min.y = chiqish tekisligi, markaz x/z)
   hisoblanadi — aniq placement matematikasini takrorlash SHART EMAS,
   chunki geometriya allaqachon joylashtirilgan holda (assembly transform
   vertex'larga "pishirilgan").
6. **Settle frames** — headless/on-demand render'da ba'zan bitta frame
   YETARLI bo'lmaydi (compositor eski frame'ni ko'rsatishi mumkin). Shuning
   uchun `this.settle = 3` — dirty bo'lgach 3 ta frame ketma-ket render
   qilinadi.

## 6. Store (`useAtlas.ts`) — state va o'zaro istisno qoidalari

Asosiy rejimlar: `explode`, `isolate`, `cutaway`, `flight` — булар BIR-BIRINI
ISTISNO QILADI (bir vaqtda faqat bittasi mazmunli). Har bir action bu
qoidani QO'LDA ta'minlaydi (masalan `setFlight(true)` — `explode:0,
isolate:false, cutaway:false`ni ham o'rnatadi; `setExplode()` — `flight:false`
qiladi va h.k.). Yangi rejim/action qo'shsangiz, BU QOIDANI ESLAB QOLING.

UI panel holatlari: `panel` (`'systems'|'search'|null`), `explodeOpen`,
`viewControlsOpen`, `inspectorOpen`, `aboutOpen` — bularning barchasi
`sceneDefaults` obyektida, `reset()` ularni ham asl holatga qaytaradi.

`window.__atlas` — DEV rejimida global expose qilingan (faqat
`import.meta.env.DEV` bo'lganda) — test/debug uchun juda foydali.

## 7. Hozirgi holat — nima ISHLAYDI

Barcha quyidagilar **haqiqiy brauzerda tekshirilgan va ishlaydi** (screenshot
orqali tasdiqlangan):

- ✅ **0–3-bosqich**: Falcon 9 to'liq procedural model, 140 ta qism (barcha
  9 Merlin sub-qismlari bilan, MVac, barcha tank/avionika/RCS/COPV/legs/fins),
  tanlash, hover, Inspector (parent/children navigatsiyasi bilan), qidiruv
  (concept+part, alias bilan), Systems panel (visibility toggle, preset'lar).
- ✅ **Explode view** — slайder, inventar katalog joylashuvi, label'lar.
- ✅ **Isolate rejimi** — kamera DOM-asosli insets bilan to'g'ri moslashadi
  (bu avval BUG edi — panel ustiga tushib qolardi — TUZATILGAN).
- ✅ **Cutaway (kesim) rejimi** — burchak bilan boshqariladigan clip plane,
  ichki matt material to'g'ri ko'rinadi (yuqoridagi clearcoat/z-fighting
  tuzatishlaridan keyin).
- ✅ **5-bosqich: Flight sequence** — TO'LIQ ishlaydi:
  - 8 ta bosqich (liftoff→MECO→separation→boostback→fairing→entry→
    landing→payload), timeline scrubber, milestone belgilari, play/pause.
  - Booster pastga tushib, yon tomonga qo'nadi (aniq y=0 da); 2-bosqich
    ko'tarilishda davom etadi; obtekatel yarmlari ajraladi va orqada
    qoladi; qo'nish oyoqlari HAQIQIY sharnir-aylanish matematikasi bilan
    ochiladi (hinge nuqtasi har bir oyoq azimutiga qarab hisoblanadi);
    panjarali qanotlar soddalashtirilgan (translate+kichik burilish)
    tarzda "ochiladi"; yuk oxirida adapterdan ajraladi.
  - Ko'tarilish animatsiyasi: ajralishgacha butun raketa 55m ko'tariladi
    (CLIMB_PEAK), kamera unga ergashadi — bu orqali start maydonchasi
    ekrandan pastda qolib ketadi (foydalanuvchi so'ragan "uchish
    hissi" — avval umuman yo'q edi, keyin qo'shildi).
  - Dvigatel alangasi (flame) — har bir yonayotgan dvigatelda ko'rinadi,
    faqat markaziy dvigatel yonganda (boostback/entry/landing) ham TO'G'RI
    ishlaydi (faqat merlin-9da, boshqalarida yo'q).
  - Tovush — Web Audio API orqali sintez (brown noise + past chastota),
    umumiy tortish kuchiga (`totalThrust(t)`) qarab balandligi o'zgaradi.
    **OGOHLANTIRISH:** men buni faqat KOD DARAJASIDA (gain qiymatlari
    to'g'ri hisoblanishini) tekshira oldim — HAQIQIY OVOZNI ESHITIB
    TEKSHIRA OLMAYMAN. Foydalanuvchi hali buni tasdiqlamagan.
- ✅ **UI qayta dizayni** (oxirgi sessiya):
  - Scroll = pan, Ctrl+scroll (pinch) = zoom (avval faqat zoom edi,
    pastga tushib bo'lmasdi — TUZATILGAN).
  - "Liquid glass" dizayn: kuchli blur+saturate, diagonal sheen overlay
    (`::before`), qatlamli border/soya — `.glass` klassida.
  - Systems + Explode chap tomonda BITTA vertikal ikonka-panelda
    (`SideRail.tsx`), Kamera ko'rinishlari (ViewControls) o'ng tomonda
    xuddi shunday — barchasi ikonka holatida boshlanadi, bosilganda
    animatsiya bilan ochiladi (scale+fade, "Flight sequence" tugmasi
    namunasida).
  - Barcha suzuvchi panellar (Systems, ViewControls, Cutaway, Explode/
    Flight dock) YUQORIDAGI TUTQICH orqali drag qilinadi (sessiya
    davomida saqlanadi, sahifa qayta yuklanganda RESETLANADI — bu ATAYIN,
    murakkab persistensiya qo'shilmagan).
  - Footer'da "MuhammadYusuf | Claude" credit qatori bor.
  - Mobil layout: Identity va TopActions endi bir-birining ustiga
    tushmaydi (avval BUG edi — TUZATILGAN, alohida qatorlarga
    joylashtirilgan).

## 8. Ma'lum cheklovlar / tekshirilmagan narsalar

1. **Tovush eshitib tekshirilmagan** (yuqorida aytilgan) — foydalanuvchidan
   fikr-mulohaza kutilmoqda.
2. **Mobil qurilmada haqiqiy test qilinmagan** — faqat brauzer devtools
   emulyatsiyasida tekshirilgan, va oxirgi sessiyada browser pane
   viewport'i bir necha marta KUTILMAGANDA o'zgarib turdi (log'da "another
   Claude session set this" degan xabar chiqqan — balki shu muhitda
   BOSHQA sessiya/process bir xil brauzer pane'ni ishlatgandir). Shuning
   uchun mobil UI ALBATTA haqiqiy telefon yoki to'g'ri sozlangan devtools'da
   qayta tekshirilishi kerak.
3. **Drag pozitsiyasi persist qilinmaydi** — sahifa yangilanganda barcha
   panellar boshlang'ich joyiga qaytadi (React local state, localStorage
   ishlatilmagan). Agar foydalanuvchi buni so'rasa — `useDraggable.ts`ga
   localStorage saqlash qo'shish kerak bo'ladi.
4. **Grid fin deploy animatsiyasi soddalashtirilgan** — haqiqiy sharnir
   matematikasi emas (faqat kichik translate+burilish), chunki aniq hinge
   nuqtasini geometriyadan chiqarish xavfli/murakkab deb topilgan
   (`scene/flight.ts`dagi izohda tushuntirilgan). Landing leg'lar esa
   TO'LIQ to'g'ri hinge-aylanish bilan ishlaydi.
5. **Boostback flip animatsiya qilinmagan** — real Falcon 9 booster
   boostback paytida 180° aylanadi (dvigatellarni parvoz yo'nalishiga
   qaratish uchun). Bu ATAYIN qo'shilmagan — xavf/foyda nisbati past deb
   topilgan (agar noto'g'ri qilinsa, oyoqlar teskari ko'rinishi mumkin).
   Buning o'rniga faqat matn (caption) orqali tushuntiriladi.
6. **`fairing-separation-system` va boshqa kichik mexanizm qismlari** —
   ularning aniq FLIGHT harakati yo'q (faqat ota-guruhi bilan birga
   harakatlanadi), chunki ular kichik/muhim bo'lmagan detallar.
7. **GitHub'ga hali push qilinmagan** — faqat local git repo. Agar
   foydalanuvchi so'rasa, `gh repo create` orqali yaratib push qilish kerak
   (avvalgi PLAN.md'da GitHub+Vercel deploy rejalashtirilgan edi).

## 9. Keyingi qadam (PLAN.md bo'yicha qolgan bosqichlar)

PLAN.md faylida (loyiha ildizida) asl reja bor. Bajarilmagan qismlar:

- **6-bosqich: Kontent** — barcha 140 qism uchun uz/en tavsif/spec/manba
  matnlari ALLAQACHON yozilgan (parts/*.ts fayllarida) — lekin foydalanuvchi
  ular sifatini/to'g'riligini hali ko'rib chiqmagan bo'lishi mumkin. Agar
  davom etilsa: barcha tavsiflarni birma-bir Inspector orqali ko'rib,
  matn sifatini tekshirish mumkin.
- **7-bosqich: Mobil polish, performance, README/attribution** — HALI
  QILINMAGAN. Tasdiqlangan holat (2026-09-13 tekshirilgan):
  - `public/` da faqat `favicon.svg` va `icons.svg` bor — **ATTRIBUTION.md
    UMUMAN YO'Q**, hali yozilmagan (manbalar hozircha faqat kod ichidagi
    `SRC`/`sources` maydonlarida va `About.tsx` panelida bor).
  - `README.md` hali **Vite'ning standart scaffold matni** ("React +
    TypeScript + Vite... HMR va Oxlint qoidalari") — Falcon Atlas uchun
    UMUMAN yozilmagan.
  - Performance: 140+ qism, ~10 ta flame, audio — hali biror FPS/profiling
    qilinmagan.
  - Haqiqiy mobil qurilmada test (yuqorida aytilgan).
- **GitHub + Vercel deploy** — hali qilinmagan.

**Eng oqilona keyingi qadam:** foydalanuvchidan Flight sequence ovozini
tekshirishni so'rash (agar hali javob bermagan bo'lsa), keyin 7-bosqichga
o'tish (README, ATTRIBUTION, GitHub repo yaratish, Vercel deploy) — bular
loyihani "tugallash" uchun eng muhim qolgan ishlar.

## 10. Ishlash uslubi bo'yicha eslatmalar (muhim!)

- **Har doim `npx tsc -p tsconfig.app.json --noEmit` va `npm run build`
  bilan tekshiring** — commit'dan oldin ikkalasi ham toza bo'lishi shart.
- **Vizual o'zgarishlarni HAQIQIY brauzerda screenshot orqali tasdiqlang**
  — bu sessiyada bir necha marta "mantiqan to'g'ri ko'rinadi" deb
  o'ylangan narsa amalda ishlamagani aniqlangan (masalan clearcoat+clip
  bug'i, HMR eski state saqlab qolishi va h.k.). Screenshot olishdan oldin
  har doim **fresh page reload** qiling — Vite HMR ba'zan eski class
  instance'ni saqlab qoladi (`RocketScene` kabi katta klasslar uchun xavfli).
- **`dist/` papkasini HAR DOIM commit'dan oldin o'chiring** (`rm -rf dist`)
  — git'ga kirmasligi kerak (`.gitignore`da bor, lekin ehtiyot bo'ling).
- **Commit xabarlari o'zbek tilida, batafsil** — nima o'zgargani va NEGA
  (texnik sabab bilan) yozilgan, xuddi shu CLAUDE.md uslubida.
- Foydalanuvchi ba'zan screenshot yuborib fikr bildiradi — bunday
  holatlarda ANIQ nima demoqchi ekanini screenshot bilan solishtirib,
  keyin amalga oshiring (masalan oxirgi UI so'rovida "chap tomonda"
  degani screenshot kontekstidan aniqlashtirilgan edi).

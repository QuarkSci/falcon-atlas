# Falcon Atlas — loyiha holati (Claude uchun qo'llanma)

> Bu fayl **oldingi sessiyalarning to'liq konteksti** — yangi chatda ishni davom
> ettirish uchun shu faylni o'qib, quyida yozilganlarga tayangan holda davom
> etish kerak. Foydalanuvchi (MuhammadYusuf) o'zbek tilida yozadi, javoblar ham
> o'zbek tilida bo'lishi kutiladi. Kodga oid izohlar ingliz tilida (mavjud kod
> uslubiga mos).
>
> Oxirgi yangilanish: 2026-09-19 (GitHub Pages deploy'dan keyin).

## 1. Loyiha nima

**Falcon Atlas** — SpaceX Falcon 9 (Block 5) raketasining interaktiv 3D
"anatomiya" exploreri: https://github.com/ashemag/human-atlas loyihasidan
ilhomlangan (u odam anatomiyasini shunday ko'rsatadi — bu yerda xuddi shunday
g'oya raketa uchun amalga oshirilmoqda).

Foydalanuvchi so'zma-so'z aytgan talab: **"perfektlik vaqtdan ustun"** — sifat
va to'g'rilik tezlikdan muhimroq. Har bir yangi funksiya haqiqiy brauzerda
(mcp Browser pane yoki headless Puppeteer orqali) screenshot bilan tekshirilib,
keyingina "tayyor" deb hisoblanishi kerak. Faraz qilib "ishlaydi" deb
yozmaslik — bir necha marta xato aynan shu sababdan (tekshirmasdan) yuz berdi
(pastda "Ma'lum xatolar tarixi" bo'limida batafsil).

Loyiha papkasi: `/Users/apple/Documents/Loyihalar/falcon-atlas` — git repo,
bitta branch: `master`.

- **GitHub:** https://github.com/QuarkSci/falcon-atlas (public). Akkaunt
  nomi **QuarkSci** — git sozlamasidagi `MuhammadYusuf-scientist` bilan
  adashtirmang. `gh` CLI o'rnatilgan va shu akkaunt bilan login qilingan.
- **Jonli sayt:** https://quarksci.github.io/falcon-atlas/ — GitHub Pages,
  `master`ga har push'da `.github/workflows/deploy.yml` avtomatik build
  qilib chiqaradi (~45 s). Deploy holatini `gh run list` bilan ko'ring.
- Pages saytni `/falcon-atlas/` ostida beradi: `vite.config.ts`dagi `base`
  `VITE_BASE` muhit o'zgaruvchisidan olinadi (workflow o'rnatadi, lokalda
  '/'). Lokalda aynan Pages'dagi kabi ko'rish: `npm run preview:pages`.

## 2. Texnologiyalar (stack)

- **Vite 8** + **React 19** + **TypeScript** (strict)
- **Three.js 0.186** — barcha 3D render, custom `RocketScene` klassi orqali
  (react-three-fiber ISHLATILMAGAN — atayin, quyida sababi bor)
- **Tailwind CSS 4** (`@tailwindcss/vite` plugin) + **shadcn/ui** (radix-ui
  asosida). Amalda UI'ning deyarli hammasi `src/index.css`dagi qo'lda yozilgan
  CSS — shadcn'dan faqat `Switch` va `Slider` (cutaway paneli uchun) qolgan.
- **Zustand 5** — global state (`src/store/useAtlas.ts`)
- **lucide-react** — barcha ikonkalar
- Dev server porti: **3017** (`.claude/launch.json` va `vite.config.ts`da
  belgilangan). `npm run dev` bilan ishga tushadi.
- Build: `npm run build` (tsc + vite build). Har doim commit'dan oldin
  `npx tsc -p tsconfig.app.json --noEmit` va `npm run build` orqali tekshirish
  kerak — ikkalasi ham HOZIR toza (xatosiz) o'tadi.
- `scripts/shot.mjs` — Puppeteer orqali headless screenshot oluvchi yordamchi
  skript (`node scripts/shot.mjs out.png --setup "JS kodi" --wait 1500`).
  `window.__atlas` (zustand store) va `window.__scene` (RocketScene instance)
  `import.meta.env.DEV` bo'lganda global'ga chiqarilgan — shu orqali brauzer
  konsolida yoki Puppeteer'da to'g'ridan-to'g'ri state'ni o'zgartirib/tekshirib
  bo'ladi (masalan `window.__atlas.getState().setFlight(true)`).

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
    falcon9/
      systems.ts             — 10 ta "tizim" (SystemId): airframe, tanks,
                                propulsion, recovery, payload, avionics,
                                pressurization, plumbing, rcs, separation
      parts/shared.ts        — SRC (manbalar), spec(), repeat()
      parts/engines.ts       — Merlin 1D ×9 va MVac (har biri GROUP qism) +
                                sub-qismlari
      parts/stage1.ts        — octaweb, tanklar, COPV, avionika, RCS,
                                grid-fin×4, landing-leg×4, interstage…
      parts/stage2.ts        — S2 tanklar, payload-adapter, fairing-half×2…
      parts.ts               — PARTS/PART_BY_ID/CONCEPTS/CONCEPT_BY_ID
      flight.ts              — FLIGHT_MILESTONES (8 ta bosqich, t=0..1)
      index.ts               — FALCON9: Rocket obyekti
  models/
    primitives.ts            — lathe/tank/shell/box/cylinder/torus/loft/merge
    types.ts                 — MaterialKey, BuiltPart, BuiltModel
    falcon9/
      dims.ts                — YAGONA o'lchamlar manbasi (metrlarda), Y
                                yuqoriga, y=0 = 1-bosqich soplo chiqish
                                tekisligi. `data/falcon9/index.ts` shu yerdan
                                HEIGHT/D import qiladi.
      structures.ts          — octaweb, tanklar, interstage, gridFin,
                                landingLeg, fairingHalf… geometriya quruvchilar
      merlin.ts              — dvigatel sub-qismlari geometriyasi
      internals.ts           — COPV, manifold, thrusterPod, satellite…
      index.ts               — buildFalcon9(): BuiltModel
  scene/
    RocketScene.ts           — ENG MUHIM FAYL (~890 qator). Batafsil 5-bo'limda.
    SceneView.tsx            — React komponenti; RocketScene'ni yaratadi va
                                store bilan `snapshot()` orqali bog'laydi
    explode.ts               — separationVector(), inventoryLayout()
    flight.ts                — flightPose() (har bir qism uchun t bo'yicha
                                poza), totalThrust(t) (audio uchun)
    flame.ts                 — dvigatel alangasi (additive konus)
    audio.ts                 — FlightAudio — Web Audio API orqali SINTEZ
                                qilingan dvigatel guvillashi
    materials.ts             — createPartMaterial(), tint(), HIGHLIGHT/HOVER
    ground.ts                — gradient yer/fon shader'i
    PointerTap.ts            — tap vs drag farqlash
  ui/
    Header.tsx               — Mark (raketa belgisi), Identity (belgi + matn),
                                TopActions (yagona yuqori tab bar)
    SideRail.tsx             — chap vertikal rail: ko'rinuvchanlik presetlari
                                (Hammasi/Tuzilma/Dvigatellar) + chevron
    SystemsPanel.tsx         — iPhone uslubidagi varaq (sheet) + useSheetDrag
    BottomBar.tsx            — pastki stack: MacSlider, Gauge, ModeTabs
    Flight.tsx               — flightAudio + useFlightPlayback() (UI yo'q)
    ViewControls.tsx         — faqat CutawayPanel (kesim burchagi slayderi)
    SearchPanel.tsx          — qism/konsept qidiruv (uz/en, aliaslar bilan)
    Inspector.tsx            — tanlangan qism haqida to'liq ma'lumot
    Overlays.tsx             — Footer, Loading, HoverLabel
    About.tsx                — "Atlas haqida" paneli
    useDraggable.ts          — CutawayPanel uchun drag hook
  i18n/strings.ts, index.ts  — barcha UI matnlari (uz/en), useT()/useL()
  store/useAtlas.ts          — YAGONA global state (zustand)
  App.tsx, main.tsx          — root
  index.css                  — GLOBAL CSS (~560 qator): dizayn tizimi shu yerda
```

**Ishlatilmayotgan fayllar:** `src/assets/hero.png`, `src/assets/vite.svg` —
Vite scaffold'dan qolgan, hech qayerda import qilinmagan.
`src/components/ui/` ichida ham ko'p ishlatilmayotgan shadcn komponentlari bor.

## 4. Ma'lumotlar modeli (muhim tushunchalar)

- **Part** — bitta jismoniy (yoki sxematik) qism. `id`, `name` (L10n),
  `system` (SystemId), `stage` (StageId), `concept`, `parent?`,
  `group?: boolean` (true bo'lsa — bu qismning o'zi GEOMETRIYAGA EGA EMAS,
  faqat bolalari bor; RocketScene bunday qismlarni **butunlay o'tkazib
  yuboradi** — `if (part.group) continue`).
- **MUHIM TUZOQ:** Merlin/MVac dvigatellari `group:true` qismlar
  (`merlin-1`…`merlin-9`, `mvac`), haqiqiy geometriya sub-qismlarda:
  `merlin-1-chamber`, `-nozzle`, `-injector`, `-turbopump`, `-gas-generator`,
  `-exhaust-duct`, `-gimbal`, `-valves`. **Bu sub-qismlarning `concept`
  maydoni `'merlin-1d'` EMAS** — har biri o'zining concept'iga ega. Shuning
  uchun "bu Merlin dvigateliga tegishlimi?" tekshiruvi concept orqali emas,
  balki `part.id.match(/^merlin-\d+-/)` yoki `part.id.startsWith('mvac-')`
  orqali qilinishi kerak — `src/scene/flight.ts`da bir marta shu xato
  qilingan va tuzatilgan (dvigatel yorug'ligi hisoblanmay qolgandi).
- **Concept** — masalan `'merlin-1d'` konsepti 9 ta ENGINE GROUP qismini
  o'z ichiga oladi (sub-qismlarni emas). `CONCEPTS` avtomatik quriladi.
- **`catalogue.ts`** — `leafIds(id)` group qismning barcha geometriyali
  bolalarini rekursiv topadi; qidiruv/tanlash shu orqali ishlaydi.

## 5. RocketScene.ts — eng murakkab qism (batafsil)

Bitta umumiy `animate()` frame loop'da 4 xil "rejim"ni birlashtiradi:
1. **Explode** (`s.explode`, 0..1) — yig'ilgandan ajratilgangacha, so'ng
   "inventar" katalog ko'rinishigacha.
2. **Isolate** (`s.isolate`) — faqat tanlangan qism(lar) ko'rinadi.
3. **Cutaway** (`s.cutaway`, `s.cutawayAngle`) — clip plane orqali kesim.
4. **Flight** (`s.flight`, `s.flightTime`) — parvoz animatsiyasi.

**Kamera moslashuvi (`frameFor`/`fitBox`)** — `visibleBox()` orqali ko'rinadigan
qismlarning bounding box'i hisoblanadi, `fitBox()` uni UI panellardan bo'sh
joyga moslaydi. **`insets()` metodi HAQIQIY DOM elementlaridan** o'lchov oladi
(`.identity`, `.top-actions`, `.side-rail`, `.sheet.open`, `.bottom-dock`,
`.inspector.open`) — qattiq raqamlar bilan EMAS. Panel o'lchami o'zgarsa,
kamera avtomatik to'g'ri ishlaydi.

**Orbit markazi (`pivotTo`)** — qism tanlanganda orbit nishoni o'sha qismning
(explode siljishi hisobga olingan) markaziga ko'chadi va kamera ham xuddi shu
vektorga suriladi, shuning uchun ko'rinish burilmaydi va masofa o'zgarmaydi.
Tanlov bekor qilinsa nishon butun raketaga qaytadi. Isolate/flight o'z
kadrlash mantiqini saqlaydi (tartibda oldinroq tekshiriladi).

**Muhim texnik hiylalar (nega standart yo'ldan chetga chiqilgan):**

1. **Wheel event handling** — scroll = pan, Ctrl+scroll (trackpadda pinch) =
   zoom. Listener `this.host`ga (canvas emas, uning ota elementi)
   `{capture:true}` bilan qo'yilgan. **SABAB:** agar listener xuddi shu canvas
   elementiga qo'yilsa, OrbitControls'ning o'z handleri bilan bir xil elementda
   bo'lib qoladi va capture/bubble farqi ISHLAMAYDI (bitta elementdagi
   listenerlar REGISTRATSIYA TARTIBIDA ishlaydi). Faqat ANA ELEMENTGA
   qo'yilganda haqiqiy capture-phase ustunligi ishlaydi.
   **Yo'nalish:** kamera barmoqlar bilan BIRGA suriladi (raketa teskari
   tomonga siljiydi) — hujjatni scroll qilishdagi kabi. Teskarisi
   foydalanuvchiga noqulaylik tug'dirgandi, o'zgartirmang.
2. **Clearcoat + clippingPlanes bug** — Three.js'da `MeshPhysicalMaterial`ning
   `clearcoat` xususiyati **clippingPlanes bilan ishlamaydi**. Shu sababli
   cutaway rejimi butunlay ko'rinmay qolgandi (soatlab debug qilingan).
   Barcha materiallarda `clearcoat: 0` — **hech qachon clearcoat qo'shmang**.
3. **Z-fighting (ichki kesim materiali)** — har bir qismga ikkinchi (ichki,
   BackSide, matt) mesh qo'shilgan. Tashqi material `DoubleSide` bo'lgani uchun
   uning backface'i ichki material bilan bir xil chuqurlikda raqobatlashadi.
   Yechim: `interiorMaterial`ga `polygonOffset: true, polygonOffsetFactor: -4`.
4. **Flame joylashuvi** — har bir alanga nozzle mesh'ining
   `geometry.boundingBox`idan hisoblanadi; placement matematikasini
   takrorlash shart emas (assembly transform vertexlarga "pishirilgan").
5. **`warmUp()` — bo'sh canvas muammosi** — drawing buffer saqlanmagani uchun
   sahifa ochilganda chizilgan yagona kadr brauzer tomonidan tashlab
   yuborilardi va raketa faqat sichqoncha tekkanda paydo bo'lardi. Endi ishga
   tushishda, resize'da va tab'ga qaytganda 24 ta kadr ketma-ket chiziladi.
   `settle` qiymati `Math.max(...)` bilan yangilanadi — buni kamaytirmang.

## 6. Store (`useAtlas.ts`) — state va o'zaro istisno qoidalari

Asosiy rejimlar: `explode`, `isolate`, `cutaway`, `flight` — bular BIR-BIRINI
ISTISNO QILADI. Har bir action bu qoidani QO'LDA ta'minlaydi (masalan
`setFlight(true)` — `explode:0, isolate:false, cutaway:false`ni ham
o'rnatadi). Yangi rejim/action qo'shsangiz, BU QOIDANI ESLAB QOLING.

UI holatlari: `panel` (`'systems'|'search'|null`), `inspectorOpen`,
`aboutOpen`. `sceneDefaults` obyektidagilarni `reset()` asl holatga qaytaradi.

Faqat `lang` localStorage'da saqlanadi (`fa:lang`). **Tema yo'q** — ilova
faqat qora rejimda ishlaydi (7-bo'limga qarang).

`window.__atlas` DEV rejimida global expose qilingan.

## 7. Dizayn tizimi — Liquid Glass (muhim)

Manba: foydalanuvchining Figma fayli **falcon-anatomy**
(`73v6ZFOiY8ccMLOkQfgjX2`) — Apple'ning iOS/iPadOS 27 Liquid Glass kiti
asosida. Qiymatlar Figma MCP orqali (`get_variable_defs`, `get_metadata`)
o'qib olingan, taxmin qilinmagan. Figma o'zgaruvchilari:
`Opacity 25, Refraction 70, Frost (Regular) 6, Light Angle 0, Splay 20,
Depth 30, Dispersion 20`, aksent = "Tab Bar Selection" `#0088ff`.

**Faqat qora rejim.** Yorug' tema olib tashlangan (foydalanuvchi mos emas
deb topdi) — `Theme` tipi, tugmasi va sahnadagi yorug' variant yo'q.
`index.html`da `class="dark"`, CSS'da `color-scheme: dark`.

**`.glass` to'rt qatlamdan iborat** (`src/index.css`):
- **Tana** — vertikal gradient (yuqorida oq 6%, pastda 14%): yorug'lik
  oynaning pastida to'planadi. Tekis bitta rang plastmassaga o'xshaydi.
- **Depth/Splay** — eng yorqin chiziq *pastki ichki* qirra
  (`inset 0 -2px ... 60%`), yuqori qirra yumshoqroq. Aynan shu juftlik
  materialni "oyna" qilib ko'rsatadi.
- **`::before`** — spekulyar aks: yuqori chapda keng, pastki o'ngda kuchsiz
  dog' (egri sirt yorug'likni shunday qaytaradi).
- **`::after`** — Dispersion: `mask` bilan chizilgan haqiqiy 1px halqa,
  **konus (conic) gradient** bilan — yorug'lik shakl bo'ylab aylanadi, bir
  yonida sovuq, ikkinchisida issiq tus. Border bir xil rang beradi, shuning
  uchun **border ishlatmang**.
- Backdrop: `blur(11px) saturate(1.9) brightness(1.06) contrast(1.04)`.
  Frost 6 — *yengil* muzlatish; blur'ni 30px ga oshirmang, sahna ko'rinmay
  qoladi.

**O'lchamlar — fluid shkala.** Barcha tugma/panel o'lchamlari `:root`dagi
bitta birlikdan hosil bo'ladi:
`--u: clamp(11px, 0.19vw + 10.3px, 12px)` → `--ctl-h`, `--icon-w`,
`--rail-w`, `--mark`, `--knob`, `--gauge`, `--mode-h/w`, `--gap-edge`,
`--sheet-w`, `--slider-w`, `--side-panel-w`. Telefonda ~11px, planshetda
~11.5, desktopda 12 ga to'yinadi. **O'lcham o'zgartirish kerak bo'lsa —
faqat shu tokenlarni tahrirlang**, alohida qoidalarni emas.

**Breakpointlar faqat JOYLASHUVni o'zgartiradi** (o'lchamni emas):
- `>1240` — so'z-belgisi va tab matnlari ko'rinadi.
- `<=1024` (planshet) — panellar chetga yaqinlashadi, matn o'rniga glif.
- `<=640` (telefon) — raketa belgisi yuqori panel ICHIGA kiradi
  (`.pill-mark`, alohida `.identity` yashiriladi), varaq ekran pastidan
  chiquvchi haqiqiy bottom sheet, dock butun kenglikda, futer yashiriladi.
- `(max-height: 620px) and (min-width: 641px)` — past oynalar. `min-width`
  shart: usiz u telefondagi bottom sheet joylashuvini buzardi.

**UI tuzilishi:**
- Yuqori panel (`.top-actions`) — bitta pill: sidebar tugmasi, kamera
  ko'rinishlari + kesim tablari, qidiruv, aylantirish, til, info.
- Chap rail (`.side-rail`) — vertikal yozuvli presetlar + chevron (varaqni
  ochadi).
- Varaq (`.sheet`) — iPhone sheet: grabber (pastga tortsangiz yopiladi,
  `useSheetDrag`, >90px), chap yuqorida ✕, o'ng yuqorida aksent tugma.
- Pastki stack (`.bottom-dock`) — mac uslubidagi slider + doiraviy gauge,
  ostida iOS tab bar (Anatomiya / Parvoz). **`.bottom-dock` klass nomini
  o'zgartirmang** — RocketScene kamera insets'ni shundan o'lchaydi.

## 8. Hozirgi holat — nima ISHLAYDI

Barcha quyidagilar **haqiqiy brauzerda tekshirilgan** (screenshot bilan):

- ✅ **0–3-bosqich**: Falcon 9 to'liq procedural model, 140 ta qism, tanlash,
  hover, Inspector, qidiruv, Systems varag'i (visibility toggle, presetlar).
- ✅ **Explode view** — slider, inventar katalog joylashuvi, label'lar.
- ✅ **Isolate rejimi** — kamera DOM-asosli insets bilan to'g'ri moslashadi.
- ✅ **Cutaway (kesim)** — burchak bilan boshqariladigan clip plane.
- ✅ **5-bosqich: Flight sequence** — 8 bosqich, timeline, play/pause,
  booster qo'nishi, obtekatel ajralishi, oyoqlar sharnir-aylanishi,
  dvigatel alangasi, sintez qilingan tovush.
- ✅ **UI (2026-09-18 qayta dizayni)** — Liquid Glass, 7-bo'limga qarang.
  375×812, 768×1024 va 1280×800/1440×900 da tekshirilgan.
- ✅ **Orbit markazi** — tanlangan qism atrofida aylanish.
- ✅ Scroll = pan, Ctrl+scroll = zoom (yo'nalish teskari, 5-bo'limga qarang).

## 9. Ma'lum cheklovlar / tekshirilmagan narsalar

1. **Tovush eshitib tekshirilmagan** — faqat kod darajasida (gain qiymatlari)
   tekshirilgan; foydalanuvchidan fikr-mulohaza kutilmoqda.
2. **Haqiqiy mobil qurilmada test qilinmagan** — faqat brauzer viewport
   emulyatsiyasida.
3. **Drag pozitsiyasi persist qilinmaydi** — faqat CutawayPanel drag qilinadi,
   sahifa yangilanganda joyiga qaytadi (ATAYIN).
4. **Grid fin deploy animatsiyasi soddalashtirilgan** — haqiqiy sharnir
   matematikasi emas (`scene/flight.ts`dagi izohda tushuntirilgan). Landing
   leg'lar esa to'liq to'g'ri hinge-aylanish bilan ishlaydi.
5. **Boostback flip animatsiya qilinmagan** — ATAYIN (xavf/foyda nisbati
   past); faqat caption orqali tushuntiriladi.
6. **Bundle hajmi** ~1.03 MB (gzip 290 KB) — code splitting qilinmagan.

## 10. Keyingi qadam (PLAN.md bo'yicha qolgan bosqichlar)

- **6-bosqich: Kontent** — 140 qism uchun uz/en matnlar yozilgan, lekin
  foydalanuvchi ularni birma-bir ko'rib chiqmagan bo'lishi mumkin.
- **7-bosqich: Performance, README, ATTRIBUTION** — HALI QILINMAGAN:
  - `public/`da faqat `favicon.svg` va `icons.svg` — **ATTRIBUTION.md yo'q**
    (manbalar hozircha kod ichidagi `SRC`/`sources` va `About.tsx`da).
  - FPS/profiling qilinmagan.
  - Haqiqiy mobil qurilmada test (endi jonli havola bor — telefonda ochib
    ko'rish mumkin).
- ~~GitHub + deploy~~ — 2026-09-19 da bajarildi (1-bo'limga qarang).

## 11. Ishlash uslubi bo'yicha eslatmalar (muhim!)

- **Har doim `npx tsc -p tsconfig.app.json --noEmit` va `npm run build`
  bilan tekshiring** — commit'dan oldin ikkalasi ham toza bo'lishi shart.
- **Vizual o'zgarishlarni HAQIQIY brauzerda screenshot orqali tasdiqlang.**
  Screenshot olishdan oldin **fresh page reload** qiling — Vite HMR ba'zan
  eski class instance'ni saqlab qoladi.
  - Browser pane'da `document.hidden` true bo'lishi mumkin (panel
    ko'rinmayotgan bo'lsa) — bunda `requestAnimationFrame` to'xtaydi va sahna
    umuman qurilmaydi (`progress: 0`). Screenshot olish kadrni majburlaydi.
  - Bir xil URL'ga qayta `navigate` qilish ba'zan reload qilmaydi — state eski
    bo'lib qolishi mumkin. `?v=N` qo'shib yangilang.
- **`dist/` papkasini HAR DOIM commit'dan oldin o'chiring** (`rm -rf dist`).
- **Commit xabarlari o'zbek tilida, batafsil** — nima o'zgargani va NEGA
  (texnik sabab bilan), xuddi shu CLAUDE.md uslubida.
- Foydalanuvchi ba'zan screenshot yuborib fikr bildiradi — ANIQ nima demoqchi
  ekanini screenshot bilan solishtirib, keyin amalga oshiring.

## 12. Ma'lum xatolar tarixi (takrorlamaslik uchun)

Bu ro'yxatdagi har bir xato "mantiqan to'g'ri ko'rinadi" deb o'ylanib, lekin
brauzerda tekshirilmagani uchun yuz bergan:

1. **clearcoat + clippingPlanes** — cutaway butunlay ko'rinmay qolgandi.
2. **Merlin sub-qismlarini concept orqali topishga urinish** — parvozda
   dvigatel yorug'ligi ishlamagandi (4-bo'limga qarang).
3. **`useDraggable` inline `transform` qaytarishi** — CSS'dagi
   markazlashtirish transformlarini o'chirib yuborardi. Yechim: faqat CSS
   custom property (`--drag-x/--drag-y`), har bir panel o'z transform
   zanjirini `translate(var(--drag-x, 0px), var(--drag-y, 0px))` bilan
   tugatadi.
4. **`.systems-panel.mobile-open` selektori** — insets ichida hech qachon mos
   kelmagan o'lik selektor edi (klass nomi `open` edi). Endi `.sheet.open`.
5. **`.gauge svg` selektori juda keng** — halqa bilan birga ichkaridagi
   lucide ikonkasini ham 56px ga cho'zib, -90° aylantirib qo'yardi. Endi
   `.gauge > svg`.
6. **CSS blokini butunlay almashtirish** — bir marta `.systems-panel`dan
   `.search-panel`gacha bo'lgan blok almashtirilganda oradagi `.presets`,
   `.system-list`, `.panel-foot` qoidalari ham o'chib ketgan, varaq
   uslubsiz ko'ringan. Katta CSS bloklarini almashtirganda ichida nima
   borligini avval tekshiring.
7. **Bo'sh canvas** — 5-bo'lim, `warmUp()`.

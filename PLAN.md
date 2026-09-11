# Falcon Atlas — loyiha rejasi

Interaktiv 3D Falcon 9 "anatomiya" exploreri. Ilhom: https://github.com/ashemag/human-atlas

## Qarorlar (2026-09-11)
- Raketa: **Falcon 9** (Block 5). Keyin: Falcon Heavy, Starship, Dragon.
- 3D manba: **gibrid** — procedural Three.js asos + kerak joyda CC-litsenziyali tashqi GLB (har biri foydalanuvchi tasdig'i bilan, ATTRIBUTION.md).
- Chuqurlik: **chuqur** (~150+ qism, Merlin ichki tuzilishi bilan; sxematik ekani UI'da belgilanadi).
- Til: **uz + en**, toggle.
- Tema: **dark + light** toggle.
- Feature'lar: explode view, parvoz ketma-ketligi animatsiyasi, cutaway (clipping), texnik ma'lumot kartochkalari.
- Deploy: GitHub + Vercel (static).

## Stack
Vite · React 19 · TypeScript · Three.js (+ @react-three/fiber, drei) · Tailwind 4 · shadcn/ui · Zustand

## Struktura
```
src/
  data/falcon9/{parts,systems,flight}.ts
  models/procedural/   (tanks, interstage, octaweb, merlin, grid-fins, legs, copv, fairing ...)
  models/external/     (GLB + attribution)
  scene/               (renderer, picking, explode, cutaway, flight)
  ui/                  (panels, search, inspector, timeline, toggles)
  i18n/{uz,en}.json
```

## Bosqichlar
0. Skaffold + tema + bo'sh sahna, Vercel'da ishlaydi
1. Falcon 9 procedural, yuzaki (~20 qism) + select/hover/inspector  ← MVP
2. Tizim toggle + qidiruv + explode view
3. Chuqur detallar (~150 qism): Merlin 1D ×9 + MVac, octaweb, COPV, plumbing, avionika, RCS, grid fins/legs
4. Cutaway rejimi
5. Parvoz animatsiyasi (timeline: liftoff→MECO→sep→fairing→boostback→entry→landing)
6. Kontent uz/en, texnik kartochkalar, manbalar
7. Mobil, performance, polish, README/attribution

## Manbalar
SpaceX Falcon 9 User Guide (PDF), NASA CRS press kitlar, Everyday Astronaut / NSF texnik maqolalar.

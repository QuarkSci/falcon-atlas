# Falcon Atlas

Interactive 3D anatomy of the SpaceX Falcon 9 Block 5 — every part, system
by system, from the Merlin turbopumps to the fairing separation latches.
Inspired by [Human Atlas](https://github.com/ashemag/human-atlas).

**Live:** https://quarksci.github.io/falcon-atlas/

## What it does

- **Anatomy** — 140 procedurally modelled parts grouped into ten systems.
  Tap any part to inspect it (description, specs, material, sources, uz/en),
  toggle systems on and off, search by name or alias.
- **Explode** — slide from the assembled vehicle to separated assemblies to
  a full parts inventory.
- **Cutaway** — clip the vehicle at any azimuth to see inside the tanks,
  interstage and engine bay.
- **Liftoff** — an eight-milestone flight sequence: liftoff, MECO, stage
  separation, boostback, fairing deploy, entry, landing and payload deploy,
  with engine plumes and synthesised audio.

The vehicle is built from published dimensions, photographs and technical
descriptions — SpaceX does not publish CAD. Internal assemblies are
schematic and labelled as such. This is a learning tool, not engineering
data.

## Stack

Vite · React 19 · TypeScript · Three.js · Zustand · Tailwind 4.
The UI follows Apple's Liquid Glass material, with values taken from a
Figma design file (see `CLAUDE.md` §7).

## Develop

```bash
npm install
npm run dev        # http://localhost:3017
npm run build      # type-check + production build into dist/
```

Deploys to GitHub Pages automatically on every push to `master`
(`.github/workflows/deploy.yml`).

## Sources

Falcon User's Guide (SpaceX, 2021), spacex.com/vehicles/falcon-9,
Wikipedia (Falcon 9 Block 5, Merlin), and the references listed per part
inside the app. Made by MuhammadYusuf with Claude.

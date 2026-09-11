import type { System } from '../types'

export const SYSTEMS: System[] = [
  {
    id: 'airframe',
    name: { en: 'Airframe', uz: 'Korpus' },
    color: '#9aa4b1',
    description: {
      en: 'Load-bearing structures that hold the rocket together: the interstage, the octaweb thrust structure, skirts and stage adapters. They carry thrust from the engines up to the payload and resist bending loads in flight.',
      uz: "Raketani bir butun tutib turuvchi yuk ko'taruvchi tuzilmalar: interstage, oktaveb tortish tuzilmasi, etaklar va bosqich adapterlari. Ular dvigatel tortishini yuqoriga — foydali yukka uzatadi va parvozda egilish yuklariga bardosh beradi.",
    },
  },
  {
    id: 'tanks',
    name: { en: 'Propellant tanks', uz: "Yoqilg'i baklari" },
    color: '#c9ced6',
    description: {
      en: 'Aluminium-lithium tanks that hold liquid oxygen and RP-1 kerosene. On Falcon 9 the tank walls are the primary structure of each stage, so they are both container and airframe.',
      uz: "Suyuq kislorod va RP-1 kerosinni saqlovchi alyuminiy-litiy baklar. Falcon 9'da bak devorlari har bir bosqichning asosiy tuzilmasi hisoblanadi — ular ham idish, ham korpus.",
    },
  },
  {
    id: 'propulsion',
    name: { en: 'Propulsion', uz: 'Dvigatellar' },
    color: '#d98b5f',
    description: {
      en: 'The Merlin 1D engines that generate thrust. Nine sea-level Merlins power the first stage; a single vacuum-optimised Merlin powers the second stage.',
      uz: "Tortish kuchini hosil qiluvchi Merlin 1D dvigatellari. Birinchi bosqichni to'qqizta dengiz sathi Merlin harakatlantiradi; ikkinchi bosqichni bitta vakuumga moslashtirilgan Merlin.",
    },
  },
  {
    id: 'recovery',
    name: { en: 'Recovery', uz: 'Qaytarish' },
    color: '#6fa3c7',
    description: {
      en: 'Hardware that brings the first stage back: grid fins for steering during descent and landing legs for touchdown.',
      uz: "Birinchi bosqichni qaytarib olib keluvchi uskunalar: tushishda boshqarish uchun panjarali qanotlar va qo'nish uchun oyoqlar.",
    },
  },
  {
    id: 'payload',
    name: { en: 'Payload', uz: 'Foydali yuk' },
    color: '#e0c98a',
    description: {
      en: 'The fairing that protects the satellite through the atmosphere, and the adapter that mounts it to the second stage.',
      uz: "Atmosferada sun'iy yo'ldoshni himoya qiluvchi obtekatel va uni ikkinchi bosqichga o'rnatuvchi adapter.",
    },
  },
  {
    id: 'avionics',
    name: { en: 'Avionics', uz: 'Avionika' },
    color: '#8fd1a8',
    description: {
      en: 'Flight computers, inertial measurement units, GPS receivers and radios that guide the vehicle and talk to the ground.',
      uz: "Raketani boshqaruvchi va yer bilan aloqa qiluvchi parvoz kompyuterlari, inertsial o'lchov bloklari, GPS qabul qilgichlari va radiolar.",
    },
  },
  {
    id: 'pressurization',
    name: { en: 'Pressurization', uz: 'Bosim tizimi' },
    color: '#b9a6dc',
    description: {
      en: 'Helium stored in carbon-overwrapped pressure vessels (COPVs) keeps the propellant tanks pressurised as they empty.',
      uz: "Uglerod bilan o'ralgan bosim idishlarida (COPV) saqlanadigan geliy baklar bo'shagan sari ularda bosimni saqlab turadi.",
    },
  },
  {
    id: 'plumbing',
    name: { en: 'Feed lines', uz: 'Quvurlar' },
    color: '#7fb7b3',
    description: {
      en: 'Propellant feed lines, manifolds and valves that deliver oxygen and kerosene from the tanks to the engines.',
      uz: "Kislorod va kerosinni baklardan dvigatellarga yetkazuvchi yoqilg'i quvurlari, kollektorlar va klapanlar.",
    },
  },
  {
    id: 'rcs',
    name: { en: 'Reaction control', uz: 'Reaktiv boshqaruv' },
    color: '#e39ab1',
    description: {
      en: 'Cold-gas nitrogen thrusters that orient the stages in space, where aerodynamic control surfaces are useless.',
      uz: "Aerodinamik boshqaruv sirtlari foydasiz bo'lgan kosmosda bosqichlarni yo'naltiruvchi sovuq gazli azot dvigatelchalari.",
    },
  },
  {
    id: 'separation',
    name: { en: 'Separation systems', uz: 'Ajratish tizimlari' },
    color: '#d6a56b',
    description: {
      en: 'Pneumatic pushers and latches that split the stages and open the fairing without pyrotechnics.',
      uz: "Bosqichlarni ajratuvchi va obtekatelni pirotexnikasiz ochuvchi pnevmatik iturgichlar va qulflar.",
    },
  },
]

export const SYSTEM_BY_ID = new Map(SYSTEMS.map((s) => [s.id, s]))

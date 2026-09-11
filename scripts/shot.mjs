#!/usr/bin/env node
/**
 * Headless screenshot helper for development and docs.
 *
 *   node scripts/shot.mjs out.png [--w 1280 --h 800] [--setup "JS run in page"] [--wait 1500]
 *
 * The page exposes `__atlas` (store) and `__scene` (RocketScene) in dev mode,
 * so `--setup` can drive any state, e.g.
 *   --setup "__atlas.getState().setExplode(1)"
 */
import puppeteer from 'puppeteer-core'

const args = process.argv.slice(2)
const out = args[0] ?? 'shot.png'
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : def
}
const width = +opt('w', 1280),
  height = +opt('h', 800)
const setup = opt('setup', '')
const wait = +opt('wait', 1500)
const url = opt('url', 'http://localhost:3017/')
const theme = opt('theme', '')
const lang = opt('lang', '')

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--hide-scrollbars'],
})
try {
  const page = await browser.newPage()
  await page.setViewport({ width, height, deviceScaleFactor: 1 })
  page.on('pageerror', (e) => console.error('[page error]', e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') console.error('[console]', m.text())
  })
  await page.evaluateOnNewDocument((theme, lang) => {
    if (theme) localStorage.setItem('fa:theme', theme)
    if (lang) localStorage.setItem('fa:lang', lang)
  }, theme, lang)
  await page.goto(url, { waitUntil: 'networkidle0' })
  await page.waitForFunction(() => window.__atlas && window.__atlas.getState().progress >= 100, { timeout: 60000 })
  if (setup) await page.evaluate(setup)
  await new Promise((r) => setTimeout(r, wait))
  // Headless compositing drops on-demand frames; keep the scene rendering while we capture.
  await page.evaluate(() => (window.__keep = setInterval(() => (window.__scene.dirty = true), 16)))
  await new Promise((r) => setTimeout(r, 300))
  await page.screenshot({ path: out })
  console.log('saved', out)
} finally {
  await browser.close()
}

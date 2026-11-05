/**
 * 桌面版冒烟测试：通过 WebView2 远程调试端口连接 Tauri 窗口。
 *
 * 用法：
 *   1. 带调试端口启动应用：
 *      WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS="--remote-debugging-port=9222" \
 *        "./src-tauri/target/release/blurt.exe"
 *   2. node scripts/qa-desktop.mjs
 *
 * 只做读操作，不点原生保存对话框。
 */
import { chromium } from 'playwright'

const endpoint = process.env.CDP_ENDPOINT ?? 'http://127.0.0.1:9222'
const shot = process.env.QA_SHOT ?? 'desktop-qa.png'
const routes = [
  '/',
  '/drill',
  '/typing',
  '/story',
  '/story/standup',
  '/scenario',
  '/dialogue/01-daily-standup',
  '/listen',
  '/library',
  '/library/01-daily-standup',
  '/words',
  '/career',
  '/stats',
  '/settings',
]

const browser = await chromium.connectOverCDP(endpoint)
const pages = browser.contexts().flatMap((context) => context.pages())
const page = pages.find((item) => item.url().includes('tauri.localhost')) ?? pages[0]
if (!page) throw new Error('没有找到 Tauri 窗口页面')

const consoleErrors = []
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text())
})
page.on('pageerror', (error) => consoleErrors.push(String(error)))

await page.waitForLoadState('domcontentloaded')
await page.waitForTimeout(1200)

const home = await page.evaluate(() => ({
  url: location.href,
  title: document.title,
  tauri: '__TAURI_INTERNALS__' in window,
  text: document.body.innerText.slice(0, 80).replace(/\n+/g, ' '),
}))

const results = []
for (const route of routes) {
  await page.evaluate((hash) => {
    location.hash = `#${hash}`
  }, route)
  await page.waitForTimeout(450)
  results.push(
    await page.evaluate((route) => ({
      route,
      hash: location.hash,
      empty: document.body.innerText.trim().length < 20,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      heading: document.body.innerText.slice(0, 50).replace(/\n+/g, ' '),
    }), route),
  )
}

await page.evaluate(() => {
  location.hash = '#/settings'
})
await page.waitForTimeout(600)
const switches = await page.evaluate(() =>
  [...document.querySelectorAll('[role="switch"]')].map((element) => {
    const box = element.getBoundingClientRect()
    const knob = element.firstElementChild?.getBoundingClientRect()
    return {
      label: element.getAttribute('aria-label'),
      checked: element.getAttribute('aria-checked'),
      inside:
        !!knob &&
        knob.left >= box.left &&
        knob.right <= box.right &&
        knob.top >= box.top &&
        knob.bottom <= box.bottom,
    }
  }),
)

await page.screenshot({ path: shot })
console.log(JSON.stringify({ home, results, switches, consoleErrors }, null, 2))
process.exit(consoleErrors.length ? 1 : 0)

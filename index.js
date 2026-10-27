/**
 * dsh-aliyun-coupon — Host half.
 *
 * Serves a small JSON API that performs a LIVE scrape of the Aliyun billing
 * console with a real (headless) Chromium browser. No model tokens are ever
 * involved: the Client page simply fetches these routes whenever the user opens
 * or refreshes it.
 *
 * Design notes for portability (see README):
 *  - No machine-specific paths: the browser is discovered per platform.
 *  - No bundled credentials: the account and password are supplied once by the
 *    user in the panel and stored through the DSH `credentials` service.
 *  - No hard dependency on optional services: every `ctx.get()` is guarded, so
 *    the plugin still loads on older or newer Harness builds.
 */
import { spawn } from 'node:child_process'
import net from 'node:net'
import crypto from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { delimiter, join } from 'node:path'
import { homedir } from 'node:os'
import { setTimeout as sleep } from 'node:timers/promises'

const API_PREFIX = '/api/dsh-aliyun-coupon'
const ROUTE_BALANCE = API_PREFIX + '/balance'
const ROUTE_SETUP = API_PREFIX + '/setup'
const ROUTE_DIAG = API_PREFIX + '/diag'
const PLUGIN_VERSION = 10

const COUPON_URL = 'https://billing-cost.console.aliyun.com/coupons/coupon'
// Since late 2025 the credential form is rendered inside a passport.aliyun.com
// iframe owned by this page, so we must load the outer page and fill the iframe.
const LOGIN_URL =
  'https://account.aliyun.com/login/login.htm?oauth_callback=' +
  encodeURIComponent(COUPON_URL) + '&clearRedirectCookie=1&lang=zh'

// Credential refs. Nothing secret lives in this source file: the values come
// from the DSH credential service (profile store first, then the ambient
// environment), which is exactly what the `credentials` service exists for.
const CRED_ACCOUNT = 'ALIYUN_CONSOLE_ACCOUNT'
const CRED_PASSWORD = 'ALIYUN_CONSOLE_PASSWORD'
const LEGACY_ACCOUNT = 'DSH_ALIYUN_ACCOUNT'
const LEGACY_PASSWORD = 'DSH_ALIYUN_PASSWORD'

const IS_WIN = process.platform === 'win32'
const IS_MAC = process.platform === 'darwin'

/* ------------------------------------------------------------------ */
/* Minimal RFC 6455 client (no dependency; Electron main may lack ws)   */
/* ------------------------------------------------------------------ */

function encodeFrame(payload, opcode = 0x1) {
  const data = Buffer.isBuffer(payload) ? payload : Buffer.from(String(payload), 'utf8')
  const len = data.length
  const mask = crypto.randomBytes(4)
  let header
  if (len < 126) {
    header = Buffer.alloc(6)
    header[0] = 0x80 | opcode
    header[1] = 0x80 | len
    mask.copy(header, 2)
  } else if (len < 65536) {
    header = Buffer.alloc(8)
    header[0] = 0x80 | opcode
    header[1] = 0x80 | 126
    header.writeUInt16BE(len, 2)
    mask.copy(header, 4)
  } else {
    header = Buffer.alloc(14)
    header[0] = 0x80 | opcode
    header[1] = 0x80 | 127
    header.writeBigUInt64BE(BigInt(len), 2)
    mask.copy(header, 10)
  }
  const masked = Buffer.alloc(len)
  for (let i = 0; i < len; i += 1) masked[i] = data[i] ^ mask[i & 3]
  return Buffer.concat([header, masked])
}

function connectWebSocket(rawUrl, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const url = new URL(rawUrl)
    const key = crypto.randomBytes(16).toString('base64')
    const socket = net.connect({ host: url.hostname, port: Number(url.port || 80) })
    let handshaken = false
    let buf = Buffer.alloc(0)
    let fragments = []
    let closed = false
    const timer = setTimeout(() => {
      if (!handshaken) {
        try { socket.destroy() } catch { /* ignore */ }
        reject(new Error('WebSocket handshake timeout'))
      }
    }, timeoutMs)

    const api = {
      send(text) {
        if (closed) return
        try { socket.write(encodeFrame(text)) } catch { /* ignore */ }
      },
      close() {
        if (closed) return
        closed = true
        try { socket.end(encodeFrame(Buffer.alloc(0), 0x8)) } catch { /* ignore */ }
        try { socket.destroy() } catch { /* ignore */ }
      },
      onmessage: null,
      onclose: null,
    }

    socket.setNoDelay(true)

    socket.on('connect', () => {
      socket.write(
        `GET ${url.pathname}${url.search} HTTP/1.1\r\n` +
          `Host: ${url.host}\r\n` +
          'Upgrade: websocket\r\n' +
          'Connection: Upgrade\r\n' +
          `Sec-WebSocket-Key: ${key}\r\n` +
          'Sec-WebSocket-Version: 13\r\n\r\n',
      )
    })

    socket.on('error', (err) => {
      if (!handshaken) {
        clearTimeout(timer)
        reject(err)
      } else {
        closed = true
        if (api.onclose) api.onclose()
      }
    })

    socket.on('close', () => {
      closed = true
      if (api.onclose) api.onclose()
    })

    socket.on('data', (chunk) => {
      buf = Buffer.concat([buf, chunk])

      if (!handshaken) {
        const idx = buf.indexOf('\r\n\r\n')
        if (idx < 0) return
        const head = buf.subarray(0, idx).toString('latin1')
        if (!/^HTTP\/1\.[01] 101/.test(head)) {
          clearTimeout(timer)
          try { socket.destroy() } catch { /* ignore */ }
          reject(new Error(`WebSocket handshake rejected: ${head.split('\r\n')[0]}`))
          return
        }
        handshaken = true
        buf = buf.subarray(idx + 4)
        clearTimeout(timer)
        resolve(api)
      }

      for (;;) {
        if (buf.length < 2) return
        const b0 = buf[0]
        const b1 = buf[1]
        const fin = (b0 & 0x80) !== 0
        const opcode = b0 & 0x0f
        const masked = (b1 & 0x80) !== 0
        let len = b1 & 0x7f
        let off = 2
        if (len === 126) {
          if (buf.length < off + 2) return
          len = buf.readUInt16BE(off)
          off += 2
        } else if (len === 127) {
          if (buf.length < off + 8) return
          len = Number(buf.readBigUInt64BE(off))
          off += 8
        }
        let maskKey = null
        if (masked) {
          if (buf.length < off + 4) return
          maskKey = buf.subarray(off, off + 4)
          off += 4
        }
        if (buf.length < off + len) return
        let payload = buf.subarray(off, off + len)
        buf = buf.subarray(off + len)
        if (maskKey) {
          const unmasked = Buffer.alloc(len)
          for (let i = 0; i < len; i += 1) unmasked[i] = payload[i] ^ maskKey[i & 3]
          payload = unmasked
        }
        if (opcode === 0x9) {
          try { socket.write(encodeFrame(payload, 0xa)) } catch { /* ignore */ }
          continue
        }
        if (opcode === 0x8) {
          closed = true
          try { socket.end() } catch { /* ignore */ }
          if (api.onclose) api.onclose()
          return
        }
        if (opcode === 0x0 || opcode === 0x1) {
          fragments.push(Buffer.from(payload))
          if (fin) {
            const text = Buffer.concat(fragments).toString('utf8')
            fragments = []
            if (api.onmessage) api.onmessage(text)
          }
        }
      }
    })
  })
}

class Cdp {
  constructor(ws) {
    this.ws = ws
    this.seq = 0
    this.pending = new Map()
    // Every JavaScript world the page exposes. Aliyun hosts its password form
    // inside a cross-origin passport.aliyun.com iframe, so the main frame's
    // Runtime.evaluate cannot see the inputs; we have to address the frame that
    // actually owns them.
    this.contexts = new Map()
    ws.onmessage = (text) => {
      let msg
      try { msg = JSON.parse(text) } catch { return }
      if (msg && msg.id && this.pending.has(msg.id)) {
        const entry = this.pending.get(msg.id)
        this.pending.delete(msg.id)
        entry.resolve(msg)
        return
      }
      if (!msg || !msg.method) return
      if (msg.method === 'Runtime.executionContextCreated') {
        const context = msg.params && msg.params.context
        if (context && context.id) {
          this.contexts.set(context.id, {
            id: context.id,
            origin: context.origin || '',
            name: context.name || '',
            frameId: (context.auxData && context.auxData.frameId) || '',
            isDefault: Boolean(context.auxData && context.auxData.isDefault),
          })
        }
      } else if (msg.method === 'Runtime.executionContextDestroyed') {
        this.contexts.delete(msg.params && msg.params.executionContextId)
      } else if (msg.method === 'Runtime.executionContextsCleared') {
        this.contexts.clear()
      }
    }
    ws.onclose = () => {
      for (const entry of this.pending.values()) entry.reject(new Error('CDP socket closed'))
      this.pending.clear()
    }
  }

  send(method, params, timeoutMs = 45000) {
    const id = ++this.seq
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`CDP timeout: ${method}`))
      }, timeoutMs)
      this.pending.set(id, {
        resolve: (msg) => { clearTimeout(timer); resolve(msg) },
        reject: (err) => { clearTimeout(timer); reject(err) },
      })
      this.ws.send(JSON.stringify({ id, method, params: params || {} }))
    })
  }

  async evaluate(expression, contextId) {
    const params = {
      expression,
      returnByValue: true,
      awaitPromise: true,
    }
    if (contextId) params.contextId = contextId
    const msg = await this.send('Runtime.evaluate', params)
    const res = msg.result || {}
    if (res.exceptionDetails) {
      throw new Error(`page evaluate failed: ${res.exceptionDetails.text || 'unknown'}`)
    }
    return res.result ? res.result.value : undefined
  }

  /**
   * Evaluate in every known execution context and return the first non-empty
   * result. The coupon console itself lives in the top frame; the login form
   * lives in a nested passport iframe. Trying the top frame first keeps the
   * happy path single-shot.
   */
  async evaluateAnywhere(expression) {
    const order = [...this.contexts.values()]
    order.sort((a, b) => (a.isDefault && !b.isDefault ? -1 : !a.isDefault && b.isDefault ? 1 : 0))
    let lastError = null
    for (const context of order) {
      try {
        const value = await this.evaluate(expression, context.id)
        if (value !== undefined && value !== null && value !== '') return value
      } catch (err) {
        lastError = err
      }
    }
    if (lastError) throw lastError
    return undefined
  }

  close() {
    try { this.ws.close() } catch { /* ignore */ }
  }
}

/* ------------------------------------------------------------------ */
/* Locating a Chromium-family browser on any platform                  */
/* ------------------------------------------------------------------ */

function windowsCandidates() {
  const out = []
  const roots = [
    process.env['PROGRAMFILES'] || 'C:\\Program Files',
    process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)',
    process.env['LOCALAPPDATA'] || '',
  ].filter(Boolean)
  const relative = [
    'Microsoft\\Edge\\Application\\msedge.exe',
    'Google\\Chrome\\Application\\chrome.exe',
    'Google\\Chrome Beta\\Application\\chrome.exe',
    'Chromium\\Application\\chrome.exe',
    'BraveSoftware\\Brave-Browser\\Application\\brave.exe',
    'Vivaldi\\Application\\vivaldi.exe',
  ]
  for (const root of roots) {
    for (const rel of relative) out.push(join(root, rel))
  }
  return out
}

function macCandidates() {
  const apps = [
    'Google Chrome.app/Contents/MacOS/Google Chrome',
    'Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    'Brave Browser.app/Contents/MacOS/Brave Browser',
    'Chromium.app/Contents/MacOS/Chromium',
    'Vivaldi.app/Contents/MacOS/Vivaldi',
    'Arc.app/Contents/MacOS/Arc',
  ]
  const roots = ['/Applications', join(homedir(), 'Applications')]
  const out = []
  for (const root of roots) {
    for (const app of apps) out.push(join(root, app))
  }
  return out
}

const UNIX_BROWSER_NAMES = [
  'google-chrome',
  'google-chrome-stable',
  'chromium',
  'chromium-browser',
  'microsoft-edge',
  'microsoft-edge-stable',
  'brave-browser',
  'vivaldi-stable',
]

function unixCandidates() {
  const out = []
  const dirs = String(process.env.PATH || '').split(delimiter).filter(Boolean)
  for (const dir of dirs) {
    for (const name of UNIX_BROWSER_NAMES) out.push(join(dir, name))
  }
  // Flatpak / Snap / distro-specific installs that are not on PATH.
  for (const extra of [
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/snap/bin/chromium',
    '/var/lib/flatpak/exports/bin/com.google.Chrome',
    '/var/lib/flatpak/exports/bin/org.chromium.Chromium',
  ]) out.push(extra)
  return out
}

function platformCandidates() {
  if (IS_WIN) return windowsCandidates()
  if (IS_MAC) return macCandidates()
  return unixCandidates()
}

function findBrowser() {
  const override = process.env.DSH_ALIYUN_BROWSER
  if (override && existsSync(override)) return override
  for (const candidate of platformCandidates()) {
    try {
      if (candidate && existsSync(candidate)) return candidate
    } catch { /* ignore unreadable path */ }
  }
  return null
}

/* ------------------------------------------------------------------ */
/* Browser session                                                     */
/* ------------------------------------------------------------------ */

function dshHome() {
  return process.env.DSH_HOME || join(homedir(), '.dsh')
}

function storageDir() {
  return join(dshHome(), 'storages', 'aliyun-coupon')
}

function profileDir() {
  return join(storageDir(), 'browser-profile')
}

/**
 * Decide how Chromium should reach the network.
 *
 * The system proxy is not trustworthy here: a stale 127.0.0.1:port entry left
 * behind by a stopped VPN makes every request fail with
 * ERR_PROXY_CONNECTION_FAILED even though the direct route is fine. So the
 * default is direct; a proxy is used only when the user names one explicitly
 * (DSH_ALIYUN_PROXY=http://127.0.0.1:7890) or the system proxy is set AND its
 * endpoint actually accepts a TCP connection right now.
 */
async function proxyArgs() {
  const explicit = process.env.DSH_ALIYUN_PROXY
  if (explicit) return [`--proxy-server=${explicit}`]

  const raw =
    process.env.HTTPS_PROXY || process.env.https_proxy ||
    process.env.HTTP_PROXY || process.env.http_proxy
  if (raw) {
    try {
      const url = new URL(raw)
      const host = url.hostname
      const port = Number(url.port || (url.protocol === 'https:' ? 443 : 80))
      if (await tcpReachable(host, port)) return [`--proxy-server=${url.origin}`]
    } catch { /* malformed proxy value: go direct */ }
  }
  return ['--no-proxy-server', '--proxy-bypass-list=*']
}

function tcpReachable(host, port, timeoutMs = 700) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port })
    const done = (ok) => {
      try { socket.destroy() } catch { /* ignore */ }
      resolve(ok)
    }
    socket.setTimeout(timeoutMs)
    socket.once('connect', () => done(true))
    socket.once('timeout', () => done(false))
    socket.once('error', () => done(false))
  })
}

function platformArgs() {
  const args = []
  if (!IS_WIN && !IS_MAC) {
    args.push('--disable-dev-shm-usage')
    // Chromium refuses to start its sandbox as root in most containers; the
    // browser only ever loads one known console page here.
    try {
      if (typeof process.getuid === 'function' && process.getuid() === 0) args.push('--no-sandbox')
    } catch { /* ignore */ }
  }
  return args
}

async function probeVersion(port) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/json/version`, {
      signal: AbortSignal.timeout(2500),
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

class BrowserSession {
  constructor() {
    this.proc = null
    this.cdp = null
    this.port = 0
    this.lastUsed = 0
  }

  async ensure() {
    if (this.cdp) return this.cdp

    const dir = profileDir()
    mkdirSync(dir, { recursive: true })

    // Reuse a browser instance left behind by an earlier activation.
    const activePortFile = join(dir, 'DevToolsActivePort')
    if (existsSync(activePortFile)) {
      try {
        const port = Number.parseInt(readFileSync(activePortFile, 'utf8').split('\n')[0], 10)
        if (Number.isFinite(port) && port > 0 && (await probeVersion(port))) {
          this.port = port
          this.cdp = await this.attach(port)
          return this.cdp
        }
      } catch { /* fall through to a fresh launch */ }
    }

    const exe = findBrowser()
    if (!exe) {
      throw new Error(
        'NO_BROWSER: 未找到 Chrome / Edge / Chromium。请安装任一浏览器，或设置环境变量 DSH_ALIYUN_BROWSER 指向浏览器可执行文件。',
      )
    }

    try { rmSync(activePortFile, { force: true }) } catch { /* ignore */ }

    const extraArgs = await proxyArgs()
    this.proc = spawn(
      exe,
      [
        '--headless=new',
        '--remote-debugging-port=0',
        `--user-data-dir=${dir}`,
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-gpu',
        '--disable-features=Translate,msEdgeSidebarV2',
        ...platformArgs(),
        ...extraArgs,
        '--window-size=1400,900',
        '--lang=zh-CN',
        'about:blank',
      ],
      { stdio: 'ignore', windowsHide: true },
    )
    this.proc.on('exit', () => {
      this.proc = null
      this.cdp = null
      this.port = 0
    })
    this.proc.on('error', () => {
      this.proc = null
      this.cdp = null
      this.port = 0
    })

    let port = 0
    for (let i = 0; i < 120; i += 1) {
      await sleep(250)
      try {
        if (!existsSync(activePortFile)) continue
        const parsed = Number.parseInt(readFileSync(activePortFile, 'utf8').split('\n')[0], 10)
        if (!Number.isFinite(parsed) || parsed <= 0) continue
        if (await probeVersion(parsed)) {
          port = parsed
          break
        }
      } catch { /* keep polling */ }
    }
    if (!port) throw new Error('启动无头浏览器超时（BROWSER_LAUNCH_TIMEOUT）')

    this.port = port
    this.cdp = await this.attach(port)
    return this.cdp
  }

  async attach(port) {
    const res = await fetch(`http://127.0.0.1:${port}/json/list`, {
      signal: AbortSignal.timeout(4000),
    })
    const targets = await res.json()
    let page = targets.find((t) => t.type === 'page')
    if (!page) {
      const created = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, {
        method: 'PUT',
        signal: AbortSignal.timeout(4000),
      })
      page = await created.json()
    }
    const ws = await connectWebSocket(page.webSocketDebuggerUrl)
    const cdp = new Cdp(ws)
    await cdp.send('Page.enable')
    await cdp.send('Runtime.enable')
    return cdp
  }

  reset() {
    try { this.cdp && this.cdp.close() } catch { /* ignore */ }
    this.cdp = null
    try { this.proc && this.proc.kill() } catch { /* ignore */ }
    this.proc = null
    this.port = 0
  }

  dispose() {
    this.reset()
  }
}

/* Close the hidden browser after a few idle minutes so it never lingers in
   Task Manager / Activity Monitor; the profile directory keeps the Aliyun
   session for next time.

   Kept comfortably above the client's fastest auto-refresh interval on purpose:
   a scheduled tick then reuses the warm browser and its HTTP cache instead of
   paying for a cold start (process spawn + full asset download) every time. */
const IDLE_SHUTDOWN_MS = (function () {
  const override = Number(process.env.DSH_ALIYUN_IDLE_MS)
  return Number.isFinite(override) && override > 0 ? override : 12 * 60 * 1000
})()

/* ------------------------------------------------------------------ */
/* Scrape                                                              */
/* ------------------------------------------------------------------ */

const EXTRACT_SCRIPT = `(() => {
  const tables = Array.from(document.querySelectorAll('table'));
  let best = null;
  for (const table of tables) {
    const head = Array.from(table.querySelectorAll('thead tr')).map((tr) =>
      Array.from(tr.querySelectorAll('th,td')).map((cell) => (cell.innerText || '').trim()));
    const rows = Array.from(table.querySelectorAll('tbody tr')).map((tr) =>
      Array.from(tr.querySelectorAll('td,th')).map((cell) => (cell.innerText || '').trim()));
    const filled = rows.filter((row) => row.some((cell) => cell.length > 0));
    if (!best || filled.length > best.rows.length) best = { head, rows: filled };
  }
  return JSON.stringify({
    url: location.href,
    title: document.title,
    onLoginPage: /login|passport|signin/i.test(location.href),
    onErrorPage: /^chrome-error:|^about:neterror/.test(location.href),
    bodyText: document.body ? String(document.body.innerText || '').replace(/\\s+/g, ' ').slice(0, 300) : '',
    head: best ? best.head : [],
    rows: best ? best.rows : [],
  });
})()`

/**
 * Fill a login field.
 *
 * Returns '' when the field is not in this frame (so the caller can try the next
 * execution context) and the resulting value when it is. The native setter is
 * required: React/Aliyun's form ignores a plain `el.value = ...` assignment.
 */
function setFieldScript(selector, value) {
  return `(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return '';
    const desc = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value');
    el.focus();
    if (desc && desc.set) desc.set.call(el, ${JSON.stringify(value)});
    else el.value = ${JSON.stringify(value)};
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.blur();
    return el.value;
  })()`
}

/* Submit whatever login form the current frame holds. Returns '' when there is
   no form here so the caller can move on to the next frame. */
const SUBMIT_SCRIPT = `(() => {
  const selectors = [
    'button.fm-submit',
    'button[type=submit]',
    '.fm-button',
    '.login-submit',
    'button[class*="submit"]',
    'input[type=submit]',
  ];
  for (const selector of selectors) {
    const btn = document.querySelector(selector);
    if (btn && !btn.disabled) { btn.click(); return 'clicked:' + selector; }
  }
  const form = document.querySelector('form');
  if (form) { form.submit(); return 'submitted:form'; }
  return '';
})()`

/* Snapshot of the current frame: is this the password form, and is it filled?
 *
 * `#fm-login-checkcode` exists in the DOM even when no captcha is being asked
 * for, so a slider only counts when it is actually laid out on screen. */
const LOGIN_STATE_SCRIPT = `(() => {
  const id = document.querySelector('#fm-login-id');
  const pwd = document.querySelector('#fm-login-password');
  if (!id && !pwd) return '';
  const visible = (el) => {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    const style = window.getComputedStyle(el);
    return style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity || '1') > 0;
  };
  const slider = ['#nc_1_wrapper', '.nc-container', '.nc_scale', '#fm-login-checkcode']
    .map((selector) => document.querySelector(selector))
    .find(visible);
  return JSON.stringify({
    hasId: Boolean(id),
    hasPwd: Boolean(pwd),
    idLength: id ? String(id.value || '').length : 0,
    pwdLength: pwd ? String(pwd.value || '').length : 0,
    captcha: Boolean(slider),
    body: document.body ? String(document.body.innerText || '').replace(/\\s+/g, ' ').slice(0, 200) : '',
  });
})()`

function parseMoney(raw) {
  if (raw === null || raw === undefined) return null
  const cleaned = String(raw).replace(/[^\d.-]/g, '')
  if (!cleaned) return null
  const value = Number.parseFloat(cleaned)
  return Number.isFinite(value) ? value : null
}

/**
 * The coupon table's real column order (verified against the live console):
 * 0 所属账号 · 1 优惠券编号 · 2 适用账号 · 3 面值 · 4 余额 · 5 券类型 · 6 适用商品
 * 7 适用范围 · 8 状态 · 9 订单类型 · 10 订单时限 · 11 金额限制 · 12 仅限首购使用
 * 13 生效时间/失效时间 · 14 发券时间 · 15 备注 · 16 操作
 *
 * The fallback index keeps working if Aliyun reorders columns; the keyword scan
 * wins whenever a header matches.
 */
const COLUMNS = [
  ['owner', ['所属账号'], 0],
  ['no', ['优惠券编号', '券号', '编号'], 1],
  ['suitAccount', ['适用账号'], 2],
  ['amount', ['面值', '面额', '金额'], 3],
  ['remain', ['余额', '剩余'], 4],
  ['type', ['券类型', '类型'], 5],
  ['products', ['适用商品'], 6],
  ['scope', ['适用范围'], 7],
  ['status', ['状态'], 8],
  ['orderType', ['订单类型'], 9],
  ['orderLimit', ['订单时限'], 10],
  ['amountLimit', ['金额限制'], 11],
  ['firstBuy', ['仅限首购'], 12],
  ['period', ['生效时间', '失效时间'], 13],
  ['issuedAt', ['发券时间'], 14],
  ['remark', ['备注'], 15],
]

function columnIndex(head) {
  const index = {}
  for (const [key, keywords, fallback] of COLUMNS) {
    let found = -1
    for (let i = 0; i < head.length; i += 1) {
      const header = String(head[i] || '')
      if (keywords.some((kw) => header.includes(kw))) { found = i; break }
    }
    index[key] = found >= 0 ? found : fallback
  }
  return index
}

function cleanText(value) {
  return String(value === null || value === undefined ? '' : value)
    .replace(/\s+/g, ' ')
    .replace(/\s*\.\.\.\s*详细\s*$/, '')
    .replace(/\s*详细\s*$/, '')
    .trim()
}

function splitPeriod(text) {
  const parts = String(text || '').match(/\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}/g)
  if (!parts || parts.length === 0) return { start: '', end: '' }
  return { start: parts[0] || '', end: parts[1] || '' }
}

function mapCoupons(head, rows) {
  const idx = columnIndex(head || [])
  const coupons = []
  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 5) continue
    const pick = (key) => (idx[key] >= 0 ? row[idx[key]] : '')
    const amount = parseMoney(pick('amount'))
    const remain = parseMoney(pick('remain'))
    if (amount === null && remain === null) continue
    const period = splitPeriod(pick('period'))
    coupons.push({
      owner: cleanText(pick('owner')),
      no: cleanText(pick('no')),
      suitAccount: cleanText(pick('suitAccount')),
      amount,
      remain,
      type: cleanText(pick('type')),
      products: cleanText(pick('products')),
      scope: cleanText(pick('scope')),
      status: cleanText(pick('status')),
      orderType: cleanText(pick('orderType')),
      orderLimit: cleanText(pick('orderLimit')),
      amountLimit: cleanText(pick('amountLimit')),
      firstBuy: cleanText(pick('firstBuy')),
      start: period.start,
      end: period.end,
      issuedAt: cleanText(pick('issuedAt')),
      remark: cleanText(pick('remark')),
      raw: row.map(cleanText),
    })
  }
  return coupons
}

async function readPage(cdp) {
  const text = await cdp.evaluate(EXTRACT_SCRIPT)
  try {
    return JSON.parse(text)
  } catch {
    return { url: '', title: '', onLoginPage: false, head: [], rows: [] }
  }
}

async function waitForRows(cdp, deadline) {
  let snapshot = null
  while (Date.now() < deadline) {
    snapshot = await readPage(cdp)
    if (snapshot.onLoginPage) return snapshot
    if (snapshot.onErrorPage) return snapshot
    if (snapshot.rows && snapshot.rows.length > 0) return snapshot
    await sleep(700)
  }
  return snapshot
}

/**
 * Resolve the console account/password.
 *
 * Order is the one the credential service documents: the provider-managed store
 * first, then ambient fallbacks (process env). Nothing is bundled: an
 * unconfigured install reports `needSetup` and the panel asks the user once.
 */
async function resolveConsoleCredentials(ctx) {
  const credentials = ctx && typeof ctx.get === 'function' ? ctx.get('credentials') : undefined

  const pick = async (ref, legacy) => {
    if (credentials) {
      // Current ref first, then the pre-1.0 ref, so an upgrade keeps the account
      // the user already configured instead of asking for it again.
      for (const name of [ref, legacy]) {
        try {
          const resolved = await credentials.resolve(name)
          if (resolved && typeof resolved.value === 'string' && resolved.value) return resolved.value
        } catch { /* store unavailable: fall back to ambient */ }
      }
    }
    return process.env[ref] || process.env[legacy] || ''
  }

  return {
    account: await pick(CRED_ACCOUNT, LEGACY_ACCOUNT),
    password: await pick(CRED_PASSWORD, LEGACY_PASSWORD),
    credentials,
  }
}

/**
 * Sign in to the Aliyun console.
 *
 * Since late 2025 account.aliyun.com renders the password form inside a
 * cross-origin passport.aliyun.com iframe, so `document.querySelector` in the
 * top frame finds nothing. We therefore poll every execution context the page
 * exposes until one owns #fm-login-id, fill it there, and submit from that same
 * frame. Returns 'ok', 'captcha' (Aliyun wants a human), or 'unknown'.
 */
async function signIn(cdp, account, password) {
  await cdp.send('Page.navigate', { url: LOGIN_URL })
  await sleep(4000)

  // Wait for the password iframe to mount (it is created by the outer page's JS).
  let frame = null
  const deadline = Date.now() + 15000
  while (Date.now() < deadline) {
    const state = await cdp.evaluateAnywhere(LOGIN_STATE_SCRIPT).catch(() => null)
    if (state) { frame = true; break }
    await sleep(500)
  }
  if (!frame) return 'unknown'

  await cdp.evaluateAnywhere(setFieldScript('#fm-login-id', account)).catch(() => null)
  await sleep(300)
  await cdp.evaluateAnywhere(setFieldScript('#fm-login-password', password)).catch(() => null)
  await sleep(400)

  let state = null
  try {
    const raw = await cdp.evaluateAnywhere(LOGIN_STATE_SCRIPT)
    if (typeof raw === 'string') state = JSON.parse(raw)
  } catch { /* treat as unknown */ }

  if (state && state.captcha) return 'captcha'
  if (!state || state.pwdLength === 0) return 'unknown'

  await cdp.evaluateAnywhere(SUBMIT_SCRIPT).catch(() => null)

  // Give Aliyun a moment to accept the credentials and set its cookies. A
  // successful sign-in navigates away from passport.*; a rejected one leaves the
  // form in place with the password cleared, and a slider challenge appears.
  for (let i = 0; i < 24; i += 1) {
    await sleep(1000)
    const where = await cdp.evaluate('location.href').catch(() => '')
    if (typeof where === 'string' && where && !/login|passport|signin/i.test(where)) return 'ok'
    const current = await cdp.evaluateAnywhere(LOGIN_STATE_SCRIPT).catch(() => null)
    if (typeof current === 'string' && current) {
      let parsed = null
      try { parsed = JSON.parse(current) } catch { /* ignore */ }
      if (parsed && parsed.captcha) return 'captcha'
      if (parsed && parsed.pwdLength === 0) return 'unknown'
    }
  }
  return 'unknown'
}

async function performScrape(session, creds) {
  const started = Date.now()
  const cdp = await session.ensure()

  const account = creds.account
  const password = creds.password

  await cdp.send('Page.navigate', { url: COUPON_URL })
  await sleep(3500)

  let snapshot = await waitForRows(cdp, Date.now() + 12000)
  let networkError = Boolean(snapshot && snapshot.onErrorPage)
  let loggedIn = !(snapshot && snapshot.onLoginPage) && !networkError
  let loginAttempted = false

  if (!networkError && (!loggedIn || !snapshot || !snapshot.rows || snapshot.rows.length === 0)) {
    loginAttempted = true
    const outcome = await signIn(cdp, account, password)
    if (outcome === 'captcha') {
      return {
        ok: false,
        loggedIn: false,
        loginAttempted,
        captcha: true,
        fetchedAt: new Date().toISOString(),
        elapsedMs: Date.now() - started,
        account,
        sourceUrl: COUPON_URL,
        pageUrl: snapshot && snapshot.url ? snapshot.url : LOGIN_URL,
        pageTitle: snapshot && snapshot.title ? snapshot.title : '',
        headers: [],
        coupons: [],
        primary: null,
        total: { amount: 0, remain: 0, used: 0, percent: 0 },
        error: '阿里云要求滑块/短信验证，无法在后台自动完成。请在浏览器中手动登录一次，之后登录态会被保存。',
      }
    }

    await cdp.send('Page.navigate', { url: COUPON_URL })
    await sleep(3000)
    snapshot = await waitForRows(cdp, Date.now() + 22000)
    networkError = Boolean(snapshot && snapshot.onErrorPage)
    loggedIn = !(snapshot && snapshot.onLoginPage) && !networkError
  }

  if (!snapshot) snapshot = { url: '', title: '', onLoginPage: false, onErrorPage: false, head: [], rows: [] }

  const coupons = mapCoupons(snapshot.head || [], snapshot.rows || [])
  const totals = coupons.reduce(
    (acc, coupon) => {
      if (coupon.amount !== null) acc.amount += coupon.amount
      if (coupon.remain !== null) acc.remain += coupon.remain
      return acc
    },
    { amount: 0, remain: 0 },
  )
  const primary =
    coupons.find((coupon) => /云工开物/.test(coupon.remark || '')) || coupons[0] || null

  return {
    ok: coupons.length > 0,
    loggedIn,
    loginAttempted,
    fetchedAt: new Date().toISOString(),
    elapsedMs: Date.now() - started,
    account,
    sourceUrl: COUPON_URL,
    pageUrl: snapshot.url || '',
    pageTitle: snapshot.title || '',
    headers: snapshot.head || [],
    coupons,
    primary,
    total: {
      amount: Number(totals.amount.toFixed(2)),
      remain: Number(totals.remain.toFixed(2)),
      used: Number((totals.amount - totals.remain).toFixed(2)),
      percent:
        totals.amount > 0
          ? Number((((totals.amount - totals.remain) / totals.amount) * 100).toFixed(2))
          : 0,
    },
    error: coupons.length > 0
      ? null
      : networkError
        ? `浏览器无法联网：${snapshot.bodyText || snapshot.url}`
        : loggedIn
          ? '未在页面上找到代金券记录'
          : '登录态失效或账号密码有误，请在插件面板重新填写',
  }
}

/* ------------------------------------------------------------------ */
/* Plugin                                                              */
/* ------------------------------------------------------------------ */

function readBody(req, limit = 8192) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > limit) {
        reject(new Error('request body too large'))
        try { req.destroy() } catch { /* ignore */ }
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

/**
 * Reuse DSH's own browser authentication when the build exposes it.
 *
 * `connection.admit` is the same check the shipped plugins apply to their own
 * routes: it validates the signed browser cookie and the live Peer. On builds
 * without that service (older or future clients) we fall back to the previous
 * behaviour instead of failing closed, so the plugin keeps working everywhere.
 */
function authorize(ctx, req) {
  if (process.env.DSH_ALIYUN_COUPON_REQUIRE_AUTH === '0') return { ok: true, mode: 'disabled' }
  let connection
  try {
    connection = ctx.get('connection')
  } catch {
    connection = undefined
  }
  if (!connection || typeof connection.admit !== 'function') return { ok: true, mode: 'legacy' }
  try {
    const admission = connection.admit(req)
    if (admission && typeof admission === 'object') {
      if ('peer' in admission && admission.peer) return { ok: true, mode: 'peer' }
      if ('rejection' in admission) return { ok: false, status: admission.rejection === 403 ? 403 : 401 }
    }
    return { ok: false, status: 401 }
  } catch {
    return { ok: false, status: 403 }
  }
}

export function apply(ctx) {
  const session = new BrowserSession()
  let inflight = null
  let cached = null
  let cachedAt = 0
  let idleTimer = null
  const CACHE_MS = 4000
  /* Even an explicit `?refresh=1` is rate limited. The client refreshes on a timer
     and the refresh button can be hit twice in a row; neither should turn into a
     burst of headless-browser runs against Aliyun. */
  const MIN_REFRESH_MS = 30 * 1000

  // Last successful reading, persisted so a transient network wobble shows the
  // previous number (clearly marked stale) instead of an empty error card.
  const lastGoodFile = join(storageDir(), 'last-good.json')
  const readLastGood = () => {
    try {
      const raw = readFileSync(lastGoodFile, 'utf8')
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' ? parsed : null
    } catch {
      return null
    }
  }
  const writeLastGood = (payload) => {
    try {
      mkdirSync(storageDir(), { recursive: true })
      writeFileSync(lastGoodFile, JSON.stringify(payload), 'utf8')
    } catch { /* non fatal */ }
  }

  const armIdleShutdown = () => {
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = setTimeout(() => {
      idleTimer = null
      if (inflight) return
      session.reset()
    }, IDLE_SHUTDOWN_MS)
    if (idleTimer.unref) idleTimer.unref()
  }

  const scrape = async (force) => {
    // Share an in-flight run first, then apply the rate limit: a forced refresh
    // younger than MIN_REFRESH_MS is answered from the cached reading instead of
    // launching the browser again.
    if (inflight) return inflight
    if (cached && Date.now() - cachedAt < (force ? MIN_REFRESH_MS : CACHE_MS)) return cached
    if (idleTimer) { clearTimeout(idleTimer); idleTimer = null }
    inflight = (async () => {
      try {
        const creds = await resolveConsoleCredentials(ctx)
        if (!creds.account || !creds.password) {
          return {
            ok: false,
            needSetup: true,
            loggedIn: false,
            fetchedAt: new Date().toISOString(),
            elapsedMs: 0,
            error: '尚未配置阿里云账号',
            coupons: [],
            total: { amount: 0, remain: 0, used: 0, percent: 0 },
          }
        }
        const result = await performScrape(session, creds)
        cached = result
        cachedAt = Date.now()
        if (result.ok) writeLastGood(result)
        return result
      } catch (err) {
        session.reset()
        const message = err && err.message ? err.message : String(err)
        return {
          ok: false,
          loggedIn: false,
          fetchedAt: new Date().toISOString(),
          elapsedMs: 0,
          error: message,
          noBrowser: message.startsWith('NO_BROWSER'),
          coupons: [],
          total: { amount: 0, remain: 0, used: 0, percent: 0 },
        }
      } finally {
        inflight = null
        armIdleShutdown()
      }
    })()
    return inflight
  }

  const sendJson = (res, status, payload) => {
    const body = JSON.stringify(payload)
    res.writeHead(status, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'content-length': Buffer.byteLength(body),
    })
    res.end(body)
  }

  // Optional services are read through this guard so an absent one degrades the
  // feature instead of throwing inside a request handler.
  const service = (name) => {
    try {
      return ctx.get(name) || null
    } catch {
      return null
    }
  }

  const handleSetupGet = async (res) => {
    const credentials = service('credentials')
    let configured = false
    let account = ''
    let writable = false
    try {
      if (credentials) {
        const info = await credentials.describe(CRED_PASSWORD)
        configured = Boolean(info && info.configured)
        writable = Boolean(info && info.writable)
        const resolved = await credentials.resolve(CRED_ACCOUNT)
        if (resolved && resolved.value) account = resolved.value
      }
    } catch { /* treat as unconfigured */ }
    if (!configured) {
      configured = Boolean(process.env[CRED_PASSWORD] || process.env[LEGACY_PASSWORD])
      if (!account) account = process.env[CRED_ACCOUNT] || process.env[LEGACY_ACCOUNT] || ''
    }
    sendJson(res, 200, { ok: true, configured, account, writable, version: PLUGIN_VERSION })
  }

  const handleSetupPost = async (req, res) => {
    let body
    try {
      body = JSON.parse(await readBody(req))
    } catch {
      sendJson(res, 400, { ok: false, error: '请求格式错误' })
      return
    }
    const account = String((body && body.account) || '').trim()
    const password = String((body && body.password) || '')
    if (!account || !password) {
      sendJson(res, 400, { ok: false, error: '账号和密码都不能为空' })
      return
    }
    const credentials = service('credentials')
    if (!credentials) {
      sendJson(res, 501, {
        ok: false,
        error: '当前客户端未提供 credentials 服务，请改用环境变量 ALIYUN_CONSOLE_ACCOUNT / ALIYUN_CONSOLE_PASSWORD',
      })
      return
    }
    try {
      await credentials.set(CRED_ACCOUNT, account)
      await credentials.set(CRED_PASSWORD, password)
    } catch (err) {
      sendJson(res, 500, { ok: false, error: (err && err.message) || String(err) })
      return
    }
    cached = null
    cachedAt = 0
    sendJson(res, 200, { ok: true, account })
  }

  const handleSetupDelete = async (res) => {
    const credentials = service('credentials')
    try {
      if (credentials) {
        await credentials.unset(CRED_PASSWORD)
        await credentials.unset(CRED_ACCOUNT)
      }
    } catch { /* ignore */ }
    cached = null
    cachedAt = 0
    sendJson(res, 200, { ok: true })
  }

  const handler = async (req, res) => {
    let path = API_PREFIX
    let query = new URLSearchParams()
    try {
      const parsed = new URL(req.url || API_PREFIX, 'http://127.0.0.1')
      path = parsed.pathname.replace(/\/+$/, '')
      query = parsed.searchParams
    } catch { /* keep defaults */ }

    const auth = authorize(ctx, req)
    if (!auth.ok) {
      sendJson(res, auth.status || 401, { ok: false, error: '未授权：请通过 DSH 界面访问' })
      return
    }

    try {
      if (path === ROUTE_DIAG) {
        const exe = findBrowser()
        sendJson(res, 200, {
          ok: true,
          version: PLUGIN_VERSION,
          platform: process.platform,
          arch: process.arch,
          browser: exe || null,
          storage: storageDir(),
          auth: auth.mode,
          node: process.version,
          capabilities: capabilities(),
        })
        return
      }

      if (path === ROUTE_SETUP) {
        if (req.method === 'GET') { await handleSetupGet(res); return }
        if (req.method === 'POST') { await handleSetupPost(req, res); return }
        if (req.method === 'DELETE') { await handleSetupDelete(res); return }
        sendJson(res, 405, { ok: false, error: 'method not allowed' })
        return
      }

      if (path === ROUTE_BALANCE) {
        let force = true
        try {
          force = query.get('refresh') !== '0'
        } catch { /* ignore */ }
        let payload
        try {
          payload = await scrape(force)
        } catch (err) {
          payload = { ok: false, error: err && err.message ? err.message : String(err) }
        }
        // A failed refresh keeps the last good reading visible, flagged as
        // stale, so the panel degrades instead of going blank.
        if (!payload.ok && !payload.needSetup) {
          const previous = readLastGood()
          if (previous && previous.primary) {
            payload = {
              ...previous,
              ok: false,
              stale: true,
              staleAt: previous.fetchedAt || null,
              error: payload.error || '实时抓取失败',
              fetchedAt: payload.fetchedAt || new Date().toISOString(),
            }
          }
        }
        sendJson(res, 200, payload)
        return
      }

      sendJson(res, 404, { ok: false, error: 'not found' })
    } catch (err) {
      sendJson(res, 500, { ok: false, error: (err && err.message) || String(err) })
    }
  }

  // Service activation order is not guaranteed: this plugin's apply() can run before
  // the webServer fiber activates, and reading it once would silently skip the routes
  // (the UI then fetches /api/... and gets 404). Register lazily instead, so the routes
  // are wired whenever the service (re)appears.
  //
  // The service key itself is a composition-level name, so a future Harness could
  // expose the HTTP carrier under a different one. We try the known names in order
  // and keep a slow poll as the last resort, so the API still comes up.
  const HTTP_SERVICE_NAMES = ['webServer', 'web-server', 'httpServer', 'server']

  const findHttpService = (scope) => {
    for (const name of HTTP_SERVICE_NAMES) {
      let candidate
      try {
        candidate = scope && typeof scope.get === 'function' ? scope.get(name) : null
      } catch {
        candidate = null
      }
      if (candidate && typeof candidate.register === 'function') return { name, service: candidate }
    }
    return null
  }

  let routesBound = false
  let httpServiceName = null
  const registerRoutes = (scope) => {
    if (routesBound) return
    const found = findHttpService(scope)
    if (!found) return
    routesBound = true
    httpServiceName = found.name
    scope.effect(
      () => found.service.register({ kind: 'prefix', path: API_PREFIX, handler }),
      'dsh-aliyun-coupon: routes',
    )
  }

  // Which optional capabilities this build actually exposes. Reported by /diag so a
  // support request can tell "service missing in this Harness" apart from
  // "service present but the plugin failed" without guessing.
  const capabilities = () => ({
    httpService: httpServiceName,
    httpServiceCandidates: HTTP_SERVICE_NAMES,
    routesBound,
    credentials: Boolean(service('credentials')),
    connection: Boolean(service('connection')),
    locale: Boolean(service('locale')),
    browser: Boolean(findBrowser()),
  })

  if (typeof ctx.inject === 'function') {
    // `inject` only resolves for the first name; the others are probed directly
    // and, failing that, by the poll below.
    ctx.inject(['webServer'], (scoped) => registerRoutes(scoped || ctx))
  }
  registerRoutes(ctx)

  // Last-resort probe for builds where none of the names above is injectable.
  const routePoll = setInterval(() => {
    if (routesBound) {
      clearInterval(routePoll)
      return
    }
    try {
      registerRoutes(ctx)
    } catch { /* keep polling */ }
    if (routesBound) clearInterval(routePoll)
  }, 2000)
  if (routePoll.unref) routePoll.unref()
  ctx.effect(() => () => clearInterval(routePoll), 'dsh-aliyun-coupon: route poll')

  ctx.effect(() => () => {
    if (idleTimer) { clearTimeout(idleTimer); idleTimer = null }
    session.dispose()
  }, 'dsh-aliyun-coupon: browser session')

  // Touch a marker file so the storage directory exists before the first refresh.
  try {
    mkdirSync(storageDir(), { recursive: true })
    writeFileSync(
      join(storageDir(), 'plugin.json'),
      JSON.stringify({ route: API_PREFIX, version: PLUGIN_VERSION }, null, 2),
    )
  } catch { /* non fatal */ }
}

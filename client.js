window.__ModuleLoader__.load({
  id: 'dsh-aliyun-coupon',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'aliyun-coupon';
    const API = '/api/dsh-aliyun-coupon';
    const ROUTE_BALANCE = API + '/balance';
    const ROUTE_SETUP = API + '/setup';
    const FOOTER_ID = 'dsh-aliyun-coupon';
    const OVERLAY_ID = 'dsh-aliyun-coupon-panel';

    /* ------------------------------------------------------------------ */
    /* cross-version compatibility                                          */
    /* ------------------------------------------------------------------ */

    /* The shell's slot names are a composition-level contract, not a public
       API: a future Harness release may rename or retire one. We therefore
       declare a preference chain and take the first seat that actually exists,
       instead of hard-coding a single name that would silently stop rendering.
       Order matters — the first entry is today's native seat. */
    const FOOTER_SLOTS = [
      'sidebar.footer.action',
      'sidebar.footer',
      'sidebar.actions',
      'sidebar.bottom',
    ];
    const OVERLAY_SLOTS = [
      'shell.overlay',
      'shell.overlays',
      'root.overlay',
    ];

    /* React is supplied by the host shell. `useSyncExternalStore` only exists
       from React 18 on, so older bundles get a small subscription shim. */
    const useStore = (function () {
      if (typeof React.useSyncExternalStore === 'function') {
        return function (subscribe, getSnapshot) {
          return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
        };
      }
      return function (subscribe, getSnapshot) {
        const pair = React.useState(function () { return getSnapshot(); });
        const value = pair[0];
        const setValue = pair[1];
        React.useEffect(function () {
          return subscribe(function () { setValue(getSnapshot()); });
        }, [subscribe, getSnapshot]);
        return value;
      };
    })();

    /* `styles` is a host builtin in current builds. When it is absent we fall
       back to a plain <style> tag, cleaned up with the plugin's effect. */
    function insertStyles(css) {
      if (typeof styles !== 'undefined' && styles && typeof styles.insert === 'function') {
        try { return styles.insert(css); } catch (_) { /* fall through */ }
      }
      const el = document.createElement('style');
      el.setAttribute('data-dsh-aliyun-coupon', '');
      el.textContent = css;
      document.head.appendChild(el);
      return function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      };
    }

    /* Last-resort renderer: if the shell exposes no overlay seat at all, we own
       a detached container and mount the very same component tree into it. */
    function resolveReactDom() {
      try {
        const c = require('react-dom/client');
        if (c && typeof c.createRoot === 'function') return { createRoot: c.createRoot };
      } catch (_) { /* older bundle */ }
      try {
        const rd = require('react-dom');
        if (rd && typeof rd.createRoot === 'function') return { createRoot: rd.createRoot };
        if (rd && typeof rd.render === 'function') return { render: rd.render };
      } catch (_) { /* no react-dom */ }
      return null;
    }

    function mountDetached(Component, props) {
      const dom = resolveReactDom();
      if (!dom) return function () {};
      const host = document.createElement('div');
      host.setAttribute('data-dsh-aliyun-coupon-host', '');
      document.body.appendChild(host);
      let root = null;
      if (dom.createRoot) {
        root = dom.createRoot(host);
        root.render(h(Component, props));
      } else {
        dom.render(h(Component, props), host);
      }
      return function () {
        try {
          if (root && typeof root.unmount === 'function') root.unmount();
          else if (dom.render) dom.render(null, host);
        } catch (_) { /* already gone */ }
        if (host.parentNode) host.parentNode.removeChild(host);
      };
    }

    /* ------------------------------------------------------------------ */
    /* i18n — resolved from the document language, no extra service needed */
    /* ------------------------------------------------------------------ */

    const DICT = {
      zh: {
        'footer.label': '云工开物代金券',
        'footer.aria': '查看阿里云云工开物学生代金券余额',
        'panel.title': '云工开物学生代金券',
        'panel.subtitle': '阿里云 · 实时余额',
        'panel.refresh': '刷新',
        'panel.refreshing': '正在抓取…',
        'panel.close': '关闭',
        'panel.balance': '可用余额',
        'panel.faceValue': '代金券面值',
        'panel.used': '已抵扣',
        'panel.account': '所属账号',
        'panel.couponNo': '代金券编号',
        'panel.type': '券类型',
        'panel.scope': '适用范围',
        'panel.status': '状态',
        'panel.amountLimit': '金额限制',
        'panel.validity': '生效 / 失效',
        'panel.issuedAt': '发券时间',
        'panel.remark': '备注',
        'panel.details': '代金券明细',
        'panel.source': '数据来源',
        'panel.openConsole': '打开阿里云控制台',
        'panel.updatedAt': '更新于',
        'panel.elapsed': '耗时',
        'panel.live': '实时联网抓取 · 不消耗 Token',
        'panel.error': '抓取失败',
        'panel.retry': '重试',
        'panel.empty': '暂无代金券记录',
        'panel.loading': '正在打开阿里云费用与成本控制台…',
        'panel.loadingHint': '首次抓取需启动无头浏览器并登录，约 15–25 秒',
        'panel.usedPercent': '已使用 {p}%',
        'panel.couponCount': '另有 {n} 张代金券',
        'panel.showAll': '展开全部明细',
        'panel.hideAll': '收起明细',
        'panel.stale': '缓存值',
        'panel.staleHint': '本次实时抓取失败，显示上次成功结果',
        'panel.cached': '上次结果',
        'panel.cachedHint': '正在联网刷新，先显示上次成功读取的数值',
        'auto.label': '自动刷新',
        'auto.off': '关闭',
        'auto.every': '每 {n} 分钟',
        'auto.next': '{n} 分钟后刷新',
        'auto.due': '即将刷新',
        'auto.hint': '拖动滑块设定间隔：1 到 30 分钟。DSH 打开期间会按这个间隔自动联网重读余额，侧边栏的数字也跟着更新；浏览器保持热启动、重复抓取复用本地缓存，所以间隔越长越省流量。',
        'auto.toggleHint': '打开或关闭自动刷新（关闭后滑块会变灰，但会记住当前间隔）。',
        'setup.title': '连接你的阿里云账号',
        'setup.desc': '插件会在本机启动一个无头浏览器，用你的账号登录阿里云费用与成本控制台并读取代金券余额。账号密码只保存在本机 DSH 凭据库，不会上传到任何服务器。',
        'setup.account': '阿里云账号',
        'setup.accountPlaceholder': '手机号 / 邮箱 / 会员名',
        'setup.password': '登录密码',
        'setup.passwordPlaceholder': '阿里云登录密码',
        'setup.save': '保存并读取',
        'setup.saving': '正在保存…',
        'setup.cancel': '取消',
        'setup.required': '请填写账号和密码',
        'setup.failed': '保存失败',
        'setup.note': '如账号开启了二次验证（短信/扫码），请先在浏览器中手动登录一次；插件复用同一份浏览器配置目录，之后即可自动读取。',
        'setup.change': '账号设置',
        'setup.clear': '清除已保存的账号',
        'setup.cleared': '已清除',
        'err.noBrowser': '未检测到 Chrome / Edge / Chromium',
        'err.noBrowserHint': '请安装任意一款 Chromium 内核浏览器，或设置环境变量 DSH_ALIYUN_BROWSER 指向浏览器可执行文件后重启 DSH。',
        'err.login': '登录失败：账号或密码不正确，或触发了二次验证',
        'err.route': '插件后端还没启动（路由未注册）。请在设置里关闭并重新打开本插件，或重启 DSH。',
        'err.auth': '浏览器会话已失效，请刷新页面后重试。',
      },
      en: {
        'footer.label': 'Aliyun Coupon',
        'footer.aria': 'View Aliyun student coupon balance',
        'panel.title': 'Aliyun Student Coupon',
        'panel.subtitle': 'Aliyun · live balance',
        'panel.refresh': 'Refresh',
        'panel.refreshing': 'Fetching…',
        'panel.close': 'Close',
        'panel.balance': 'Available balance',
        'panel.faceValue': 'Face value',
        'panel.used': 'Used',
        'panel.account': 'Account',
        'panel.couponNo': 'Coupon no.',
        'panel.type': 'Type',
        'panel.scope': 'Scope',
        'panel.status': 'Status',
        'panel.amountLimit': 'Amount limit',
        'panel.validity': 'Valid',
        'panel.issuedAt': 'Issued',
        'panel.remark': 'Remark',
        'panel.details': 'Coupon details',
        'panel.source': 'Source',
        'panel.openConsole': 'Open Aliyun console',
        'panel.updatedAt': 'Updated',
        'panel.elapsed': 'Took',
        'panel.live': 'Live fetch · no tokens used',
        'panel.error': 'Fetch failed',
        'panel.retry': 'Retry',
        'panel.empty': 'No coupons found',
        'panel.loading': 'Opening the Aliyun billing console…',
        'panel.loadingHint': 'The first fetch launches a headless browser and signs in (15–25 s)',
        'panel.usedPercent': '{p}% used',
        'panel.couponCount': '{n} more coupon(s)',
        'panel.showAll': 'Show all details',
        'panel.hideAll': 'Hide details',
        'panel.stale': 'Cached',
        'panel.staleHint': 'Live fetch failed — showing the last successful reading',
        'panel.cached': 'Last reading',
        'panel.cachedHint': 'Refreshing over the network — showing the previous value meanwhile',
        'auto.label': 'Auto refresh',
        'auto.off': 'Off',
        'auto.every': 'Every {n} min',
        'auto.next': 'Refreshes in {n} min',
        'auto.due': 'Refreshing…',
        'auto.hint': 'Drag the slider to set the interval, 1 to 30 minutes. While DSH is open it re-reads the balance on that interval and the sidebar figure keeps up. The browser stays warm and repeat fetches reuse the local cache, so a longer interval uses less traffic.',
        'auto.toggleHint': 'Turn auto refresh on or off — switching it off greys out the slider but remembers the interval.',
        'setup.title': 'Connect your Aliyun account',
        'setup.desc': 'The plugin starts a local headless browser, signs in to the Aliyun billing console and reads your coupon balance. Credentials stay in the local DSH credential store and are never uploaded.',
        'setup.account': 'Aliyun account',
        'setup.accountPlaceholder': 'Phone / email / member name',
        'setup.password': 'Password',
        'setup.passwordPlaceholder': 'Aliyun login password',
        'setup.save': 'Save and fetch',
        'setup.saving': 'Saving…',
        'setup.cancel': 'Cancel',
        'setup.required': 'Account and password are required',
        'setup.failed': 'Save failed',
        'setup.note': 'If two-factor verification is enabled, sign in once in the browser window first; the plugin reuses the same browser profile afterwards.',
        'setup.change': 'Account settings',
        'setup.clear': 'Remove saved account',
        'setup.cleared': 'Removed',
        'err.noBrowser': 'No Chrome / Edge / Chromium found',
        'err.noBrowserHint': 'Install any Chromium-based browser, or set DSH_ALIYUN_BROWSER to its executable path and restart DSH.',
        'err.login': 'Sign-in failed: wrong account or password, or two-factor verification was triggered',
        'err.route': 'The plugin backend is not running yet (route not registered). Turn the plugin off and on again in Settings, or restart DSH.',
        'err.auth': 'The browser session expired. Refresh the page and try again.',
      },
    };

    // DSH's own locale preference is the source of truth. The document's `lang`
    // attribute and navigator.language only describe the browser, which is often
    // English even when the DSH UI itself is Chinese.
    let localeService = null;

    function languageOf(tag) {
      return String(tag || '').toLowerCase().indexOf('zh') === 0 ? 'zh' : 'en';
    }

    function currentLocale() {
      try {
        if (localeService && typeof localeService.getLocale === 'function') {
          const snap = localeService.getLocale();
          if (snap && snap.active) return languageOf(snap.active);
        }
      } catch (_) {}
      try {
        const lang = (document.documentElement && document.documentElement.getAttribute('lang')) || '';
        if (lang) return languageOf(lang);
      } catch (_) {}
      try {
        if (navigator && navigator.language) return languageOf(navigator.language);
      } catch (_) {}
      return 'zh';
    }

    function makeT() {
      return function t(key, vars) {
        const table = DICT[currentLocale()] || DICT.zh;
        let text = table[key] || DICT.zh[key] || key;
        if (vars) {
          for (const k of Object.keys(vars)) {
            text = text.split('{' + k + '}').join(String(vars[k]));
          }
        }
        return text;
      };
    }

    /* ------------------------------------------------------------------ */
    /* helpers                                                             */
    /* ------------------------------------------------------------------ */

    function money(value) {
      if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
      return '¥' + Number(value).toFixed(2);
    }

    function money4(value) {
      if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
      const fixed = Number(value).toFixed(4);
      const trimmed = fixed.replace(/0+$/, '').replace(/\.$/, '');
      const parts = trimmed.split('.');
      return '¥' + parts[0] + (parts[1] ? '.' + parts[1] : '');
    }

    function clock(iso) {
      if (!iso) return '—';
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return '—';
      const pad = (n) => String(n).padStart(2, '0');
      return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }

    function day(iso) {
      if (!iso) return '—';
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return '—';
      const pad = (n) => String(n).padStart(2, '0');
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    }

    function shortDate(text) {
      if (!text) return '—';
      const m = String(text).match(/(\d{4}-\d{2}-\d{2})/);
      return m ? m[1] : String(text);
    }

    /* ------------------------------------------------------------------ */
    /* panel store — shared between the sidebar entry and the overlay seat */
    /* ------------------------------------------------------------------ */

    /* The last successful reading survives a page reload, so reopening the
       panel paints the known number immediately and then swaps in the live
       one. The fetch still runs on every open — this only removes the blank
       skeleton the first time the shell has no data in memory. */
    const LS_KEY = 'dsh-aliyun-coupon:last-reading';

    /* ------------------------------------------------------------------ */
    /* auto refresh — a timer, not a model call: the balance is re-read    */
    /* straight from Aliyun over HTTP, so a tick costs no tokens          */
    /* ------------------------------------------------------------------ */

    const AUTO_KEY = 'dsh-aliyun-coupon:auto-refresh';
    // The slider runs 1..30 minutes; 0 means "off" and is reached by the switch
    // beside it, so the track itself never has a dead first step.
    const AUTO_MIN = 1;
    const AUTO_MAX = 30;
    const AUTO_DEFAULT = 5;
    // One heartbeat covers every interval. It only decides whether a fetch is
    // due; the actual network work stays on the chosen cadence.
    const AUTO_HEARTBEAT_MS = 15000;

    function clampAuto(n) {
      const v = Math.round(Number(n));
      if (!isFinite(v) || v < AUTO_MIN) return AUTO_MIN;
      return v > AUTO_MAX ? AUTO_MAX : v;
    }

    function readAutoMinutes() {
      try {
        const raw = window.localStorage.getItem(AUTO_KEY);
        if (raw === null) return AUTO_DEFAULT;
        const n = Number(raw);
        if (n === 0) return 0; // switched off — keep it off across reloads
        return isFinite(n) ? clampAuto(n) : AUTO_DEFAULT;
      } catch (_) {
        return AUTO_DEFAULT;
      }
    }

    function writeAutoMinutes(n) {
      try { window.localStorage.setItem(AUTO_KEY, String(n)); } catch (_) { /* private mode */ }
    }

    let lastAttemptAt = 0;
    let autoTimer = null;

    function readCached() {
      try {
        const raw = window.localStorage.getItem(LS_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || !parsed.data || !parsed.data.primary) return null;
        // Flag it so the panel can say "缓存值" until the live answer lands.
        return Object.assign({}, parsed.data, { fromCache: true, staleAt: parsed.data.fetchedAt || parsed.at });
      } catch { return null; }
    }

    function writeCached(data) {
      try {
        if (data && data.ok && data.primary) {
          window.localStorage.setItem(LS_KEY, JSON.stringify({ at: Date.now(), data: data }));
        }
      } catch { /* private mode or quota — the panel works without it */ }
    }

    const panelStore = (function () {
      const cached = readCached();
      let snapshot = {
        open: false,
        // Seed with the previous reading so the panel opens on the known number
        // instead of a skeleton; the live fetch replaces it a moment later.
        data: cached,
        status: cached ? 'ready' : 'idle',
        error: null,
        setup: null,
        view: 'balance',
        autoMin: readAutoMinutes(),
        // Last thumb position, so switching the countdown back on resumes the
        // interval the user had picked instead of jumping to the default.
        autoLast: (function () { const v = readAutoMinutes(); return v === 0 ? AUTO_DEFAULT : v; })(),
        nextInSec: null,
      };
      const listeners = new Set();
      const emit = function () {
        snapshot = Object.assign({}, snapshot);
        listeners.forEach(function (fn) { fn(); });
      };
      return {
        getSnapshot: function () { return snapshot; },
        subscribe: function (fn) {
          listeners.add(fn);
          return function () { listeners.delete(fn); };
        },
        open: function () {
          if (!snapshot.open) { snapshot = Object.assign({}, snapshot, { open: true }); emit(); }
        },
        close: function () {
          if (snapshot.open) { snapshot = Object.assign({}, snapshot, { open: false, view: 'balance' }); emit(); }
        },
        patch: function (next) {
          snapshot = Object.assign({}, snapshot, next);
          emit();
        },
        setAuto: function (minutes) {
          // 0 is a legitimate value here: it means the user switched the
          // countdown off, and the slider keeps its last position for when they
          // switch it back on.
          const raw = Number(minutes);
          const n = raw === 0 ? 0 : clampAuto(raw);
          writeAutoMinutes(n);
          lastAttemptAt = Date.now();
          snapshot = Object.assign({}, snapshot, {
            autoMin: n,
            autoLast: n === 0 ? (snapshot.autoMin || AUTO_DEFAULT) : n,
            nextInSec: null,
          });
          emit();
        },
        // Repainting on every heartbeat would be wasteful; only a change in the
        // displayed countdown (whole minutes) reaches the components.
        setNext: function (seconds) {
          if (snapshot.nextInSec === seconds) return;
          snapshot = Object.assign({}, snapshot, { nextInSec: seconds });
          emit();
        },
      };
    })();

    let inflight = null;

    function loadBalance(force) {
      if (inflight) return inflight;
      // Any read — manual or scheduled — restarts the auto-refresh countdown, so
      // a user who just pressed 刷新 is never surprised by an immediate repeat.
      lastAttemptAt = Date.now();
      panelStore.patch({ status: 'loading', error: null });
      inflight = fetch(ROUTE_BALANCE + (force ? '?refresh=1' : '?refresh=0'), { cache: 'no-store' })
        .then(function (res) {
          if (!res.ok) {
            const err = new Error('HTTP ' + res.status);
            err.status = res.status;
            throw err;
          }
          return res.json();
        })
        .then(function (data) {
          if (data && data.needSetup) {
            panelStore.patch({ status: 'setup', data: null, error: null, view: 'setup' });
          } else if (data && data.ok) {
            writeCached(data);
            panelStore.patch({ status: 'ready', data: data, error: null });
          } else if (data && data.stale && data.primary) {
            // Degraded answer: keep the reading visible, flag it, surface why.
            panelStore.patch({ status: 'ready', data: data, error: (data && data.error) || null });
          } else {
            panelStore.patch({ status: 'error', data: data || null, error: (data && data.error) || 'unknown error' });
          }
          return data;
        })
        .catch(function (err) {
          const t = makeT();
          const status = err && err.status;
          const message = status === 404 ? t('err.route')
            : status === 401 ? t('err.auth')
            : (err && err.message) || String(err);
          panelStore.patch({ status: 'error', error: message });
        })
        .then(function (value) {
          inflight = null;
          return value;
        });
      return inflight;
    }

    function autoTick() {
      const snap = panelStore.getSnapshot();
      const minutes = snap.autoMin;
      if (!minutes) {
        panelStore.setNext(null);
      } else {
        // Anchor on the later of "last attempt" and "when the reading was taken",
        // so opening the client after a long gap refreshes straight away, while a
        // just-finished read is left alone for a full interval.
        const dataAt = snap.data && snap.data.fetchedAt ? Date.parse(snap.data.fetchedAt) : 0;
        const since = Date.now() - Math.max(lastAttemptAt, dataAt || 0);
        const dueIn = minutes * 60000 - since;
        if (dueIn <= 0) {
          panelStore.setNext(minutes * 60);
          loadBalance(true);
        } else {
          panelStore.setNext(Math.max(60, Math.ceil(dueIn / 60000) * 60));
        }
      }
      // Read-only handle so the timer's behaviour can be inspected from the
      // browser console or an automated check. Carries no credentials.
      if (typeof window !== 'undefined') {
        const now = panelStore.getSnapshot();
        window.__dshAliyunCoupon = {
          ticks: ((window.__dshAliyunCoupon && window.__dshAliyunCoupon.ticks) || 0) + 1,
          visibility: document.visibilityState,
          autoMin: now.autoMin,
          nextInSec: now.nextInSec,
          lastTickAt: new Date().toISOString(),
        };
      }
    }

    function startAutoRefresh() {
      if (autoTimer) return;
      autoTimer = window.setInterval(autoTick, AUTO_HEARTBEAT_MS);
      autoTick();
    }

    function stopAutoRefresh() {
      if (!autoTimer) return;
      window.clearInterval(autoTimer);
      autoTimer = null;
    }

    function saveSetup(account, password) {
      return fetch(ROUTE_SETUP, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ account: account, password: password }),
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (!data || !data.ok) throw new Error((data && data.error) || 'unknown error');
          panelStore.patch({ view: 'balance', setup: null });
          return loadBalance(true);
        });
    }

    function clearSetup() {
      return fetch(ROUTE_SETUP, { method: 'DELETE' })
        .then(function (res) { return res.json(); })
        .catch(function () { return null; })
        .then(function () {
          panelStore.patch({ status: 'setup', data: null, error: null, view: 'setup' });
        });
    }

    /* ------------------------------------------------------------------ */
    /* styles — DSH theme tokens only                                      */
    /* ------------------------------------------------------------------ */

    /* Native DSH metrics sampled from the running shell (settings dialog,
       sidebar entries, primary buttons) so this surface reads as built-in. */
    const CSS = [
      '.acb-footerBtn{display:flex;align-items:center;gap:8px;width:calc(100% + 8px);height:34px;margin:4px -4px 4px;padding:6px 2px 6px 10px;box-sizing:border-box;border:none;border-radius:12px;background:transparent;color:var(--dsw-alias-label-tertiary,#81858c);font-size:14px;line-height:22px;cursor:pointer;text-align:left;transition:background .12s ease,color .12s ease}',
      '.acb-footerBtn:hover,.acb-footerBtn:focus-visible{color:var(--dsw-alias-label-primary,#0f1115);background:var(--dsw-alias-interactive-bg-hover,#2631480f)}',
      '.acb-footerBtn svg{flex:none}',
      '.acb-footerLabel{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;flex:1 1 auto}',
      '.acb-footerValue{margin-left:auto;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-secondary,#61666b);font-size:12px;flex:none}',
      '.acb-footerBtn-rail{width:36px;height:36px;padding:0;margin:0;justify-content:center;border-radius:12px;color:var(--dsw-alias-label-secondary,#61666b)}',
      '.acb-footerBtn-rail:hover,.acb-footerBtn-rail:focus-visible{color:var(--dsw-alias-label-primary,#0f1115);background:var(--dsw-alias-interactive-bg-hover,#2631480f)}',

      '.acb-layer{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;z-index:1040;pointer-events:auto}',
      '.acb-backdrop{position:absolute;inset:0;background:rgba(15,17,21,.28)}',
      '.acb-dialog{position:relative;width:600px;max-width:calc(100vw - 48px);max-height:calc(100vh - 64px);display:flex;flex-direction:column;box-sizing:border-box;background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary,#0f1115);border:0;border-radius:28px;box-shadow:0 0 0 .5px rgba(0,0,0,.16),0 3px 8px rgba(0,0,0,.04),0 18px 48px rgba(0,0,0,.10);overflow:hidden;font-size:14px;line-height:22px}',
      '.acb-header{position:relative;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:14px 20px 10px;flex:none;box-sizing:border-box}',
      '.acb-titleWrap{display:flex;align-items:center;gap:8px;min-width:0}',
      '.acb-title{margin:0;font-size:15px;line-height:22px;font-weight:600;letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.acb-subtitle{font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary,#81858c);white-space:nowrap}',
      '.acb-headerActions{display:flex;align-items:center;gap:4px;flex:none}',
      '.acb-iconBtn{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;min-height:28px;padding:0;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-tertiary,#81858c);cursor:pointer;box-sizing:border-box;outline:none}',
      '.acb-iconBtn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,#2631480f);color:var(--dsw-alias-label-primary,#0f1115)}',
      '.acb-iconBtn:disabled{opacity:.5;cursor:not-allowed}',
      '.acb-iconBtn svg{display:block;width:15px;height:15px;margin:auto}',
      '.acb-spin{animation:acb-rotate .8s linear infinite}',
      '@keyframes acb-rotate{to{transform:rotate(360deg)}}',

      '.acb-body{display:flex;flex-direction:column;gap:14px;padding:4px 20px 16px;overflow:auto;min-height:0;flex:1 1 auto}',
      '.acb-hero{display:flex;flex-direction:column;gap:8px;padding:16px 18px;border-radius:16px;background:rgba(128,128,128,.12);flex:none}',
      '.acb-heroTop{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}',
      '.acb-amount{font-size:32px;line-height:40px;font-weight:600;letter-spacing:-.02em;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary,#0f1115)}',
      '.acb-amountSuffix{font-size:13px;line-height:20px;color:var(--dsw-alias-label-tertiary,#81858c)}',
      '.acb-heroLabel{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,#61666b)}',
      '.acb-bar{position:relative;height:6px;border-radius:999px;background:rgba(128,128,128,.24);overflow:hidden}',
      '.acb-barFill{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:var(--dsw-alias-brand-primary,#0f1115);transition:width .3s ease}',
      '.acb-barMeta{display:flex;justify-content:space-between;gap:8px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary,#81858c);font-variant-numeric:tabular-nums}',

      '.acb-grid{display:grid;grid-template-columns:auto 1fr;gap:8px 16px;font-size:13px;line-height:20px}',
      '.acb-k{color:var(--dsw-alias-label-tertiary,#81858c);white-space:nowrap}',
      '.acb-v{color:var(--dsw-alias-label-primary,#0f1115);word-break:break-word;min-width:0}',

      '.acb-sectionTitle{font-size:12px;line-height:18px;font-weight:500;color:var(--dsw-alias-label-tertiary,#81858c);margin:0 0 6px}',
      '.acb-card{border-radius:16px;padding:12px 14px;display:flex;flex-direction:column;gap:10px;flex:none;background:rgba(128,128,128,.10)}',

      '.acb-pill{display:inline-flex;align-items:center;gap:4px;height:22px;padding:0 8px;border-radius:999px;font-size:12px;line-height:18px;background:rgba(128,128,128,.14);color:var(--dsw-alias-label-secondary,#61666b)}',
      '.acb-pillOk{background:color-mix(in srgb,var(--dsw-alias-state-success-primary,#22c55e) 15%,transparent);color:color-mix(in srgb,var(--dsw-alias-state-success-primary,#22c55e) 78%,#0f1115)}',
      '.acb-pillWarn{background:color-mix(in srgb,var(--dsw-alias-state-warning-primary,#f59e0b) 16%,transparent);color:color-mix(in srgb,var(--dsw-alias-state-warning-primary,#f59e0b) 76%,#0f1115)}',

      '.acb-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 20px 16px;flex:none;flex-wrap:wrap}',
      '.acb-footMeta{display:flex;flex-direction:column;gap:2px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary,#81858c);min-width:0}',
      '.acb-footMeta strong{font-weight:500;color:var(--dsw-alias-label-secondary,#61666b)}',
      '.acb-footActions{display:flex;align-items:center;gap:8px;flex:none}',
      '.acb-auto{display:flex;align-items:center;gap:8px;margin-top:4px;flex-wrap:wrap}',
      /* Range slider: DSH paints its own controls with a 12px radius and a
         hairline secondary border, so the track borrows the same tokens. */
      '.acb-range{-webkit-appearance:none;appearance:none;width:132px;height:14px;background:transparent;cursor:pointer;margin:0;flex:none}',
      '.acb-range:disabled{opacity:.4;cursor:default}',
      '.acb-range::-webkit-slider-runnable-track{height:4px;border-radius:2px;background:var(--dsw-alias-border-secondary,rgba(128,128,128,.28))}',
      '.acb-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:12px;height:12px;margin-top:-4px;border-radius:50%;background:var(--dsw-alias-bg-base,#fff);border:1px solid var(--dsw-alias-border-primary,rgba(0,0,0,.28));box-shadow:0 1px 2px rgba(0,0,0,.16);transition:transform .12s ease}',
      '.acb-range:hover::-webkit-slider-thumb{transform:scale(1.12)}',
      '.acb-range:active::-webkit-slider-thumb{transform:scale(1.2)}',
      '.acb-range:focus-visible{outline:none}',
      '.acb-range:focus-visible::-webkit-slider-thumb{border-color:var(--dsw-alias-brand-primary,#0f1115);box-shadow:0 0 0 3px rgba(128,128,128,.24)}',
      '.acb-range::-moz-range-track{height:4px;border-radius:2px;background:var(--dsw-alias-border-secondary,rgba(128,128,128,.28))}',
      '.acb-range::-moz-range-thumb{width:12px;height:12px;border-radius:50%;background:var(--dsw-alias-bg-base,#fff);border:1px solid var(--dsw-alias-border-primary,rgba(0,0,0,.28));box-shadow:0 1px 2px rgba(0,0,0,.16)}',
      '.acb-rangeValue{min-width:66px;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-secondary,#61666b)}',
      '.acb-switch{position:relative;display:inline-flex;align-items:center;cursor:pointer;flex:none}',
      '.acb-switch input{position:absolute;opacity:0;width:0;height:0}',
      '.acb-switchTrack{position:relative;display:block;width:28px;height:16px;border-radius:8px;background:rgba(128,128,128,.32);transition:background .16s ease}',
      '.acb-switch input:checked + .acb-switchTrack{background:var(--dsw-alias-brand-primary,#0f1115)}',
      '.acb-switchKnob{position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:var(--dsw-alias-bg-base,#fff);transition:transform .16s ease}',
      '.acb-switch input:checked + .acb-switchTrack .acb-switchKnob{transform:translateX(12px)}',
      '.acb-switch input:focus-visible + .acb-switchTrack{box-shadow:0 0 0 3px rgba(128,128,128,.24)}',
      '.acb-autoNext{color:var(--dsw-alias-label-tertiary,#81858c)}',
      '.acb-btn{display:inline-flex;align-items:center;justify-content:center;height:36px;padding:0 14px;font-size:14px;line-height:22px;border:0;border-radius:12px;background:rgba(128,128,128,.12);color:var(--dsw-alias-label-primary,#0f1115);cursor:pointer;text-align:center;white-space:nowrap;box-sizing:border-box;transition:background .12s ease}',
      '.acb-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,#2631480f)}',
      '.acb-btn:active:not(:disabled){background:var(--dsw-alias-interactive-bg-active,#2631481a)}',
      '.acb-btn:disabled{opacity:.55;cursor:not-allowed}',
      '.acb-btnPrimary{background:var(--dsw-alias-brand-primary,#0f1115);color:var(--dsw-alias-bg-base,#fff)}',
      '.acb-btnPrimary:hover:not(:disabled){opacity:.88}',
      '.acb-btnPrimary:active:not(:disabled){opacity:.78}',
      '.acb-link{display:inline-flex;align-items:center;gap:4px;font-size:13px;line-height:20px;color:var(--dsw-alias-label-primary,#0f1115);text-decoration:underline;text-underline-offset:2px;cursor:pointer;background:none;border:0;padding:0}',
      '.acb-link:hover{color:var(--dsw-alias-label-secondary,#61666b)}',

      '.acb-launcher{position:fixed;left:12px;bottom:12px;z-index:1030;display:flex;flex-direction:column;align-items:flex-start;gap:8px}',
      '.acb-launcher .acb-footerBtn{width:auto;max-width:280px;margin:0;padding:0 12px;height:34px;border-radius:12px;background:var(--dsw-alias-bg-layer-1,#fff);box-shadow:0 0 0 .5px rgba(0,0,0,.16),0 3px 8px rgba(0,0,0,.06)}',

      '.acb-empty{padding:26px 8px;text-align:center;font-size:13px;line-height:20px;color:var(--dsw-alias-label-tertiary,#81858c)}',
      '.acb-skel{display:flex;flex-direction:column;gap:10px;padding:8px 0}',
      '.acb-skelRow{height:12px;border-radius:6px;background:rgba(128,128,128,.18);animation:acb-pulse 1.4s ease-in-out infinite}',
      '@keyframes acb-pulse{0%,100%{opacity:.5}50%{opacity:1}}',
      '.acb-err{border-radius:12px;background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#ec1313) 8%,transparent);color:var(--dsw-alias-state-error-primary,#ec1313);padding:10px 12px;font-size:13px;line-height:20px;white-space:pre-wrap;word-break:break-word}',
      '.acb-mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px}',
      '.acb-row{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:13px;line-height:20px}',
      '.acb-rowLabel{color:var(--dsw-alias-label-secondary,#61666b);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.acb-rowValue{font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary,#0f1115);flex:none}',
      '.acb-divider{height:1px;background:rgba(15,17,21,.06);flex:none}',

      '.acb-form{display:flex;flex-direction:column;gap:12px}',
      '.acb-field{display:flex;flex-direction:column;gap:6px}',
      '.acb-label{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,#61666b)}',
      '.acb-input{height:36px;padding:0 12px;box-sizing:border-box;width:100%;font-size:14px;line-height:22px;color:var(--dsw-alias-label-primary,#0f1115);background:rgba(128,128,128,.10);border:1px solid rgba(15,17,21,.10);border-radius:12px;outline:none;transition:border-color .12s ease,background .12s ease}',
      '.acb-input:focus{border-color:var(--dsw-alias-brand-primary,#0f1115);background:var(--dsw-alias-bg-layer-1,#fff)}',
      '.acb-note{font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary,#81858c)}',
    ].join('\n');

    /* ------------------------------------------------------------------ */
    /* icons                                                               */
    /* ------------------------------------------------------------------ */

    function CouponIcon(props) {
      const size = (props && props.size) || 18;
      return h('svg', {
        viewBox: '0 0 16 16', width: size, height: size, fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round',
        strokeLinejoin: 'round', 'aria-hidden': 'true', style: { display: 'block' },
      },
        h('path', { d: 'M2 5.2c.9 0 1.5-.7 1.5-1.5V3.2h9v.5c0 .8.6 1.5 1.5 1.5v5.6c-.9 0-1.5.7-1.5 1.5v.5h-9v-.5c0-.8-.6-1.5-1.5-1.5z' }),
        h('path', { d: 'M6.4 5.6v1M6.4 9.4v1M9.6 5.6v1M9.6 9.4v1' }),
      );
    }

    function RefreshIcon(props) {
      const size = (props && props.size) || 14;
      return h('svg', {
        viewBox: '0 0 16 16', width: size, height: size, fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round',
        strokeLinejoin: 'round', 'aria-hidden': 'true',
        className: props && props.spin ? 'acb-spin' : undefined,
        style: { display: 'block' },
      },
        h('path', { d: 'M13.2 8a5.2 5.2 0 1 1-1.6-3.7' }),
        h('path', { d: 'M13.4 2.2v3.1h-3.1' }),
      );
    }

    function CloseIcon(props) {
      const size = (props && props.size) || 14;
      return h('svg', {
        viewBox: '0 0 16 16', width: size, height: size, fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round',
        'aria-hidden': 'true', style: { display: 'block' },
      }, h('path', { d: 'M3.5 3.5l9 9M12.5 3.5l-9 9' }));
    }

    function ExternalIcon(props) {
      const size = (props && props.size) || 12;
      return h('svg', {
        viewBox: '0 0 16 16', width: size, height: size, fill: 'none',
        stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round',
        strokeLinejoin: 'round', 'aria-hidden': 'true', style: { display: 'block' },
      },
        h('path', { d: 'M6.5 3.5H3.5v9h9v-3' }),
        h('path', { d: 'M9.5 3.5h3v3M12.5 3.5L7 9' }),
      );
    }

    /* ------------------------------------------------------------------ */
    /* components                                                          */
    /* ------------------------------------------------------------------ */

    function Field(props) {
      return h('div', { className: 'acb-k' }, props.label);
    }

    function Value(props) {
      return h('div', { className: 'acb-v' + (props.mono ? ' acb-mono' : '') }, props.children);
    }

    function Skeleton() {
      return h('div', { className: 'acb-skel' },
        h('div', { className: 'acb-skelRow', style: { width: '38%' } }),
        h('div', { className: 'acb-skelRow', style: { width: '64%', height: 26 } }),
        h('div', { className: 'acb-skelRow', style: { width: '100%', height: 6 } }),
        h('div', { className: 'acb-skelRow', style: { width: '86%' } }),
        h('div', { className: 'acb-skelRow', style: { width: '72%' } }),
      );
    }

    function CouponDetail(props) {
      const c = props.coupon;
      const t = props.t;
      const ok = c.status === '可用' || /available|usable/i.test(c.status || '');
      return h('div', { className: 'acb-card' },
        h('div', { className: 'acb-row' },
          h('div', { className: 'acb-rowLabel acb-mono' }, c.no || '—'),
          h('div', { className: 'acb-rowValue' }, money4(c.remain)),
        ),
        h('div', { className: 'acb-divider' }),
        h('div', { className: 'acb-grid' },
          h(Field, { label: t('panel.faceValue') }), h(Value, null, money(c.amount)),
          h(Field, { label: t('panel.type') }), h(Value, null, c.type || '—'),
          h(Field, { label: t('panel.status') }),
          h(Value, null, h('span', { className: 'acb-pill' + (ok ? ' acb-pillOk' : '') }, c.status || '—')),
          h(Field, { label: t('panel.scope') }), h(Value, null, c.scope || '—'),
          h(Field, { label: t('panel.amountLimit') }), h(Value, null, c.amountLimit || '—'),
          h(Field, { label: t('panel.validity') }), h(Value, { mono: true }, shortDate(c.start) + ' → ' + shortDate(c.end)),
          h(Field, { label: t('panel.issuedAt') }), h(Value, { mono: true }, c.issuedAt || '—'),
          h(Field, { label: t('panel.remark') }), h(Value, null, c.remark || '—'),
        ),
      );
    }

    /* first-run credential form ---------------------------------------- */

    function SetupForm(props) {
      const t = props.t;
      const [account, setAccount] = React.useState('');
      const [password, setPassword] = React.useState('');
      const [busy, setBusy] = React.useState(false);
      const [error, setError] = React.useState(null);

      const submit = function (e) {
        if (e && e.preventDefault) e.preventDefault();
        if (!account.trim() || !password) { setError(t('setup.required')); return; }
        setBusy(true);
        setError(null);
        saveSetup(account.trim(), password)
          .catch(function (err) { setError(t('setup.failed') + '：' + ((err && err.message) || err)); })
          .then(function () { setBusy(false); });
      };

      return h('form', { className: 'acb-form', onSubmit: submit },
        h('div', { className: 'acb-note' }, t('setup.desc')),
        h('div', { className: 'acb-field' },
          h('label', { className: 'acb-label', htmlFor: 'acb-account' }, t('setup.account')),
          h('input', {
            id: 'acb-account', className: 'acb-input', type: 'text',
            autoComplete: 'username', spellCheck: false,
            placeholder: t('setup.accountPlaceholder'),
            value: account, disabled: busy,
            onChange: function (e) { setAccount(e.target.value); },
          }),
        ),
        h('div', { className: 'acb-field' },
          h('label', { className: 'acb-label', htmlFor: 'acb-password' }, t('setup.password')),
          h('input', {
            id: 'acb-password', className: 'acb-input', type: 'password',
            autoComplete: 'current-password',
            placeholder: t('setup.passwordPlaceholder'),
            value: password, disabled: busy,
            onChange: function (e) { setPassword(e.target.value); },
          }),
        ),
        error ? h('div', { className: 'acb-err' }, error) : null,
        h('div', { className: 'acb-note' }, t('setup.note')),
        h('div', { className: 'acb-footActions', style: { justifyContent: 'flex-end' } },
          h('button', {
            type: 'button', className: 'acb-btn',
            onClick: function () { panelStore.close(); }, disabled: busy,
          }, t('setup.cancel')),
          h('button', { type: 'submit', className: 'acb-btn acb-btnPrimary', disabled: busy },
            busy ? t('setup.saving') : t('setup.save')),
        ),
      );
    }

    /* main panel ------------------------------------------------------- */

    function Panel(props) {
      const t = props.t;
      const snap = props.snap;
      const [showAll, setShowAll] = React.useState(false);

      React.useEffect(function () {
        function onKey(e) {
          if (e && e.key === 'Escape') panelStore.close();
        }
        window.addEventListener('keydown', onKey);
        return function () { window.removeEventListener('keydown', onKey); };
      }, []);

      const data = snap.data;
      const primary = data && data.primary;
      const total = data && data.total;
      const busy = snap.status === 'loading';
      const percent = total && typeof total.percent === 'number' ? Math.max(0, Math.min(100, total.percent)) : 0;
      const reload = function () { loadBalance(true); };
      const isSetup = snap.view === 'setup' || snap.status === 'setup';
      // A reading carried over from the previous session is not stale in the
      // "fetch failed" sense, but it is not live either — say so the same way.
      const degraded = data && (data.stale || data.fromCache);
      const degradedLabel = data && data.fromCache && !data.stale ? t('panel.cached') : t('panel.stale');
      const degradedHint = data && data.fromCache && !data.stale ? t('panel.cachedHint') : t('panel.staleHint');

      const header = h('div', { className: 'acb-header' },
        h('div', { className: 'acb-titleWrap' },
          h(CouponIcon, { size: 16 }),
          h('h2', { className: 'acb-title' }, isSetup ? t('setup.title') : t('panel.title')),
          isSetup ? null : h('span', { className: 'acb-subtitle' }, t('panel.subtitle')),
          degraded
            ? h('span', { className: 'acb-pill acb-pillWarn', title: degradedHint }, degradedLabel)
            : null,
        ),
        h('div', { className: 'acb-headerActions' },
          isSetup ? null : h('button', {
            type: 'button', className: 'acb-iconBtn', title: t('panel.refresh'),
            'aria-label': t('panel.refresh'), disabled: busy, onClick: reload,
          }, h(RefreshIcon, { spin: busy })),
          h('button', {
            type: 'button', className: 'acb-iconBtn', title: t('panel.close'),
            'aria-label': t('panel.close'), onClick: function () { panelStore.close(); },
          }, h(CloseIcon, null)),
        ),
      );

      let body;
      let foot = null;

      if (isSetup) {
        body = h('div', { className: 'acb-body' }, h(SetupForm, { t: t }));
      } else if (busy && !data) {
        body = h('div', { className: 'acb-body' },
          h('div', { className: 'acb-empty', style: { paddingBottom: 4 } }, t('panel.loading')),
          h('div', { className: 'acb-empty', style: { paddingTop: 0, paddingBottom: 10, fontSize: 11 } }, t('panel.loadingHint')),
          h(Skeleton, null),
        );
      } else if (snap.status === 'error' && !primary) {
        const noBrowser = data && data.noBrowser;
        body = h('div', { className: 'acb-body' },
          h('div', { className: 'acb-err' },
            noBrowser ? t('err.noBrowser') : t('panel.error') + '：' + (snap.error || '')),
          noBrowser ? h('div', { className: 'acb-note' }, t('err.noBrowserHint')) : null,
          h('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
            h('button', { type: 'button', className: 'acb-btn acb-btnPrimary', onClick: reload }, t('panel.retry')),
            h('button', {
              type: 'button', className: 'acb-btn',
              onClick: function () { panelStore.patch({ view: 'setup', status: 'setup' }); },
            }, t('setup.change')),
          ),
        );
      } else if (!primary) {
        body = h('div', { className: 'acb-body' }, h('div', { className: 'acb-empty' }, t('panel.empty')));
      } else {
        const used = total && typeof total.used === 'number' ? total.used : (primary.amount || 0) - (primary.remain || 0);
        // `primary` and `coupons[]` are separate objects after JSON parsing, so an
        // identity check would never match and the headline coupon would show up
        // twice — match on the coupon number instead, and drop exact repeats.
        const seen = {};
        if (primary && primary.no) seen[primary.no] = true;
        const rest = Array.isArray(data.coupons) ? data.coupons.filter(function (c) {
          const key = c && (c.no || c.raw && c.raw[1]);
          if (!key) return true;
          if (seen[key]) return false;
          seen[key] = true;
          return true;
        }) : [];
        body = h('div', { className: 'acb-body' },
          h('div', { className: 'acb-hero' },
            h('div', { className: 'acb-heroLabel' }, t('panel.balance')),
            h('div', { className: 'acb-heroTop' },
              h('div', { className: 'acb-amount' }, money4(primary.remain)),
              h('div', { className: 'acb-amountSuffix' }, '/ ' + money(primary.amount)),
            ),
            h('div', { className: 'acb-bar' }, h('div', { className: 'acb-barFill', style: { width: percent + '%' } })),
            h('div', { className: 'acb-barMeta' },
              h('span', null, t('panel.usedPercent', { p: percent.toFixed(1) })),
              h('span', null, t('panel.used') + ' ' + money(used)),
            ),
          ),
          h('div', null,
            h('div', { className: 'acb-sectionTitle' }, t('panel.details')),
            h(CouponDetail, { coupon: primary, t: t }),
          ),
          h('div', { className: 'acb-grid' },
            h(Field, { label: t('panel.account') }), h(Value, null, primary.owner || primary.suitAccount || '—'),
            h(Field, { label: t('panel.couponNo') }), h(Value, { mono: true }, primary.no || '—'),
            h(Field, { label: t('panel.source') }),
            h(Value, null, h('button', {
              type: 'button', className: 'acb-link',
              onClick: function () { window.open('https://billing-cost.console.aliyun.com/coupons/coupon', '_blank', 'noopener'); },
            }, t('panel.openConsole'), h(ExternalIcon, { size: 11 }))),
          ),
          rest.length
            ? h('div', null,
                h('div', { className: 'acb-sectionTitle' }, t('panel.couponCount', { n: rest.length })),
                showAll
                  ? rest.map(function (c, i) { return h(CouponDetail, { key: c.no || i, coupon: c, t: t }); })
                  : h('button', { type: 'button', className: 'acb-btn', onClick: function () { setShowAll(true); } }, t('panel.showAll')),
              )
            : null,
          snap.status === 'error' && snap.error ? h('div', { className: 'acb-err' }, t('panel.error') + '：' + snap.error) : null,
          snap.status === 'ready' && snap.error ? h('div', { className: 'acb-err' }, snap.error) : null,
        );

        foot = h('div', { className: 'acb-foot' },
          h('div', { className: 'acb-footMeta' },
            h('strong', null, degraded ? degradedLabel : t('panel.live')),
            data
              ? h('span', null,
                  t('panel.updatedAt') + ' ' + clock(data.fetchedAt) +
                  (data.elapsedMs ? ' · ' + t('panel.elapsed') + ' ' + (data.elapsedMs / 1000).toFixed(1) + 's' : '') +
                  (data.fetchedAt ? ' · ' + day(data.fetchedAt) : ''))
              : h('span', null, t('panel.loading')),
            degraded && data.staleAt
              ? h('span', null, degradedHint + ' · ' + clock(data.staleAt))
              : null,
            h('span', { className: 'acb-auto' },
              h('span', null, t('auto.label')),
              h('input', {
                type: 'range',
                className: 'acb-range',
                min: String(AUTO_MIN),
                max: String(AUTO_MAX),
                step: '1',
                value: String(snap.autoMin === 0 ? (snap.autoLast || AUTO_DEFAULT) : snap.autoMin),
                title: t('auto.hint'),
                'aria-label': t('auto.label'),
                disabled: snap.autoMin === 0,
                onChange: function (e) { panelStore.setAuto(e.target.value); },
              }),
              h('span', { className: 'acb-rangeValue' },
                snap.autoMin === 0 ? t('auto.off') : t('auto.every', { n: snap.autoMin })),
              h('label', { className: 'acb-switch', title: t('auto.toggleHint') },
                h('input', {
                  type: 'checkbox',
                  checked: snap.autoMin !== 0,
                  onChange: function (e) { panelStore.setAuto(e.target.checked ? (snap.autoLast || AUTO_DEFAULT) : 0); },
                }),
                h('span', { className: 'acb-switchTrack' }, h('span', { className: 'acb-switchKnob' })),
              ),
              snap.autoMin && snap.nextInSec !== null
                ? h('span', { className: 'acb-autoNext' },
                    snap.nextInSec <= 0 ? t('auto.due') : t('auto.next', { n: Math.max(1, Math.round(snap.nextInSec / 60)) }))
                : null,
            ),
          ),
          h('div', { className: 'acb-footActions' },
            h('button', {
              type: 'button', className: 'acb-btn', title: t('setup.clear'),
              onClick: function () { clearSetup(); },
            }, t('setup.change')),
            h('button', {
              type: 'button', className: 'acb-btn acb-btnPrimary', onClick: reload, disabled: busy,
            }, busy ? t('panel.refreshing') : t('panel.refresh')),
          ),
        );
      }

      return h('div', { className: 'acb-layer' },
        h('div', { className: 'acb-backdrop', onClick: function () { panelStore.close(); } }),
        h('div', { className: 'acb-dialog', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('panel.title') },
          header, body, foot),
      );
    }

    /* sidebar entry ---------------------------------------------------- */

    function FooterAction(props) {
      const t = props.t || makeT();
      const wide = props.wide === true;
      const snap = useStore(panelStore.subscribe, panelStore.getSnapshot);
      const remain = snap.data && snap.data.primary ? snap.data.primary.remain : null;

      return h('button', {
        type: 'button',
        className: 'acb-footerBtn' + (wide ? '' : ' acb-footerBtn-rail'),
        title: wide ? undefined : t('footer.aria'),
        'aria-label': t('footer.aria'),
        onClick: function () {
          panelStore.open();
          loadBalance(true);
        },
      },
        h(CouponIcon, { size: wide ? 14 : 18 }),
        wide ? h('span', { className: 'acb-footerLabel' }, t('footer.label')) : null,
        wide && remain !== null && remain !== undefined
          ? h('span', { className: 'acb-footerValue' }, money(remain))
          : null,
      );
    }

    /* frame-wide overlay seat ------------------------------------------ */

    function OverlayEntry(props) {
      const t = props.t || makeT();
      const snap = useStore(panelStore.subscribe, panelStore.getSnapshot);
      if (!snap.open) return null;
      return h(Panel, { t: t, snap: snap });
    }

    /* Detached launcher ------------------------------------------------ */

    /* Used only when the shell declares none of the seats above. Renders the
       same footer button in a fixed corner so the panel stays reachable. */
    function FallbackLauncher(props) {
      const t = props.t || makeT();
      const snap = useStore(panelStore.subscribe, panelStore.getSnapshot);
      return h('div', { className: 'acb-launcher' },
        h(FooterAction, { t: t, wide: true }),
        snap.open ? h(Panel, { t: t, snap: snap }) : null,
      );
    }

    /* ------------------------------------------------------------------ */
    /* plugin                                                              */
    /* ------------------------------------------------------------------ */

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.effect(function () {
          return insertStyles(CSS);
        }, 'dsh-aliyun-coupon: styles');

        // Runs for as long as the DSH page is open, so the sidebar number keeps
        // itself current without the user opening the panel.
        ctx.effect(function () {
          startAutoRefresh();
          return function () { stopAutoRefresh(); };
        }, 'dsh-aliyun-coupon: auto refresh');

        try {
          const loc = typeof ctx.get === 'function' ? ctx.get('locale') : null;
          if (loc && typeof loc.getLocale === 'function') localeService = loc;
        } catch (_) {}

        const t = makeT();

        /* Seat arbitration. `slots.inject(name, cb)` does not reject unknown
           names — it simply waits for that declaration to appear — so we ask
           for every candidate and let the FIRST declaration that shows up take
           the seat. A future shell that renames the slot still lands. */
        function seat(slotNames, options, Component, label, state) {
          for (let i = 0; i < slotNames.length; i += 1) {
            (function (name) {
              try {
                const disposeWait = ctx.slots.inject(name, function () {
                  if (state.name) return function () {}; // an earlier candidate already won
                  state.name = name;
                  return ctx.slots.register({
                    name: name,
                    id: options.id,
                    order: options.order,
                    locale: NS,
                    inject: function () { return { t: t }; },
                  }, Component);
                });
                if (typeof disposeWait === 'function') {
                  ctx.effect(function () { return disposeWait; }, 'dsh-aliyun-coupon: ' + label + ' wait');
                }
              } catch (err) {
                // A slot the shell refuses outright: try the next candidate.
                console.warn('[dsh-aliyun-coupon] slot ' + name + ' unavailable', err);
              }
            })(slotNames[i]);
          }
        }

        const footerState = { name: null };
        const overlayState = { name: null };

        seat(FOOTER_SLOTS, { id: FOOTER_ID, order: 20 }, FooterAction, 'footer', footerState);
        seat(OVERLAY_SLOTS, { id: OVERLAY_ID, order: 5 }, OverlayEntry, 'overlay', overlayState);

        /* Safety net for a shell that has renamed every seat we know. After a
           short grace period, if no overlay declaration has arrived, mount our
           own floating launcher into document.body. It is ordinary DOM owned by
           this plugin, so it cannot collide with the host's layout, and it
           keeps the panel reachable instead of silently disappearing. */
        const fallbackTimer = window.setTimeout(function () {
          if (overlayState.name) return;
          try {
            ctx.effect(function () {
              return mountDetached(FallbackLauncher, { t: t });
            }, 'dsh-aliyun-coupon: detached launcher');
          } catch (err) {
            console.error('[dsh-aliyun-coupon] detached launcher failed', err);
          }
        }, 2500);
        ctx.effect(function () {
          return function () { window.clearTimeout(fallbackTimer); };
        }, 'dsh-aliyun-coupon: fallback timer');

        // Read-only capability probe: answers "which seat did this build land
        // on?" for a support request, without guessing.
        try {
          window.__dshAliyunCouponCompat = {
            version: 10,
            footerSlot: function () { return footerState.name; },
            overlaySlot: function () { return overlayState.name || 'detached'; },
            hasStylesBuiltin: typeof styles !== 'undefined',
            react: (React && React.version) || 'unknown',
          };
        } catch (_) { /* non fatal */ }
      },
    };
  },
});

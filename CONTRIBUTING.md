# 贡献指南

感谢你想一起把「云工开物代金券」插件做得更稳。这个项目的代码量不大，但有两件事特别重要：**不消耗 Token** 和 **与 DSH 原生界面看不出差别**。

## 本地跑起来

```bash
git clone https://github.com/<you>/dsh-aliyun-coupon.git
cd dsh-aliyun-coupon
node --check index.js && node --check client.js
```

在 DeepSeek Harness 里「安装 bundle」，target 填**本仓库的绝对路径**。profile 里会生成一个指向源码目录的 Junction，改完代码就是改完安装物。

- **Client 半边**（`client.js`）：刷新页面即生效。
- **Host 半边**（`index.js`）：在插件管理里把插件关掉再打开一次，才会重新 `import()`。

## 代码约定

- **零运行时依赖**。WebSocket 与 CDP 都是手写的最小实现，请不要再引入 `ws` / `puppeteer` / `playwright`。
- **只用 DSH 主题变量**。颜色一律走 `--dsw-alias-*`，并带上 fallback，例如 `var(--dsw-alias-label-primary, #0f1115)`。不要写死 `#fff` / `#000`，否则深色主题下会很突兀。
- **可选服务一律守卫**。`ctx.get('x')` 可能返回 `undefined`（老版本没有这个服务，或者组合里没装）。缺服务时降级，不要让宿主崩溃。
- **插槽名只加不改**。`FOOTER_SLOTS` / `OVERLAY_SLOTS` 是候选链，给新版本加名字就往后追加，不要删掉旧的。
- **DOM 断言不要依赖中文文案**。PowerShell 输出会把 UTF-8 渲染成乱码，用 class 名或选择器判断更可靠。
- 不用 TypeScript，不用打包器。`index.js` 与 `client.js` 都是可以直接读的 ESM / 工厂函数。

## 提交 Pull Request

1. Fork，建分支：`git checkout -b fix/login-timeout`
2. 改完跑 `node --check index.js && node --check client.js`
3. 在真实 GUI 里点一遍：侧边栏入口 → 打开面板 → 读到数字 → 浅色/深色各看一眼 → 拖动滑块 → 点刷新
4. 提交，PR 里写清楚：改了什么、为什么、怎么验证的（最好附截图）
5. 涉及抓取逻辑的改动，请说明你验证的账号环境（是否开了二次验证、用的哪个浏览器）

## 报 Bug 时请附上

- DSH 版本（`设置 → 关于` 或 `package.json` 里的 `engines.dsh`）
- 操作系统与浏览器版本
- 页面控制台里 `window.__dshAliyunCouponCompat` 的输出
- `/api/dsh-aliyun-coupon/diag` 的返回（**不要把账号密码贴进来**）
- 面板截图（注意打码券号与账号名）

## 安全

- **绝对不要**把阿里云账号、密码、AccessKey、cookie 提交进仓库、issue 或截图。
- 凭据只存在本机 DSH 凭据库（`ALIYUN_CONSOLE_ACCOUNT` / `ALIYUN_CONSOLE_PASSWORD`）。
- 发现安全问题请走私密渠道，见 [SECURITY.md](SECURITY.md)。

## License

提交 PR 即表示同意以 MIT 协议发布你的贡献。

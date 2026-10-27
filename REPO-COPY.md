# 发布到 GitHub 时要填的文案（直接复制粘贴）

按顺序用。每一块都是**成品**，选中代码框里的内容 `Ctrl+C` 就行，不用改字。
文中所有链接都已经填好你的用户名 `KERBALMans`，**一个字都不用改，直接复制**。

---

## 一、仓库简介（Repository description）

> 填在 GitHub 新建仓库的 Description 框，或首页右栏 About 的 Description。
> GitHub 限制 350 字符以内，下面这段约 200 字符，安全。

```
DeepSeek Harness 插件：在侧边栏实时查看阿里云「云工开物」学生专属 300 元代金券余额。零 Token 消耗（本机无头浏览器直连阿里云费用控制台抓取，不走大模型），1–30 分钟自动刷新，深浅色跟随 DSH 原生主题。Windows / macOS / Linux。
```

**英文版（如果想让外国人也搜到，可以两个都放，用 `·` 隔开）：**

```
A DeepSeek Harness plugin that shows your Aliyun student coupon balance live in the sidebar — zero tokens, scraped locally through headless Chromium, auto-refresh 1–30 min, native DSH theme.
```

---

## 二、Topics（仓库标签）

> 首页右栏 About → ⚙️ → Topics，一个一个加。标签只能用英文小写加连字符。

```
dsh
dsh-plugin
deepseek-harness
deepseek
aliyun
aliyun-coupon
coupon
student
billing
headless-browser
chrome-devtools-protocol
cdp
zero-dependency
```

---

## 三、README 开头（如果你要重写首页介绍）

> 仓库里已经有完整的 `README.md`，一般不用动。这块是给你在别处发帖时用的「精简版」。

```markdown
# dsh-aliyun-coupon

> 阿里云「云工开物」学生专属 300 元代金券，在 DeepSeek Harness 侧边栏里实时看。

每次想确认学生券还剩多少钱，都得：开浏览器 → 登录阿里云 → 进控制台 → 找到「优惠券」页 → 翻表格。
一个学期下来要点几十次，纯粹是浪费生命。

这个插件把这件事变成「瞄一眼侧边栏」。

## 它解决什么

- **不烧 Token。** 余额是本机一个无头 Chromium 直接去阿里云费用控制台抓的，跟大模型一点关系都没有。你点一百次刷新，Token 消耗还是零。
- **是真的实时。** 不是缓存、不是估算。每次点开面板都重新联网读一次；平时按你设的间隔自动读。
- **看不出来是插件。** 侧边栏入口、居中对话框、圆角、字号、颜色，全部复用 DSH 自己的主题变量，深浅色都跟手。不说的话没人会注意到它是外挂的。
- **跨平台。** Windows / macOS / Linux，自动找本机的 Chrome / Edge / Chromium / Brave / Vivaldi。

## 30 秒装上

1. 在 Releases 里下载 `dsh-aliyun-coupon-1.3.1.tgz`
2. 在 DeepSeek Harness 里「安装 bundle」，target 填这个 tgz 的绝对路径
3. 重启 DSH，侧边栏底部出现「云工开物代金券」
4. 第一次点开，填一次阿里云账号密码（存在本机凭据库，不上传）
5. 完事

## 它是怎么工作的（一句话版）

插件在你自己电脑上悄悄开一个**看不见的浏览器**，替你打开阿里云控制台、读到那张券的余额，然后把数字交给 DSH 的界面显示。整个过程不经过任何服务器，也不经过大模型。

详细原理见下面「五、原理说明」。
```

---

## 四、Release 说明（v1.3.1）

> 填在创建 Release 时的「Describe this release」框。

```markdown
## v1.3.1 — 跨版本兼容 + 发布物料

这个版本主要做两件事：让插件在**现在和未来的 DSH 版本**上都不容易挂掉，以及补齐发布到 GitHub 需要的全部物料。

### 跨版本兼容

DSH 的插槽名、客户端服务名属于组合层契约，不是永久不变的公开 API。这个版本不再写死单一名字，改成「候选链」：

- **侧边栏入口**：`sidebar.footer.action` → `sidebar.footer` → `sidebar.actions` → `sidebar.bottom`，第一个真实存在的声明拿到座位
- **面板挂载**：`shell.overlay` → `shell.overlays` → `root.overlay`
- **全都改名了**：2.5 秒后仍没有 overlay 声明，就把同一套组件挂进 `document.body` 里的自有容器，保证面板不会「静默消失」
- **React API**：`useSyncExternalStore` 缺失时退回 `useState` + `useEffect` 订阅垫片（兼容 React 17）
- **样式注入**：有宿主 `styles` 内置就用它，没有就插 `<style>` 标签
- **宿主服务**：`webServer` 按 `webServer` → `web-server` → `httpServer` → `server` 的候选链查找；`credentials` / `connection` / `locale` 全部存在性守卫，缺哪个降级哪个

新增两个自检入口，报 issue 时贴上即可：

- 浏览器控制台 `window.__dshAliyunCouponCompat`：本次实际落座的插槽名、React 版本、`styles` 可用性
- `GET /api/dsh-aliyun-coupon/diag` 的 `capabilities`：本次实际用的 HTTP 服务名、路由是否绑定成功、`credentials` / `connection` / `locale` / `browser` 各是否存在

### 功能（沿用 1.2.0）

- 侧边栏实时余额 + 完整明细面板（面值、已用比例、券号、状态、适用范围、有效期、备注）
- 零 Token：本机无头 Chromium 直连阿里云费用控制台，不走大模型
- 1–30 分钟自动刷新滑块 + 独立开关，默认 5 分钟
- 深浅色跟随 DSH 原生主题，颜色全部走 `--dsw-alias-*`
- 零运行时依赖（WebSocket 与 CDP 都是内置实现）

### 安装

下载 `dsh-aliyun-coupon-1.3.1.tgz`，在 DSH 里「安装 bundle」，target 填 tgz 的绝对路径，重启。

### 已知限制

- 阿里云开启二次验证（短信 / 扫码）的账号无法纯脚本登录，需先用普通浏览器在该配置目录完成一次人工验证
- 自动刷新间隔建议不低于 1 分钟，避免触发阿里云风控

**完整改动见 [CHANGELOG.md](https://github.com/KERBALMans/dsh-aliyun-coupon/blob/main/CHANGELOG.md)。**
```

---

## 五、原理说明（专业版 + 大白话版）

> 这段适合放进 README、博客、或者回答「这玩意安全吗」的时候用。

### 5.1 专业版

```markdown
## 架构

插件分 Host 与 Client 两个半边。

**Host 半边**（`index.js`，跑在 DSH 的 Node 进程里）：
通过 `ctx.inject(['webServer'])` 拿到 DSH 的 HTTP 服务，注册 `/api/dsh-aliyun-coupon` 前缀路由。
收到请求后，若浏览器未启动则以 `--headless=new --remote-debugging-port=0 --user-data-dir=<profile>` 拉起一个 Chromium，
从 `DevToolsActivePort` 文件读出实际调试端口，再用**手写的最小 RFC6455 WebSocket 客户端**连上 CDP，
通过 `Runtime.evaluate` / `Page.navigate` 驱动页面。整个链路零第三方依赖。

抓取流程：
1. `Page.navigate` 到 `billing-cost.console.aliyun.com/coupons/coupon`
2. 检测是否被重定向到登录页；若是，跟踪 `Runtime.executionContextCreated` 找到 `passport.aliyun.com` 的**跨域 iframe**，
   在任意执行上下文里定位 `#fm-login-id` / `#fm-login-password` 并填表提交
3. 登录后读取 `<table>` 的表头与数据行，按**列名**（而非列序号）映射为结构化 JSON
4. 结果写入 `last-good.json`，供抓取失败时降级展示

**Client 半边**（`client.js`，跑在 DSH 的 Web 前端里）：
通过 `slots.register` 占据 `sidebar.footer.action`（侧边栏入口）与 `shell.overlay`（全屏浮层），
用 `fetch` 请求 Host 路由。React 由宿主提供，不打包。样式全部使用 `--dsw-alias-*` 主题变量并带 fallback。

## 为什么不用 AccessKey / OpenAPI

BSS OpenAPI 的 `DescribeCoupon` 需要一对 AccessKey。要求一个学生用户去 RAM 控制台创建 AK，
再手动填进插件——这比直接填账号密码麻烦得多，而且 AK 权限往往远大于「读优惠券」这一件事。

控制台页面本身已经完成了签名、风控与登录态管理。让一个真实浏览器去跑它自己的前端 JS，
既不需要 AK，也不需要逆向签名算法，且行为与用户手动操作完全一致。

## 为什么不复用系统浏览器的 cookie

Chromium 自 v20 起对 cookie 启用 **App-Bound Encryption**（Windows 上绑定 DPAPI + 应用身份），
从 Node 进程里直接解密 `Cookies` 数据库拿到的只是密文。因此插件使用**独立的浏览器配置目录**，
由 CDP 驱动登录一次，之后登录态就保留在该目录里。

## 安全性

- 凭据只写入 DSH 本机凭据库（`ALIYUN_CONSOLE_ACCOUNT` / `ALIYUN_CONSOLE_PASSWORD`），源码中无任何硬编码
- 无外部上报端点；网络请求只有 `*.aliyun.com` 与本机 DSH 路由两类
- 路由复用 DSH 的 `connection.admit` 鉴权；老版本缺该服务时降级放行
- 不监听新端口、不写注册表、不装计划任务
```

### 5.2 大白话版

```markdown
## 说人话：它到底怎么拿到余额的

你的电脑上本来就装着 Edge 或 Chrome 吧？这个插件做的事，就是**在你电脑上偷偷开一个看不见的浏览器窗口**，
让它替你去打开阿里云的控制台页面——跟你自己手动打开一模一样，只不过你看不见它。

打开之后，它读一下页面上那张表格里的数字（就是「余额」那一列），然后把数字交回给 DSH 的界面显示出来。
读完就把那个看不见的浏览器关掉（或者留着待命，省得下次重新开）。

**为什么这样最安全？**
因为整个过程中，插件没有去破解阿里云的什么接口，也没有偷存什么密钥。它就是「假装是你本人，正常登录，正常打开页面，正常看一眼」。
阿里云那边看到的就是一次普通的网页访问。

**为什么不烧 Token？**
因为这事儿跟 AI 一毛钱关系都没有。抓数字的是一个普通浏览器，不是大模型。
你在面板上点一百次「刷新」，DeepSeek 那边一个 Token 都不会扣。

**密码去哪了？**
存在你电脑上 DSH 自己的密码保险箱里（就叫「凭据库」），只有这个插件能读。
它不会被发到任何服务器，也不会写进 GitHub 上的代码里。
你要是不放心，点面板底部的「账号设置」就能一键清掉。

**那它会不会偷偷干别的？**
代码全在 GitHub 上，一共两个文件，加起来两千多行，任何一个懂点编程的人半小时能读完。
它只做三件事：开浏览器、读表格、把数字给你看。
```

---

## 六、发帖用的短文案（小红书 / 论坛 / QQ 群）

> 三档长度，挑一个用。

### 6.1 一句话版

```
给 DeepSeek Harness 写了个插件，侧边栏直接看阿里云云工开物 300 学生券还剩多少，零 Token 消耗，1–30 分钟自动刷新。仓库：https://github.com/KERBALMans/dsh-aliyun-coupon
```

### 6.2 短版（群聊 / 朋友圈）

```
【DSH 插件】阿里云学生券余额，侧边栏实时看

每次想知道 300 块学生券还剩多少，都得开浏览器→登录→进控制台→翻优惠券页，烦。

做了个 DeepSeek Harness 插件，侧边栏底部直接显示余额，点开是完整明细。

✅ 不烧 Token（本机无头浏览器直抓，不走大模型）
✅ 1–30 分钟自动刷新，默认 5 分钟
✅ 颜色圆角字号全用 DSH 自己的主题变量，深浅色都跟手，看不出是外挂的
✅ Windows / macOS / Linux 都能用，自动找本机 Chrome / Edge

装法：Releases 下 .tgz，DSH 里「安装 bundle」填绝对路径，重启就有。

https://github.com/KERBALMans/dsh-aliyun-coupon
```

### 6.3 长版（论坛 / 博客开头）

```
我受够了每次查阿里云学生券余额都要点五次。

云工开物给的 300 块学生券，是我做实验、跑小模型的主要预算来源。但它藏在阿里云控制台的一个二级页面里，
每次想看还剩多少，路径是：开浏览器 → 登录 → 费用与成本 → 优惠券 → 找到那张券 → 看余额列。

一个学期下来点了几十次。烦。

所以我给 DeepSeek Harness 写了个插件，把它变成「瞄一眼侧边栏」。

## 长什么样

侧边栏最底下多一行「云工开物代金券 ¥209.04」。点开是个居中的对话框，里面有：
可用余额、面值、已用比例、已抵扣金额，以及券号、券类型、状态、适用范围、金额限制、有效期、发券时间、备注。

## 三个我觉得重要的设计决定

**一、坚决不烧 Token。**
最省事的做法是让大模型去「理解」页面然后提取数字，但那样每看一次余额就要花一次 Token。
我的做法是在本机开一个无头 Chromium，直接读 DOM 里的表格。跟大模型零关系，点一百次刷新也不扣一个 Token。

**二、坚决不要 AccessKey。**
阿里云 OpenAPI 能查优惠券，但要一对 AK。让一个学生去 RAM 控制台创建 AK、配权限、填进插件——
这比直接填账号密码麻烦十倍，而且 AK 的权限通常远大于「读优惠券」。
所以我让真实浏览器去跑控制台自己的前端，签名、风控、登录态全交给它自己处理。

**三、界面必须看不出是插件。**
颜色全部走 `--dsw-alias-*` 主题变量，圆角 28px 对齐 DSH 的对话框，字号 14/15/32 对齐它的层级，
连按钮的 `border-radius: 12px` 都是量出来的。深色主题下自动跟着变，不会出现「白底弹窗糊在深色界面上」。

## 踩过的坑（给后来人）

- **登录表单在跨域 iframe 里。** `account.aliyun.com/login/login.htm` 现在只是个壳，
  真正的 `#fm-login-id` / `#fm-login-password` 在 `passport.aliyun.com` 的 iframe 里。
  直接导航到 iframe 的 URL 是白屏。必须跟踪 CDP 的 `Runtime.executionContextCreated`，在任意上下文里找表单。
- **`#fm-login-checkcode` 节点一直存在**，但没要验证码时它是隐藏的。用节点是否存在判断会 100% 误判，必须看 `getBoundingClientRect` + `computedStyle`。
- **`webServer` 服务激活顺序不保证。** 在 `apply()` 里直接 `ctx.get('webServer')` 可能拿到 `undefined`，
  插件就静默不注册路由，界面报 404。得用 `ctx.inject(['webServer'])`。
- **系统代理残留。** 用户关掉代理软件后，注册表里的 `ProxyEnable=1` 还在，
  Chromium 会 `ERR_PROXY_CONNECTION_FAILED` 而 Node 的 fetch 却正常。要探活后再决定用不用代理。
- **深色模式验证**：DSH 用 `prefers-color-scheme` 解析 `system` 主题，
  必须在**导航之前**做 `Emulation.setEmulatedMedia`，挂载后再切没用。

## 装上试试

Releases 里下 `.tgz`，DSH 里「安装 bundle」填绝对路径，重启。
第一次点开填一次账号密码（存在本机凭据库），之后就是实时读。

https://github.com/KERBALMans/dsh-aliyun-coupon

MIT 协议，代码两千行，随便看随便改。
```

---

## 七、回答常见质疑（评论区备用）

**「这安全吗？会不会偷我密码？」**

```markdown
密码存在你本机 DSH 的凭据库里（`ALIYUN_CONSOLE_ACCOUNT` / `ALIYUN_CONSOLE_PASSWORD`），
插件只做一件事：把它填进 `passport.aliyun.com` 的登录表单。

源码里搜不到任何硬编码凭据（CI 里有一条检查专门扫这个），也没有任何外部上报端点——
全部网络请求只有两类：访问 `*.aliyun.com`，以及访问你本机的 DSH 路由。

代码两千行，两个文件，MIT 协议，随便审。
```

**「为什么不用官方 API？」**

```markdown
BSS OpenAPI 的 `DescribeCoupon` 要一对 AccessKey。让一个学生去 RAM 控制台建 AK、配权限、填进插件，
比直接填账号密码麻烦十倍，而且 AK 权限通常远大于「读优惠券」这一件事。

控制台页面本身已经完成了签名、风控、登录态管理。让真实浏览器跑它自己的前端 JS，
既不需要 AK，也不用逆向签名算法。
```

**「会不会触发阿里云风控？」**

```markdown
插件的行为跟你手动打开控制台完全一致：同一个页面、同一个浏览器、同样的请求。
默认 5 分钟一次，宿主侧还有 30 秒最短间隔兜底，不会连续启动无头浏览器。

如果你担心，可以把间隔拉到 30 分钟，或者直接关掉自动刷新，只在自己想看的时候点一下。
```

**「我的账号开了二次验证怎么办？」**

```markdown
纯脚本登录过不了短信/扫码验证。解决办法：先用普通 Chrome 打开一次阿里云登录，
在同一份浏览器配置目录里完成验证，之后插件就能复用这个登录态自动读取。

具体做法见 README 的「常见问题」。
```

---

## 八、给自己的备忘：发布后还要做什么

- [x] `package.json` 里的 `repository` / `homepage` / `bugs` 已填好 `KERBALMans`
- [x] `README.md`、本文件、`UPLOAD-GUIDE.md`、`.github/ISSUE_TEMPLATE/config.yml` 里的用户名已全部填好
- [ ] README 里的 `docs/` 三张截图确认能正常显示（点开看一眼）
- [ ] Release 里确认 `.tgz` 真的传上去了（不是 0 字节）
- [ ] 用无痕窗口打开仓库，确认是 Public 且不登录能看
- [ ] 在仓库搜索框里搜一下你的密码前几位和 `LTAI`，确认搜不到任何东西

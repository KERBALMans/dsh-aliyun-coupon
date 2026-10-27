# 从零开始：把插件发布到 GitHub（纯网页点击版）

> 这份教程假设你**没装 Git**、**不会敲命令**、**第一次上传**。
> 全程只用鼠标和键盘，一步一图不用，跟着编号做就行。
> 每一步都写了「你应该看到什么」，看到的不一样就停下来对照。

---

## 开始之前：先确认一件事

你上次说「把整个仓库都删了」，但 GitHub 上**其实还剩一个**没删掉：

```
https://github.com/KERBALMans/DSH--dsh-aliyun-coupon
                                        ↑↑ 注意这里有两个横杠
```

这个仓库名字里多打了一个横杠，而且里面的 `README.md`、`package.json`、`UPLOAD-GUIDE.md`、`REPO-COPY.md` 还是**旧版本**（里面还写着 `OWNER` 占位符）。

**所以我们先把它删掉，从头来一个干净的。**

---

## 第 0 步：删掉那个旧仓库

1. 浏览器打开：<https://github.com/KERBALMans/DSH--dsh-aliyun-coupon/settings>
2. 页面**一直往下滚**，滚到最底部（滚到底会看到一片红色区域）
3. 点红色的 **Delete this repository**
4. 弹出一个小窗口，里面有个输入框，要求你输入仓库全名。**照着输**：

   ```
   KERBALMans/DSH--dsh-aliyun-coupon
   ```

5. 点下面那个红色的 **I understand the consequences, delete this repository**
6. 可能还会让你输一次 GitHub 密码，输完确认

**你应该看到：** 页面跳回你的主页，提示 `Your repository "KERBALMans/DSH--dsh-aliyun-coupon" was permanently deleted.`

> 删掉不影响任何东西，插件在你电脑上照常能用。GitHub 上那份只是个「展示柜」。

---

## 第 1 步：新建一个空仓库

1. 浏览器打开：<https://github.com/new>
2. 按下面这张表填。**表里没提到的，一律不要动**：

   | 页面上的字段 | 你填什么 |
   | --- | --- |
   | **Repository name** | `dsh-aliyun-coupon` |
   | **Description** | 复制下面「文案 1」那一整段 |

   **文案 1（仓库简介，选中框里内容 Ctrl+C）：**

   ```
   DeepSeek Harness 插件：在侧边栏实时查看阿里云「云工开物」学生专属 300 元代金券余额。零 Token 消耗（本机无头浏览器直连阿里云费用控制台抓取，不走大模型），1–30 分钟自动刷新，深浅色跟随 DSH 原生主题。Windows / macOS / Linux。
   ```

   > 想加上英文让外国人也搜得到的话，在中文后面加个 ` · ` 再接这段：
   > `A DeepSeek Harness plugin that shows your Aliyun student coupon balance live in the sidebar — zero tokens, scraped locally through headless Chromium, auto-refresh 1–30 min, native DSH theme.`
   | **Public / Private** | 点 **Public** |
   | **Add a README file** | **不要勾**（我们有自己的） |
   | **Add .gitignore** | 保持 **None** |
   | **Choose a license** | 保持 **None**（我们自带 LICENSE 文件） |

3. 点最下面绿色的 **Create repository**

**你应该看到：** 一个几乎空白的页面，中间有一行灰字 `Quick setup — if you've done this kind of thing before`，下面有几个蓝色链接。

> ⚠️ 到这一步**先别关页面**，下一步马上要用。

---

## 第 2 步：把文件传上去（最关键的一步）

### 2.1 先进「上传页面」

在刚才那个页面上，找到蓝色链接 **uploading an existing file**（在 `Quick setup` 那段灰字里面），点它。

**你应该看到：** 页面中间出现一个**虚线大框**，框里写着 `Drag files here to add them to your repository`。

### 2.2 打开你电脑上的文件夹

按键盘 `Win + E` 打开文件资源管理器，在地址栏里粘贴这一行，回车：

```
E:\MY Base Text\DeepSeek Harness\dsh-aliyun-coupon
```

**你应该看到：** 里面有 `docs`、`locale` 两个文件夹，还有一堆 `.md`、`.js`、`.json` 文件。

### 2.3 全选，拖进去

1. 在这个文件夹里按 `Ctrl + A`（全选）
2. 用鼠标**按住**任意一个已选中的东西，**拖到浏览器的虚线框里**，松手

**你应该看到：** 浏览器里刷出一长串文件名，下面有个进度条在跑。文件不多（两个 `.js`、七八个 `.md`、三张截图），**几十秒**就好。

> ⚠️ **三个坑，一定要避开：**
>
> 1. **拖的是文件夹「里面」的东西，不是文件夹本身。** 如果你拖完发现仓库里变成了 `dsh-aliyun-coupon/dsh-aliyun-coupon/...` 套了两层，就是拖错了，把外面那层删掉重来。
> 2. **别拖 `node_modules`。** 这个项目零依赖，本来就没有这个文件夹。万一你以前跑过 `npm install` 生成了它，记得按住 `Ctrl` 点掉它再拖。
> 3. **`.tgz` 不要传。** 安装包走第 5 步的 Release，不放进代码里。

### 2.4 填提交信息，点提交

页面往下滚，有两个框：

- **Commit message**（上面那个）：填 `feat: dsh-aliyun-coupon 1.3.1`
- **Extended description**（下面那个）：**留空**

点绿色的 **Commit changes**。

**你应该看到：** 页面跳到仓库首页，文件列表里出现了 `README.md`、`index.js`、`client.js`、`docs`、`locale`……而且 `README.md` 是**渲染出来的中文介绍 + 三张截图**，不是一堆纯文本。

> ✅ 到这里，仓库主体就成了。剩下两步是补「隐藏文件」和「门面」。

---

## 第 3 步：补上 `Ctrl+A` 没带上的东西

`Ctrl + A` 全选时，Windows 资源管理器**默认不显示以点开头的文件**，所以这两样大概率没传上去：

- `.gitignore`（一个文件）
- `.github`（一个文件夹，里面 5 个文件）

先检查：回到仓库首页，看文件列表里有没有 `.gitignore`。**没有就按下面补。**

### 3.1 补 `.gitignore`

1. 仓库首页右上角，点 **Add file** → **Create new file**
2. 最上面有个文件名输入框，输入（**前面那个点不能漏**）：

   ```
   .gitignore
   ```

3. 下面那个大文本框里，粘贴这七行：

   ```
   node_modules/
   *.tgz
   .DS_Store
   Thumbs.db
   .env
   .env.*
   *.log
   ```

4. 页面往下滚，Commit message 填 `chore: add .gitignore`
5. 点 **Commit changes**

**你应该看到：** 回到仓库首页，文件列表里多了 `.gitignore`。

### 3.2 补 `.github` 文件夹（5 个文件）

这五个文件是「别人给你提问题时的模板」和「自动检查代码」。**不做也能发布**，别人照样能下载安装，只是提 issue 时没有模板。

两种补法，**推荐方法 A**：

#### 方法 A：用网页版 VS Code（快，一次搞定）

1. 在仓库首页，**按键盘上的英文句号键 `.`**（就是 `>` 那个键，不用按 Shift）
2. **你应该看到：** 页面变成一个蓝色的代码编辑器界面（地址栏变成 `https://github.dev/KERBALMans/dsh-aliyun-coupon`），左边是文件树
3. 打开你电脑上的 `E:\MY Base Text\DeepSeek Harness\dsh-aliyun-coupon` 文件夹
4. 把里面的 **`.github` 文件夹**直接拖到左边文件树的最上方空白处，松手
5. **你应该看到：** 左边文件树里出现 `.github`，点开有 `ISSUE_TEMPLATE`、`workflows`、`pull_request_template.md`
6. 按 `Ctrl + Shift + G`（打开源代码管理面板）
7. 在 `Message` 框里填 `chore: add .github templates and CI`
8. 点上面那个 **✓ Commit** 按钮；如果弹出提示问「要不要暂存所有更改」，点 **Yes**
9. 再点 **Sync Changes**（或者左下角那个转圈的云朵图标）

**你应该看到：** 左下角提示同步完成，转圈的图标停下来。

> 💡 按 `.` 打不开也没关系，直接手动输地址：`https://github.dev/KERBALMans/dsh-aliyun-coupon`

#### 方法 B：老老实实一个一个建（慢，但一定成功）

还是在仓库首页，点 **Add file** → **Create new file**。
文件名框里**直接输入带斜杠的完整路径**，GitHub 会自动帮你建文件夹：

| 文件名框里输入（原样，一个字符都别改） |
| --- |
| `.github/ISSUE_TEMPLATE/bug_report.md` |
| `.github/ISSUE_TEMPLATE/feature_request.md` |
| `.github/ISSUE_TEMPLATE/config.yml` |
| `.github/pull_request_template.md` |
| `.github/workflows/ci.yml` |

内容从本机这几个文件里复制（用**记事本**打开，`Ctrl+A`、`Ctrl+C`）：

```
E:\MY Base Text\DeepSeek Harness\dsh-aliyun-coupon\.github\ISSUE_TEMPLATE\bug_report.md
E:\MY Base Text\DeepSeek Harness\dsh-aliyun-coupon\.github\ISSUE_TEMPLATE\feature_request.md
E:\MY Base Text\DeepSeek Harness\dsh-aliyun-coupon\.github\ISSUE_TEMPLATE\config.yml
E:\MY Base Text\DeepSeek Harness\dsh-aliyun-coupon\.github\pull_request_template.md
E:\MY Base Text\DeepSeek Harness\dsh-aliyun-coupon\.github\workflows\ci.yml
```

每个文件建一次、提交一次，五个文件大概五分钟。

> ⚠️ **千万别用 Word 打开这些文件**，Word 会把英文引号变成中文弯引号，`config.yml` 就坏掉了。用记事本或 VS Code。

> ℹ️ 补完 `.github` 之后，回仓库首页**可能还是看不见它**——这是正常的，GitHub 网页默认不显示以点开头的文件夹。想确认有没有传上去，直接访问这个地址：
> `https://github.com/KERBALMans/dsh-aliyun-coupon/tree/main/.github`

---

## 第 4 步：填仓库的「门面」

### 4.1 简介和标签

1. 仓库首页，**右边栏**有一块 `About`，点它右上角的 **⚙️ 齿轮图标**
2. 按下面填：

   | 字段 | 填什么 |
   | --- | --- |
   | **Description** | 复制下面「文案 1」 |
   | **Website** | **留空** |
   | **Topics** | 一个一个加：`dsh`、`dsh-plugin`、`deepseek-harness`、`aliyun`、`coupon`、`student`、`billing`、`headless-browser`、`cdp` |

3. 点 **Save changes**

**你应该看到：** 右边栏出现一段中文简介，下面一排蓝色小标签。

> Topics 很重要——别人在 GitHub 搜 `dsh-plugin` 时能不能搜到你，全看这个。加完按回车才会生效，一个一个来。

### 4.2 社交预览图（可选，好看）

**Settings** → 左边找 **Social preview** → **Edit** → 上传 `E:\MY Base Text\DeepSeek Harness\dsh-aliyun-coupon\docs\screenshot-light.png`。

不弄也行，不影响任何人安装。

---

## 第 5 步：发一个 Release（让别人能一键下载安装包）

**这一步是「让别人真的用上」的关键。** 没有 Release，别人得自己去 clone 源码再打包；有了 Release，别人直接下一个 `.tgz` 拖进 DSH 就装好了。

### 5.1 安装包已经给你打好了

```
E:\MY Base Text\DeepSeek Harness\dsh-aliyun-coupon-1.3.1.tgz
```

**你不需要做任何事**，第 5.2 步直接把它拖进去就行。

### 5.2 创建 Release

1. 仓库首页右边栏，点 **Releases**（如果没有，直接访问 `https://github.com/KERBALMans/dsh-aliyun-coupon/releases/new`）
2. 按下面填：

   | 字段 | 填什么 |
   | --- | --- |
   | **Choose a tag** | 输入 `v1.3.1`，然后点下面弹出的 **Create new tag: v1.3.1 on publish** |
   | **Target** | 保持 `main` |
   | **Release title** | `v1.3.1 — 跨版本兼容 + 发布物料` |
   | **Describe this release** | 复制下面「文案 3」 |
   | **Attach binaries** | 把 `dsh-aliyun-coupon-1.3.1.tgz` 从资源管理器拖进那个虚线框 |

   **文案 3（Release 说明，整段复制）：**

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
   ```

3. 点绿色的 **Publish release**

**你应该看到：** 一个 Release 页面，标题是 `v1.3.1`，下面 `Assets` 里有一个 `dsh-aliyun-coupon-1.3.1.tgz`，大小 **880 KB** 左右。

> ⚠️ 如果 Assets 里显示的是 `0 Bytes` 或者根本没出现，说明没传完就点了发布。删掉这个 Release 重来一次，等进度条跑完再点。

---

## 第 6 步：发布前最后检查（一条一条对）

打开 `https://github.com/KERBALMans/dsh-aliyun-coupon`，逐条打勾：

- [ ] 首页能看到 **渲染出来的中文介绍**和三张截图（不是一堆纯文本）
- [ ] 文件列表里**没有** `node_modules`
- [ ] 文件列表里**没有** `.tgz`
- [ ] 右边栏 About 有中文简介，下面有一排 Topics 标签
- [ ] Releases 里有 `v1.3.1`，里面那个 `.tgz` 是 880 KB 左右
- [ ] 打开 `https://github.com/KERBALMans/dsh-aliyun-coupon/tree/main/.github` 能看到文件
- [ ] **在仓库左上角的搜索框里搜 `a1319` 和 `LTAI`，两个都显示 `0 results`** ← 这条最重要
- [ ] 用浏览器的**无痕窗口**（`Ctrl+Shift+N`）打开仓库链接，不登录也能看

全部打勾 = 发布完成，可以把链接发给别人了。

---

## 附一：如果第 7 条搜到了东西（密码泄露了）

1. **立刻去阿里云改密码**（这比什么都重要，GitHub 的历史记录删不干净，别人能翻旧版本）
2. 回来把那个文件删掉、提交
3. 如果仓库刚建、还没人 fork，最干净的办法是**整个仓库删掉重建**（就是第 0 步那套操作）

> 顺便说一句：我这边已经把整个包扫过一遍了，`index.js`、`client.js`、所有 `.md` 里**没有任何**账号密码、AccessKey（`LTAI` 开头）或你的会员名。第 7 条只是让你自己再确认一次。

---

## 附二：以后改了代码怎么更新

1. 网页上找到要改的文件，点右上角**铅笔图标**直接改（小改动够用）
2. 或者重新走一遍第 2 步的拖拽上传（大改动）
3. 改 `CHANGELOG.md`，把 `package.json` 里的 `"version"` 加一号
4. 重新打包（在 `dsh-aliyun-coupon` 目录里跑）：

   ```powershell
   & 'C:\Users\Administrator\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe' `
     'C:\Users\Administrator\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\pnpm\bin\pnpm.mjs' `
     pack --pack-destination 'E:\MY Base Text\DeepSeek Harness'
   ```

5. 按第 5 步发一个新 Release（tag 换成新版本号）

> 长期维护的话，建议装个 [GitHub Desktop](https://desktop.github.com/)，图形界面，点几下就能提交，不用记命令。

---

## 附三：文案在哪

所有要复制粘贴的成品文案（仓库简介、Topics、Release 说明、原理介绍、发帖文案）都在同一个文件里：

```
E:\MY Base Text\DeepSeek Harness\dsh-aliyun-coupon\REPO-COPY.md
```

下面「文案 1 / 文案 3」只是把最常用的两段摘出来，方便你直接复制。

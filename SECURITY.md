# 安全策略

## 这个插件会接触什么

| 数据 | 存放位置 | 是否外发 |
| --- | --- | --- |
| 阿里云账号（登录名） | 本机 DSH 凭据库，ref `ALIYUN_CONSOLE_ACCOUNT` | 否，只填入 `passport.aliyun.com` 登录表单 |
| 阿里云登录密码 | 本机 DSH 凭据库，ref `ALIYUN_CONSOLE_PASSWORD` | 否，同上 |
| 代金券余额与明细 | 本机 `~/.dsh/storages/aliyun-coupon/last-good.json` | 否，只渲染到本机面板 |
| 浏览器登录态（cookie） | 本机 `~/.dsh/storages/aliyun-coupon/` 下的独立浏览器配置目录 | 否 |

插件**没有任何外部上报端点**，不接第三方统计，不读取 DSH 会话内容。全部网络请求只有两类：一是无头浏览器访问 `*.aliyun.com`，二是客户端向本机 DSH 的 `/api/dsh-aliyun-coupon/*` 路由取数。

## 权限边界

- 插件只注册 `/api/dsh-aliyun-coupon` 前缀下的路由，并复用 DSH 的 `connection.admit` 做鉴权（签名 cookie + 活跃 Peer）。
- 老版本 DSH 缺少 `connection` 服务时会降级放行；仅在这种环境下，本机其他进程理论上可以直接请求该路由。可通过 `DSH_ALIYUN_COUPON_REQUIRE_AUTH=1` 强制要求鉴权。
- 不监听新端口，不修改系统配置，不写注册表，不装计划任务。

## 已知限制

- 阿里云的登录流程包含风控与验证码。**开启二次验证（短信 / 扫码）的账号无法纯脚本登录**，需要先用普通浏览器在该配置目录下完成一次人工验证。
- 自动化访问控制台可能触发阿里云的风控策略，请把自动刷新间隔保持在合理范围（默认 5 分钟，建议不要低于 1 分钟）。

## 报告漏洞

请不要开公开 issue。用 GitHub 的 **Security → Report a vulnerability**（私密 advisory）提交，或直接发邮件给维护者（见仓库 `package.json` 的 `author`）。

请在报告里包含：

- 受影响的版本号
- 复现步骤
- 影响范围（能否读到凭据？能否越权调用路由？能否执行任意命令？）

我们会在 7 天内回复，并在修复发布后于 CHANGELOG 里致谢（除非你希望匿名）。

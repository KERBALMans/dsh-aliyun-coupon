---
name: 问题反馈
about: 面板打不开、读不到余额、样式不对
title: "[Bug] "
labels: bug
---
现象
复现步骤
期望结果
实际结果
环境
- DSH 版本：
- 操作系统：
- 浏览器及版本：
- 插件版本（package.json 的 version）：
诊断信息
1. 兼容性自检：在 DSH 页面按 F12 打开控制台，执行
window.__dshAliyunCouponCompat
把输出整段贴上来（它会告诉你插件落在了哪个插槽上）。
2. 路由自检：把 <端口> 换成浏览器地址栏里 DSH 的端口
await (await fetch('/api/dsh-aliyun-coupon/diag')).json()
3. 控制台报错：与 dsh-aliyun-coupon 相关的红色报错。
截图
补充说明

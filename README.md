# 解案执行驾驶舱（PWA）

这是根据 `t0Pessimist20261007.docx` 制作的手机端优先执行驾驶舱。原 Word 是权威来源；网页只做执行导航、轻量记录、原文追溯。

## 文件

- `index.html`：应用入口
- `styles.css`：手机优先界面
- `app.js`：交互、记录、搜索、导入导出
- `core.js`：日期、日程、导出等纯逻辑
- `content.js`：从 Word 提取的完整原文 + 执行结构元数据
- `manifest.webmanifest`：PWA 清单
- `service-worker.js`：基础离线缓存
- `icons/`：PWA 图标
- `CONTENT_AUDIT.md`：内容结构与待确认事项
- `TEST_REPORT.md`：自测项目与结果

## 本地预览

Service Worker 不能用 `file://` 直接测试，请在本目录启动静态 HTTP 服务：

```bash
python3 -m http.server 8080
```

然后打开：`http://localhost:8080/`

## 部署

这是纯静态项目，不需要数据库或后端。把整个目录原样部署到任意 HTTPS 静态站点即可，例如 Cloudflare Pages、Netlify、Vercel、GitHub Pages 或你自己的 Nginx/Apache。

PWA 的 Service Worker 需要 HTTPS；`localhost` 是浏览器允许的开发例外。

## 添加到手机桌面

### iPhone / iPad

1. 用 Safari 打开部署后的 HTTPS 地址。
2. 点分享按钮。
3. 选择“添加到主屏幕”。
4. 从桌面打开后会以 standalone 模式运行。

### Android / Chrome

1. 用 Chrome 打开部署后的 HTTPS 地址。
2. 浏览器菜单选择“安装应用”或“添加到主屏幕”。
3. 从桌面图标打开。

首次在线打开后，核心文件会缓存；之后可基础离线打开。

## 数据保存 / 备份 / 恢复

第一版使用浏览器 `localStorage`：

- 每日任务状态
- ⭐ 现实调用记录
- 运动等“按周累计”记录

都只保存在当前浏览器 / 当前站点。

在“记录”页：

- `导出全部记录 JSON`：下载备份
- `导入记录 JSON`：在新设备 / 新浏览器恢复

部署域名变化时，浏览器会把它当成不同站点，因此建议先导出 JSON 再迁移。

## 使用边界

这个网页不是新的知识库。它只保存：原文、执行导航、每日状态、简短现实调用。周复盘、Experience / Hypothesis / Model / SOP 等不在这里建设。


## 本次已确认的执行安排

- 精神纯粹：隔两天一次。程序按每 3 个自然日一次计算，当前起算日为 `2026-10-10`。
- 执行层统一使用“日口号”这一名称；原文阅读器保留 Word 中的“运动口号”原字。
- 运动：每周约 3 次，不固定星期，在“本周需要累计”中用 `运动 +1` 记录。

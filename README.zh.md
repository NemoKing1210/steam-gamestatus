# Steam GameStatus

[English](README.md) · [Русский](README.ru.md) · **简体中文** · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Polski](README.pl.md)

[![安装用户脚本](https://img.shields.io/badge/Install-userscript-66c0f4?style=for-the-badge)](https://raw.githubusercontent.com/NemoKing1210/steam-gamestatus/main/steam-gamestatus.user.js)
[![许可证：MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![版本](https://img.shields.io/badge/version-1.13.0-green?style=for-the-badge)](CHANGELOG.md)

一款用于 Steam 商店和 Steam 社区的用户脚本，从 [GameStatus.info](https://gamestatus.info) 添加额外的游戏信息——保护状态、发行日期、评分、硬件规格等。

浏览 Steam 时，你可以在游戏卡片和游戏页面页头看到紧凑的信息徽章——无需离开商店。

兼容 [Tampermonkey](https://www.tampermonkey.net/)、[Violentmonkey](https://violentmonkey.github.io/)、[Greasemonkey](https://www.greasespot.net/)、ScriptCat 以及其他支持 `// ==UserScript==` 元数据块的用户脚本管理器。

## 快速安装

1. 安装一个用户脚本管理器（推荐 Tampermonkey 或 Violentmonkey）。
2. 点击下方的安装链接——管理器应会打开安装确认窗口。

**安装链接：**

```
https://raw.githubusercontent.com/NemoKing1210/steam-gamestatus/main/steam-gamestatus.user.js
```

[![安装](https://img.shields.io/badge/⬇_Install-Steam_GameStatus-1b2838?style=for-the-badge&labelColor=66c0f4)](https://raw.githubusercontent.com/NemoKing1210/steam-gamestatus/main/steam-gamestatus.user.js)

### 通过 URL 安装（管理面板）

| 管理器 | 路径 |
|---------|------|
| Tampermonkey | 管理面板 → **Utilities** → **Install from URL** |
| Violentmonkey | 管理面板 → **+** → **Install from URL** |
| Greasemonkey | 扩展菜单 → **New User Script** → 粘贴原始 URL |

粘贴上方的安装链接。

### 手动安装

1. 在此仓库中打开 [`steam-gamestatus.user.js`](steam-gamestatus.user.js)。
2. 复制文件的全部内容。
3. 在用户脚本管理器中新建脚本并粘贴代码。
4. 保存并启用脚本。

## 更新

脚本包含指向 GitHub 原始文件的 `@updateURL` 和 `@downloadURL` 元数据。受支持的管理器会自动检查更新（Tampermonkey：管理面板 → 检查间隔；Violentmonkey：类似）。

管理器会比较已安装的 `@version` 与远程元数据，以决定是否提供更新。

## 功能

- **设置面板** — 页头按钮，可设置徽章位置、徽章大小、卡片位置、缓存时长、清除缓存，以及是否显示“不在数据库中”的徽章
- **游戏卡片状态徽章** — 商店首页、搜索结果、愿望单、促销页面以及其他包含 `/app/{id}` 链接的列表
- **游戏页面状态徽章** — 位于 `.apphub_OtherSiteInfo` 中、Community Hub / Store Page 链接旁的紧凑徽章
- **丰富的提示框** — Steam 风格的弹出卡片，包含封面、状态标签、彩色评分和硬件详情
- **状态颜色编码** — 快速浏览长游戏列表
- **懒加载** — 只有当卡片滚动进入视野时才加载徽章
- **智能缓存** — 响应会缓存在本地，以减少 API 负载并加快重复访问
- **Steam 风格 UI** — 徽章样式类似 Steam `.app_tag`，提示框类似商店悬停弹窗
- **10 种界面语言** — 英语、俄语、中文、西班牙语、葡萄牙语、德语、法语、日语、韩语、波兰语（根据浏览器语言自动检测）

## 支持的页面

| 网站 | URL 模式 |
|------|-------------|
| Steam 商店 | `https://store.steampowered.com/*` |
| Steam 社区（游戏中心） | `https://steamcommunity.com/app/*` |

## 状态颜色

每个徽章都有一个彩色圆点，反映游戏在 GameStatus.info 上的状态：

| 颜色 | 状态 | 含义 |
|-------|--------|---------|
| 绿色 | 就绪 | 状态表示游戏已就绪 / 可用 |
| 橙色 | 待定（近期） | 状态为待定；游戏发布不足一个月 |
| 红色 | 待定（长期） | 状态为待定；游戏发布超过一个月 |
| 橙色 | 保护绕过 | 状态表示存在保护绕过方法 |
| 蓝色 | 今日发售 | 游戏今天发售；状态可能仍为等待中 |
| 灰色 | 状态未知 / 未收录 | 状态不明，或游戏未在 GameStatus.info 找到 |
| 蓝色（旋转） | 加载中 | 正在从 API 获取数据 |

点击徽章会在 GameStatus.info 上打开游戏页面（如果未找到游戏，则打开网站首页）。

## 提示框内容

将鼠标悬停在徽章上会打开 Steam 风格的弹出卡片，其中可能显示：

- **头部** — 封面、标题、状态标签、AAA / 保护 / 小组标签
- **日期** — 发行日期和状态更新日期、Steam ID、订阅数
- **评分** — GameStatus 和 Metacritic 数值，采用 Metacritic 风格颜色（绿色 ≥75，黄色 ≥50，红色低于）
- **硬件** — CPU、RAM、GPU、操作系统（如有）
- **描述** — 游戏简介
- **页脚** — 支持按钮以及 API / GameStatus 链接

如果游戏不在数据库中，弹窗会显示“未收录”标签，并列出查找时尝试过的 API URL。

## 设置

打开 Steam 页头中的 **GameStatus**（或用户脚本管理器菜单）以配置：

| 设置 | 默认值 | 说明 |
|---------|---------|--------|
| 徽章位置（垂直 / 水平） | 顶部 / 左侧 | 仅适用于卡片徽章；游戏页面徽章保留在页头 |
| 卡片位置 | 左侧 | GameStatus 卡片在游戏旁打开的位置；空间不足时翻转到另一侧 |
| 徽章大小 | 中 | 小 / 中 / 大 / 特大；仅适用于卡片徽章 |
| 显示“未收录”徽章 | 开 | 关闭后，未匹配的游戏卡片不显示标记 |
| 缓存时长（小时） | 6 | 适用于所有缓存查询；最大 168（7 天） |
| 清除缓存 | — | 立即生效；无需保存 |

## 面向开发者

本节已移至专门指南：

- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) — 构建、本地测试、配置、发布
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — 工作原理、仓库结构、元数据、权限
- [CONTRIBUTING.md](CONTRIBUTING.md) — 贡献流程与 PR 检查清单
- [AGENTS.md](AGENTS.md) — AI 编码代理说明
- [SECURITY.md](SECURITY.md) — 安全策略与私下报告

## 数据来源

所有游戏数据都来自公开的 GameStatus.info API：

```
GET https://gamestatus.info/back/api/gameinfo/game/{slug}/
```

本项目与 Valve、Steam 或 GameStatus.info **无关联**。状态信息由社区维护，可能不完整或过时。请将其作为参考，而非保证。

## 许可证

[MIT](LICENSE) — Copyright (c) 2026 NemoKing

# AnyNook 远程分流规则

六份静态规则，共 9,981 条。主配置只引用远程列表，不需要粘贴规则正文或创建独立的 Telegram、YouTube、GlobalMedia 策略组。

六份列表独立托管在 [atopsecret/Rules](https://github.com/atopsecret/Rules)，不依赖旧 `SurgeRules` 或 `SurgeScripts` 的旧列表。没有搜索程序、定时更新或 GitHub Actions；后续修改使用手动提交。

## 引用

将以下六行放在 Surge 的 `[Rule]` 中，保留现有私人例外的优先级，并置于 `GEOIP,CN,DIRECT`、`FINAL` 之前：

```ini
RULE-SET,https://raw.githubusercontent.com/atopsecret/Rules/main/Ads.list,REJECT,extended-matching
RULE-SET,https://raw.githubusercontent.com/atopsecret/Rules/main/AI.list,Intelligence,extended-matching
RULE-SET,https://raw.githubusercontent.com/atopsecret/Rules/main/Binance.list,Binance
RULE-SET,https://raw.githubusercontent.com/atopsecret/Rules/main/Apple.list,Apple
RULE-SET,https://raw.githubusercontent.com/atopsecret/Rules/main/Domestic.list,DIRECT,extended-matching
RULE-SET,https://raw.githubusercontent.com/atopsecret/Rules/main/Proxy.list,Proxy,extended-matching
```

`Intelligence`、`Binance`、`Apple`、`Proxy` 必须是主配置中已有的策略名。列表不创建策略组、不包含节点，也不指定出口地区。

这六行是引用示例，不是完整配置。已有的 NAS、局域网、私人域名和其他例外应留在原位置；不要用示例覆盖它们。

## 列表范围

Egern 使用[原生 YAML 版本](egern/README.md)。六份原生集合与下面的 Surge 列表条件等价，策略仍由主配置指定；旧 `.list` 地址保持不变。

- [Ads.list](Ads.list)：6,319 条广告域名规则。只采用可明确转换的域名阻断，不导入网页元素规则、宽泛关键词或广告 IP 段。
- [AI.list](AI.list)：70 条海外 AI 服务规则，使用 `Intelligence`。不把整个 Google、Microsoft 或 GitHub 平台放进 AI 分流。
- [Binance.list](Binance.list)：49 条 Binance 服务规则。
- [Apple.list](Apple.list)：107 条 Apple 服务规则。Apple 的 ChatGPT relay 已划入 `AI.list`，区域检测域名仍由 Apple 策略处理。
- [Domestic.list](Domestic.list)：1,756 条国内服务域名规则，使用 `DIRECT`，不携带大规模中国 IP 列表。
- [Proxy.list](Proxy.list)：1,680 条普通代理规则，包含常用海外平台、YouTube、Telegram 与海外媒体。Telegram 的 14 个官网网段使用 `no-resolve`。

规则按当前分流范围筛选、去重；它们不是上游列表的全量镜像。国内 AI 域名由 `Domestic.list` 处理，海外 AI 域名由 `AI.list` 处理。

2026-11-14 分类修正：ABC 美国媒体的 `abc.com`、`abcnews.com`、`abc-studios.com`、`edgedatg.com` 后缀归入 `Proxy.list`。`AI.list` 仅精确补充 `trae-api-sg.mchost.guru`，利用现有 AI 先于 Domestic 的顺序匹配；`mchost.guru` 和国内 Trae 后缀仍保留在 Domestic。

## 来源与校验

快照日期：2026-11-05。固定提交、筛选说明和许可证见 [NOTICE.md](NOTICE.md)；条数、文件哈希和来源映射见 [manifest.json](manifest.json)。

下载文件后可核对哈希：

```sh
shasum -a 256 -c SHA256SUMS
```

六份 `.list` 仅包含公开规则及来源说明。完整客户端配置、节点、凭据、证书和私人路由不在此目录。

使用 Node.js 20 或更新版本运行 `node --test tests/rules.test.mjs`，可复跑仓库内的分类、Surge/Egern 条件一致性及 metadata 校验。银行 DIRECT 回归使用主配置已有 Banking 例外的固定测试条件，不声称 Domestic 包含银行条目。历史说明中的 138 项检查脚本未随仓库提供；当前测试数量以实际运行输出为准。离线校验不代表手机已刷新远程资源或完成运行验收。

Surge 语法依据：[Rule Set](https://manual.nssurge.com/rules/ruleset.html)。客户端会缓存远程列表，更新后如仍使用旧内容，可在 Surge 内刷新对应外部资源。

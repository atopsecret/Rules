# Egern 原生远程规则

六份核心 YAML 与上一级六份 Surge `.list` 使用同一批静态条件，共 9,980 条。这六份只做格式转换，不另抓取社区内容，不带节点、策略或私人配置。下方的局域网辅助集合和可选 TikTok 集合单独计数。

## 引用

在 Egern 主配置的 `rules` 中保留私人例外，再添加这六条引用；国内 GeoIP 和最终兜底留在它们后面。

```yaml
rules:
  - rule_set:
      name: 广告
      match: https://raw.githubusercontent.com/atopsecret/Rules/main/egern/Ads.yaml
      policy: REJECT
      update_interval: 86400
  - rule_set:
      name: 海外 AI
      match: https://raw.githubusercontent.com/atopsecret/Rules/main/egern/AI.yaml
      policy: Intelligence
      update_interval: 86400
  - rule_set:
      name: Binance
      match: https://raw.githubusercontent.com/atopsecret/Rules/main/egern/Binance.yaml
      policy: Binance
      update_interval: 86400
  - rule_set:
      name: Apple
      match: https://raw.githubusercontent.com/atopsecret/Rules/main/egern/Apple.yaml
      policy: Apple
      update_interval: 86400
  - rule_set:
      name: 国内服务
      match: https://raw.githubusercontent.com/atopsecret/Rules/main/egern/Domestic.yaml
      policy: DIRECT
      update_interval: 86400
  - rule_set:
      name: 普通代理
      match: https://raw.githubusercontent.com/atopsecret/Rules/main/egern/Proxy.yaml
      policy: Proxy
      update_interval: 86400
```

示例不是完整配置。策略名必须已存在。普通代理集合包含 Telegram、YouTube 和海外媒体，不要求建立独立策略组。

## 格式、来源与校验

使用官方[原生规则集合格式](https://egernapp.com/docs/configuration/rules/#rule-sets)：`domain_set`、`domain_suffix_set`、`ip_cidr_set`、`ip_cidr6_set`。Proxy 的 14 个 Telegram 网段保留 `no_resolve: true`，不为域名匹配额外触发 IP 解析。

各 YAML 文件保留对应 `.list` 的来源和许可证注释。详细许可仍以 [NOTICE.md](../NOTICE.md) 和 [licenses](../licenses/) 为准；不是把所有内容统一重新授权为 MIT。

[manifest.json](manifest.json) 记录原始列表哈希、原生文件哈希、条数和条件哈希。在本目录运行：

```sh
shasum -a 256 -c SHA256SUMS
```

`update_interval` 只让客户端刷新已发布静态文件，GitHub 仓库没有搜索程序、自动生成工作流或计划任务。静态检查不代替 Egern 导入和实际路由验收。

## 局域网辅助集合

[LAN.yaml](LAN.yaml) 与 [LAN-no-resolve.yaml](LAN-no-resolve.yaml) 各含同样 14 条条件，分别对应原配置两次内置 `LAN` 引用的解析行为。它们不是第七批社区规则，而是显式保留原 Surge 内置局域网范围；这 14 条地址/域名条件不计入上面六份列表的 9,980 条。

主配置中 Tailscale 域名与地址段必须放在 LAN 之前。内置 LAN 范围包含 `100.64.0.0/10` 和 IPv6 ULA；如果先用 LAN 直连，它会抢走 Tailnet 流量。

## 可选 TikTok 独立分流

[TikTok.yaml](TikTok.yaml) 含 34 条 TikTok 专用域名及指定 CDN 条件，筛选自上述 V2Fly 固定提交的 `data/tiktok`，沿用 MIT 通知。它不计入六份核心列表的 9,980 条。

在主配置中先创建名为 `TikTok` 的手动选择策略组，放入自己可用的节点，再将下面的引用放在广告规则之后、国内服务与普通代理规则之前：

```yaml
- rule_set:
    name: TikTok
    match: https://raw.githubusercontent.com/atopsecret/Rules/main/egern/TikTok.yaml
    policy: TikTok
    update_interval: 86400
```

集合不包含字节公共根域名、CapCut 或 Trae 域名，不会因共享父域将国内抖音一并分入 TikTok；广告阻断仍先匹配。此配置只选择出口，不进行 HTTPS 解密、地区重写或解锁检测。能否播放取决于实际节点与 App 环境。

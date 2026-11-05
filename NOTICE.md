# 来源、修改与许可证

本仓库保存 2026-11-05 生成的静态规则源文件。与上游原文相比，修改包括格式转换、按服务范围筛选、补充公开服务域名、删除重复和被父后缀覆盖的条目。每份 `.list` 的注释标明来源与修改日期。

各来源的版权与许可证保留，不因存放在本仓库而统一变成其他许可证。新增说明不替代上游授权条款。

## Ads.list

来源：

- [TG-Twilight/AWAvenue-Ads-Rule](https://github.com/TG-Twilight/AWAvenue-Ads-Rule/tree/72dd30fb6d5e2ff7b5bcdbecf164d288f41d9dfa)，固定提交 `72dd30fb6d5e2ff7b5bcdbecf164d288f41d9dfa`。使用 `Filters/AWAvenue-Ads-Rule-Surge-RULE-SET-Only.Ads.list`，不是会员推广全量集合。许可证：[GNU GPL v3 原文](licenses/AWAvenue-GPL-3.0.txt)。
- [easylist/easylistchina](https://github.com/easylist/easylistchina/tree/4c773f8b44478a3cb975580c95eca9aa5e985b2c)，固定提交 `4c773f8b44478a3cb975580c95eca9aa5e985b2c`。使用 `easylistchina.txt`。署名：The EasyList authors（[easylist.to](https://easylist.to/)）。按上游[双许可说明](https://easylist.to/pages/licence.html)选择 GNU GPL v3 或更新版本这一分支；GPL v3 原文与上述副本一致。

本文件按 GPL v3 分发。只转换无条件的域名阻断；上下文修饰、URL 路径、通配模式和页面元素规则不转换。域名例外保守地保护整个域名，另保护必要的支付、登录、推送、地图和 AI 服务主机。

## AI.list 与 Binance.list

来源：

- [blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script/tree/0b6897dc17e0c513d25449c935a9694818e32f0c)，作者 blackmatrix7，固定提交 `0b6897dc17e0c513d25449c935a9694818e32f0c`。使用 `rule/Surge/` 下的 OpenAI、Claude、Anthropic、Gemini、Copilot、Binance 列表。许可证：[GNU GPL v2 原文](licenses/blackmatrix7-GPL-2.0.txt)。
- [v2fly/domain-list-community](https://github.com/v2fly/domain-list-community/tree/3895d9a3a76de2c1598a10c5fefc38e3481117fa)，固定提交 `3895d9a3a76de2c1598a10c5fefc38e3481117fa`。Copyright (c) 2018-2019 V2Ray。许可证：[MIT 原文](licenses/V2Fly-MIT.txt)。

这两份派生列表按 GPL v2 分发，同时保留 V2Fly 的 MIT 通知。AI 列表只保留明确属于 AI 的命名空间；共享平台根域名、第三方统计和 Apple 区域检测域名不纳入 AI 分流。不导入上游的关键词、正则、ASN、进程或宽泛 IP 规则。

## Apple.list、Domestic.list 与 Proxy.list

域名来源为上述固定提交的 V2Fly 社区列表，保留其 [MIT 许可证与版权通知](licenses/V2Fly-MIT.txt)。递归展开服务分类中的 `include`，保留明确域名和域名后缀，不展开关键词或正则。服务分流不引入上游标记为广告或遥测的域名；国内分流还排除标为海外的服务。

`Proxy.list` 另包含 Telegram 官方公开的 14 个网络段，来源：[core.telegram.org/resources/cidr.txt](https://core.telegram.org/resources/cidr.txt)。本次抓取内容的 SHA256 记录在 manifest 中；CIDR 以 `IP-CIDR` 或 `IP-CIDR6` 表达，并附 `no-resolve`。不将 V2Fly 的 MIT 许可声称为 Telegram 网站内容的授权。

其他新增条目是公开服务域名和域名后缀，不含用户的私人域名、设备地址或客户端凭据。

## 维护方式

本目录只发布静态规则，不运行搜索程序、计划任务或自动同步。更改规则时更新注释、条数、manifest 和 `SHA256SUMS`，再手动提交。`.list` 本身是可直接编辑的文本源文件；上面的固定提交链接保留对应上游原文与许可证。

# CordisX Channel

Channel 提供 CordisX 内的渠道账号、运行状态、日志和 Session binding 管理界面。
本版本包含本地 Simulator adapter；真实渠道的凭据和 transport 继续由 Host 负责。

## 安装

插件 ID：`channel`。当前版本：`0.1.1`。

CordisX Community Marketplace feed 必须先完成配置并启用，`--source` 才能选择它：

```sh
FEED_URL=https://raw.githubusercontent.com/cordisx/marketplace/main/marketplace.json
npx cordisx@beta source add "$FEED_URL" --yes
npx cordisx@beta plugin install channel --source "$FEED_URL" --version 0.1.1
```

若该 feed 已启用，可跳过 `source add`。使用其他 profile 时，两条命令都要添加
相同的 `--profile <profile>`。`--yes` 只确认来源变更，不会批准插件权限；发现来源
也不等同于 trust root。

Marketplace 条目列出 `0.1.1` artifact 后，安装命令才可用。在此之前，可从
[GitHub Release](https://github.com/cordisx/plugin-channel/releases/tag/v0.1.1)
下载压缩包与 `SHA256SUMS`。

## 使用

在 CordisX 中打开 Channel Manager 查看可用账号。进入账号后，可以检查配置、运行
计数、日志和 Session binding，并且只执行 Host 为该账号开放的操作。

内置 Simulator connection 使用固定的本地目标 `simulator/local/test`。创建 Feishu
或 Lark connection 时仍会进入 Host 管理的凭据捕获流程；插件不会保存渠道凭据，也
不实现这些渠道的 transport。

## 配置

Channel service 在插件重启时读取 Host 提供的
`cordisx.channel-service-config/v1` 配置。请通过 CordisX 配置 connection。插件只会
注册已启用且符合声明 scope 的 Simulator definition；配置格式错误或 revision 无效
时会 fail closed。

## 权限与限制

账号读取权限是必需的。连接、接收、订阅、发送、binding 读写和附件读取均为独立的
可选权限。包内 Simulator scope 仅覆盖本地测试 tenant 和 direct test conversation。
启用前请检查插件请求的权限。

凭据、原生集成、下载、无障碍、导航历史和 Channel runtime 均由 Host 负责。不支持
或不可用的操作会保持禁用，不会回退到私有 API。

## 排错

- **找不到 `0.1.1`：**确认 Marketplace 条目已列出 release artifact；`--source`
  不会添加或修复 feed。
- **没有账号：**检查账号读取权限和已启用的 Host Channel service 配置。
- **操作按钮不可用：**Host 未为当前账号开放该操作，或对应权限尚未启用。
- **Simulator 不可用：**确认 adapter、account 和 tenant 分别为 `simulator`、`local`
  和 `test`。

## 许可证

Channel 使用 [AGPL-3.0-or-later](LICENSE)。第三方声明见
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。维护者环境、检查和发布步骤见
[AGENTS.md](AGENTS.md)。

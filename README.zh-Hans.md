# CordisX Channel

Channel 提供 CordisX 内的渠道账号、运行状态、日志和 Session binding 管理界面。
本版本包含本地 Simulator adapter；真实渠道的凭据和 transport 继续由 Host 负责。

## 安装

插件 ID：`channel`。当前版本：`0.1.6`。

CordisX Community Marketplace feed 必须先完成配置并启用，`--source` 才能选择它：

```sh
FEED_URL=https://raw.githubusercontent.com/cordisx/marketplace/main/marketplace.json
npx cordisx@beta source add "$FEED_URL" --yes
npx cordisx@beta plugin install channel --source "$FEED_URL" --version 0.1.6
```

若该 feed 已启用，可跳过 `source add`。使用其他 profile 时，两条命令都要添加
相同的 `--profile <profile>`。`--yes` 只确认来源变更，不会批准插件权限；发现来源
也不等同于 trust root。

Marketplace 条目列出 `0.1.6` artifact 后，安装命令才可用。在此之前，可从
[GitHub Release](https://github.com/cordisx/plugin-channel/releases/tag/v0.1.6)
下载压缩包与 `SHA256SUMS`。

## 使用

在 CordisX 中打开 Channel Manager 查看可用账号。进入账号后，可以检查配置、运行
计数、日志和 Session binding，并且只执行 Host 为该账号开放的操作。

统一设置中的「续接」默认关闭。启用后默认比例为实际原生自动压缩阈值的 90%，
最高 95%；例如阈值为 80K token、比例为 50% 时，触发量为 40K。单个 Session 的
明确覆盖优先于 profile 默认值。新任务准备就绪后才接管旧任务；由于原生用量事件
存在时机限制，不能保证阻止自动压缩。运行中的 Host 未提供表单时会显示不可用。

内置 Simulator connection 使用固定的本地目标 `simulator/local/test`。创建 Feishu
或 Lark connection 时仍会进入 Host 管理的凭据捕获流程；插件不会保存渠道凭据，也
不实现这些渠道的 transport。

## 配置

Channel service 在插件重启时读取 Host 提供的
`cordisx.channel-service-config/v1` 配置。请通过 CordisX 配置 connection。插件只会
注册已启用且符合声明 scope 的 Simulator definition；配置格式错误或 revision 无效
时会 fail closed。

## 权限与限制

Channel 通过公开的 `channel-manager/v5` 自有服务接口管理自己的账号、连接和绑定，
内部调用无需权限审批。其他插件使用独立授权的委托接口。接收、订阅、发送和附件
读取仍有独立范围；包内 Simulator scope 仅覆盖本地测试 tenant 和 direct test
conversation。启用前请检查这些权限。

支持租户待识别的 Host 会保留应用凭据验证成功、但租户查询失败的连接。打开该连接
配置，可手动填写 tenant key，或按 Host 提示申请权限后重试；识别完成后才开始收发。
旧版 Host 不提供此恢复流程，相关 Host 版本独立于本插件发布。

凭据、原生集成、下载、无障碍、导航历史和 Channel runtime 均由 Host 负责。不支持
或不可用的操作会保持禁用，不会回退到私有 API。

## 排错

- **找不到 `0.1.6`：**确认 Marketplace 条目已列出 release artifact；`--source`
  不会添加或修复 feed。
- **没有账号：**检查 Host 是否支持 `channel-manager/v5`，以及当前 profile 的 Channel
  service 是否已启动。
- **操作按钮不可用：**Host 未为当前账号开放该操作，或服务不可用。
- **Simulator 不可用：**确认 adapter、account 和 tenant 分别为 `simulator`、`local`
  和 `test`。

## 许可证

Channel 使用 [AGPL-3.0-or-later](LICENSE)。第三方声明见
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。维护者环境、检查和发布步骤见
[AGENTS.md](AGENTS.md)。

随包独立文档：[使用指南](docs/usage.md)、[指令速查](docs/commands.md)、[发送排障](docs/troubleshooting.md)。

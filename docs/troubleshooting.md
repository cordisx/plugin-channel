# Channel 发送排障经验

适用于通过运行中 CordisX profile 发送消息的 Channel CLI。先读结构化 code 和 submitted 状态，不为一句消息反复读源码或换指令。

## 身份无法核验

CHANNEL_HOST_IDENTITY_UNVERIFIABLE 表示当前执行环境无法确认 Host 进程身份，不能直接说服务没运行。这时尚未提交消息。核对聊天执行权限和当前 CLI 的 CORDISX_HOME/profile。已观察到同一条完整 send 命令在受限环境失败，正常授权后成功；没有底层 syscall 证据时，不指定某个具体系统调用为根因，也不把整个等待时长算成权限问题。

## 服务与连接

CHANNEL_RUNTIME_NOT_RUNNING 是没有对应 profile 的运行入口；CHANNEL_HOST_IDENTITY_STALE 是端点身份已过期；CHANNEL_RUNTIME_SCOPE_MISMATCH 是配置根或 profile 不一致。只检查并正常恢复目标实例。RPC_PERMISSION_DENIED 是环境拒绝访问 Host socket，RPC_UNAVAILABLE 是连接无法建立。

## 飞书连接已配置，但没有回复

按顺序检查，不要因为没有回复就重新创建连接或扩大权限：

1. 用运行中 Host 对应的 CLI、home 和 profile 查看连接状态；`ready` 只表示连接就绪，不证明消息已接收或模型已回复。同一飞书应用若在两处同时建立长连接，事件可能被其中一处消费；部署迁移前先核对旧实例，使用不同应用可分离环境。
2. 用该应用检查事件订阅、实际会话所需权限、应用发布版本和机器人是否在目标群中。飞书 / Lark 接收消息事件为 `im.message.receive_v1`；保存草稿不等于发布到当前租户。凭据认证成功也不代表已订阅事件。
3. 在允许的私聊或群中发送一条无敏感内容的测试消息；群聊遵循当前的 @、唤醒词和命令规则。区分平台未投递、规则拒绝、已接收但未派发、任务失败、发送失败及结果未知；本地保留记录不是平台完整历史。
4. 核对来源账号、租户、用户和会话的接收及任务策略、绑定状态和自动回复开关。管理员命令、触发任务及修改模型等权限分别判断；允许一项不代表允许其他项。任务已完成仍需实际发送回执或飞书端回读，才能确认回复送达。

不要在日志、截图或共享文档中暴露应用密钥、令牌、聊天正文或完整身份信息。查询与设置入口以运行中版本的 `cordisx channel help` 为准；插件文档不能替旧 Host 增加能力。

## 引用消息内容缺失

引用本身不保证应用有读取原消息的权限。支持的 Host 会将可读取的直接引用及发送者信息放入 `messageContext.referencedMessage`；它没有内容时应区分旧版本不支持、权限不足、已删除或查询失败，不要推断正文或发送者。需要继续查看上层引用时，使用该任务提供的来源账号、会话和上下文，按 [Host Channel 指南](https://github.com/cordisx/cordisx/blob/main/.agents/docs/channel-cli.md) 的 `message-get` 逐条读取所需父消息；仅此成功不代表可读取整个群历史。不可用时请用户提供缺失内容，不切换其他身份绕过权限。

## 已提交但结果未知

RPC_RESULT_UNKNOWN 或部分返回不能证明已发送，也不证明没有发送。保留同一个 operationId，查询 receipt；多目标保留原顺序和 targetCount。sent 才是发送证据；缺失回执明确为 null/not-found，pending 等待，unknown 核对后再决定。不创建一个新 operationId 盲重试。

## 模型与外部消息

模型 final、commentary、stop 不是 CLI 发送证据。autoReply 默认关闭；显式发送收据与模型完成分别查看。原生权限请求可在飞书卡片或 /approvals 感知，批准提交后仍等原生确认。不要把账号授权、插件权限和聊天执行权限混为一谈。

CHANNEL_CONTEXT_UNAVAILABLE 表示当前入站身份关联已失效或不匹配。使用该 turn 提供的 --context 和精确 CLI，不沿用上一条消息的上下文。MODEL_CHANGE_PERMISSION_DENIED 表示批准者缺少本次字段／服务商／模型权限；不能改用普通 /approve 绕过。REVISION_CONFLICT 表示原生或保存配置已变化，应重新读取后发起新申请。NATIVE_EFFECT_UNCERTAIN 表示执行结果未知，先核对真实配置，不自动重复修改。

`CHANNEL_REMOTE_HISTORY_PERMISSION_DENIED` 表示所选机器人应用无法读取远端历史，不代表群内没有消息。参照 [Host Channel 指南](https://github.com/cordisx/cordisx/blob/main/.agents/docs/channel-cli.md) 检查同一应用的消息权限、群成员身份和发布状态；不要切换到其他用户身份绕过。`CHANNEL_REMOTE_HISTORY_TIMEOUT` 表示查询超时，可在确认需求后缩小时间范围重试。

短期令牌不等于临时授予机器人应用权限。另行使用用户身份时，官方 Lark CLI 的设备授权当前会请求 `offline_access`，并保存令牌及更新该 profile 的登录用户；它不是一次后自动清除的授权。按需要检查和管理授权生命周期，且不要把用户授权当作机器人缺失权限的替代。实现细节见官方 CLI 的[设备授权](https://github.com/larksuite/cli/blob/main/internal/auth/device_flow.go)和[登录流程](https://github.com/larksuite/cli/blob/main/cmd/auth/login.go)。

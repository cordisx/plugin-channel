# Channel 发送排障经验

适用于通过运行中 CordisX profile 发送消息的 Channel CLI。先读结构化 code 和 submitted 状态，不为一句消息反复读源码或换指令。

## 身份无法核验

CHANNEL_HOST_IDENTITY_UNVERIFIABLE 表示当前执行环境无法确认 Host 进程身份，不能直接说服务没运行。这时尚未提交消息。核对聊天执行权限和当前 CLI 的 CORDISX_HOME/profile。已观察到同一条完整 send 命令在受限环境失败，正常授权后成功；没有底层 syscall 证据时，不指定某个具体系统调用为根因，也不把整个等待时长算成权限问题。

## 服务与连接

CHANNEL_RUNTIME_NOT_RUNNING 是没有对应 profile 的运行入口；CHANNEL_HOST_IDENTITY_STALE 是端点身份已过期；CHANNEL_RUNTIME_SCOPE_MISMATCH 是配置根或 profile 不一致。只检查并正常恢复目标实例。RPC_PERMISSION_DENIED 是环境拒绝访问 Host socket，RPC_UNAVAILABLE 是连接无法建立。

## 已提交但结果未知

RPC_RESULT_UNKNOWN 或部分返回不能证明已发送，也不证明没有发送。保留同一个 operationId，查询 receipt；多目标保留原顺序和 targetCount。sent 才是发送证据；缺失回执明确为 null/not-found，pending 等待，unknown 核对后再决定。不创建一个新 operationId 盲重试。

## 模型与外部消息

模型 final、commentary、stop 不是 CLI 发送证据。autoReply 默认关闭；显式发送收据与模型完成分别查看。原生权限请求可在飞书卡片或 /approvals 感知，批准提交后仍等原生确认。不要把账号授权、插件权限和聊天执行权限混为一谈。

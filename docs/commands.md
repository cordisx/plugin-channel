# Channel 指令速查

- /help [指令]：可用指令和参数。
- /bind 对话ID、/bind new：绑定或创建新对话。
- /unbind [对话ID | --all]、/bind-status：解除／查看绑定。
- /permissions [inherit | read-only | workspace-write | full-access] [--approval inherit|untrusted|on-request|never] [--target ID | --all]：读取／保存执行设置。
- /work-mode [inherit | default | plan] [--effort inherit|low|medium|high|max] [--target ID | --all]：读取／保存工作模式和思考强度。
- /choose 选择码 all 或 序号[,序号]：继续本人的多目标操作。
- /approvals、/approve [编号] [once | session]、/deny [编号]：原生审批。
- /messages-on [--global]、/messages-off [--global]、/messages-status：消息投递控制。
- /allow-user、/deny-user、/reset-user：按 @、用户名或用户ID指定对象，同名提供候选。
- /wake 前缀 [--global]、/wake --clear：唤醒词。

写操作需要用户组与指令规则授权。未知指令由 Host 提示，不交给模型猜。通过运行中的精确 CLI 使用 help 操作名查看 JSON 参数；权限策略和模型目录仍由 Host 决定。

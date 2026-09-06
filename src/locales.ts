export type CopyKey =
  | "accounts"
  | "accounts.empty"
  | "create"
  | "create.description"
  | "create.groups"
  | "create.name"
  | "create.platform"
  | "create.save"
  | "create.unavailable"
  | "configuration"
  | "configuration.description"
  | "configuration.save"
  | "empty.search"
  | "export"
  | "logs"
  | "logs.empty"
  | "logs.load-more"
  | "runtime"
  | "sessions"
  | "sessions.empty"
  | "status.generation"
  | "status.inbound"
  | "status.outbound"
  | "status.state";

const EN: Record<CopyKey, string> = {
  accounts: "Channel accounts",
  "accounts.empty": "No channel accounts are available.",
  create: "New channel",
  "create.description": "Create a simulator connection or continue through Host-owned credential capture.",
  "create.groups": "Allow group messages",
  "create.name": "Display name",
  "create.platform": "Platform",
  "create.save": "Create channel",
  "create.unavailable": "Channel creation is unavailable.",
  configuration: "Configuration",
  "configuration.description": "Update the safe display settings or run an available connection action.",
  "configuration.save": "Save configuration",
  "empty.search": "No channel accounts match this search.",
  export: "Export",
  logs: "Logs",
  "logs.empty": "No safe log entries are available.",
  "logs.load-more": "Load more",
  runtime: "Runtime status",
  sessions: "Connections & sessions",
  "sessions.empty": "No session bindings are available.",
  "status.generation": "Generation",
  "status.inbound": "Inbound queued",
  "status.outbound": "Outbound queued",
  "status.state": "State",
};

const ZH: Record<CopyKey, string> = {
  accounts: "渠道账号",
  "accounts.empty": "暂无可用渠道账号。",
  create: "新建渠道",
  "create.description": "创建模拟器连接，或继续使用 Host 所有的凭据捕获。",
  "create.groups": "允许群消息",
  "create.name": "显示名称",
  "create.platform": "平台",
  "create.save": "创建渠道",
  "create.unavailable": "当前无法创建渠道。",
  configuration: "配置",
  "configuration.description": "更新安全显示设置，或执行当前可用的连接操作。",
  "configuration.save": "保存配置",
  "empty.search": "没有匹配搜索条件的渠道账号。",
  export: "导出",
  logs: "日志",
  "logs.empty": "暂无安全日志记录。",
  "logs.load-more": "加载更多",
  runtime: "运行状态",
  sessions: "连接与会话",
  "sessions.empty": "暂无会话绑定。",
  "status.generation": "代次",
  "status.inbound": "入站队列",
  "status.outbound": "出站队列",
  "status.state": "状态",
};

export function copy(locale: string, key: CopyKey): string {
  return (locale.startsWith("zh") ? ZH : EN)[key];
}

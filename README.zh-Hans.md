# CordisX 渠道插件

此公开仓库是 CordisX Channel 管理插件的 owner。仓库保留了原 Host 内置目录截至
Host 提交 `1cbe9d0ff1a803b1486bb2ddcbedc98a187d4f11` 的筛选 Git 作者历史。
仓库继续采用该来源历史的 AGPL-3.0-or-later 许可证。

## 当前检查点

仓库现在已经构建出可执行插件候选。原内置实现依赖 Host 私有 renderer、
service-config、凭据与 Channel Manager 模块。这些文件只保留在 Git 历史中，已经
从公开源码树删除。

候选已消费正式 Protocol Channel Manager v2 类型
`9654023d1b1077d6fd0d43a2d294459bab63216b`，以及正式 Host provider
`4a33f62bb087ce410ebb1e3f2341f08c3968fce5`。

具体边界与交付顺序见 [MIGRATION.md](MIGRATION.md)。

## 所有权

本插件将负责本地化 Channel route、页面 body 表现、view model、唯一 page factory
与 lifecycle，以及 `src/channel.css`。

CordisX Host 继续负责 Manager chrome 与历史、凭据捕获、下载处理、语义 UI
primitive、无障碍策略、原生集成和 Channel runtime/provider adapter。插件不会导入
Host 私有文件，也不会携带凭据、原始账号标识、文件系统路径、DOM handle 或
transport callback。

初始 package 保持 `0.0.0` 且 `private: true`，防止公共 seam 与可执行 package
graph 完成前被误发布。

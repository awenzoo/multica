# 侧边栏 Chat 菜单项

> 日期：2026-05-07

---

## 在侧边栏添加 Chat 菜单按钮

### 背景
用户希望在侧边栏能快速打开并最大化聊天悬浮框，无需先找到右下角的 FAB 按钮。

### 方案
在 SidebarHeader 区域（搜索框之前）添加 Chat 菜单项，点击后调用 `useChatStore` 的 `setOpen(true)` + `setExpanded(true)` 打开并最大化聊天窗口。

关键设计决策：
- **提取为独立 `ChatMenuItem` 组件**（而非内联在 personalNav 循环中），因为它不走路由导航，而是触发 store action
- **使用 `useChatStore.getState()` 命令式调用**，与文件中已有的 `useModalStore.getState().open(...)` 模式一致
- **添加激活态高亮**：当 `isOpen && isExpanded` 时菜单项显示 active 样式，给用户视觉反馈
- **位置调整**：最初放在 personalNav 区域（My Issues 下方），后按用户要求移至搜索框之前（SidebarHeader 区域）

### 涉及文件
- `packages/views/layout/app-sidebar.tsx` — 新增 `ChatMenuItem` 组件和 `useChatStore` / `MessageCircle` 导入
- `packages/views/locales/en/layout.json` — 添加 `"chat": "Chat"`
- `packages/views/locales/zh-Hans/layout.json` — 添加 `"chat": "聊天"`
- `packages/views/layout/app-sidebar.test.tsx` — 新增 ChatMenuItem 测试

### 关联 commit
- `cb1b6f8b feat(sidebar): add Chat menu item below My Issues that maximizes chat widget`
- `0296f76e feat(sidebar): add active state for Chat menu, add tests, move Chat before search slot`

---

## Code Review 反馈及修复

### 问题 1：缺少激活态高亮
Chat 菜单项没有 active 状态，用户打开聊天后侧边栏无视觉反馈。提取为 `ChatMenuItem` 组件后通过 `useChatStore` 读取 `isOpen` 和 `isExpanded`，传入 `isActive` prop。

### 问题 2：缺少测试
新增测试覆盖：
- 渲染 Chat 文本（使用 `renderWithI18n` 而非裸 `render`，确保 i18n 正确解析）
- 点击触发 `setOpen(true)` 和 `setExpanded(true)`

测试要点：
- `useChatStore` mock 需同时支持 hook 调用（selector 模式）和 `.getState()` 调用
- `SidebarMenuButton` mock 需传递 `onClick` prop，否则 `fireEvent.click` 无法触发

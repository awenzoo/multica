# ChatWindow Hooks 修复与功能增强

## 2026-05-06

---

## 1. ChatWindow 条件返回导致 React Hooks 违规

### 问题

`packages/views/chat/components/chat-window.tsx` 第 60 行有一个条件提前返回：

```tsx
if (pathname.endsWith("/chat")) return null;
```

但在返回之后还有大量 hook 调用（useQuery, useCallback, useEffect 等），违反 React Hooks 规则。导航到 `/chat` 页面时 hooks 被跳过，React 内部 hook 顺序错乱导致崩溃；切回其他页面时也报错。

### 修复

将所有 hook 调用移到条件返回之前，只在 JSX 渲染层面做条件返回 null。

```
commit: 2db40b33 fix: move conditional return after all hooks in ChatWindow to fix React hooks rule violation
```

---

## 2. ChatWindow 在 /chat 页面触发 markRead mutation 导致渲染崩溃

### 问题

修复 Hooks 顺序后，切换 agent 历史对话仍然报错 `Cannot read properties of undefined (reading 'length')`。

根因：ChatWindow 在 `/chat` 页面虽然返回 null，但所有 hooks 仍然执行。当 `isOpen` 为 true（用户之前打开过浮动窗口）且切换 session 时，markRead effect 触发 `markRead.mutate()`，mutation 的 `onMutate` 修改 query cache，与 ChatPage 的 session 切换产生 cache 竞争，导致 React 渲染崩溃。

### 修复

- 在 ChatWindow 顶部增加 `isHidden` 变量：`const isHidden = pathname.endsWith("/chat")`
- markRead effect 增加 `isHidden` 守卫：`if (isHidden || !isOpen || !activeSessionId) return`
- 条件渲染也使用 `isHidden` 替代重复计算

```
commit: e7da0f5d fix: prevent ChatWindow side effects on /chat page + add error boundary
```

---

## 3. /chat 路由 error boundary

### 问题

`/chat` 页面没有任何 error boundary，渲染错误导致整页白屏，显示 Next.js 默认的 "This page couldn't load" 错误页。

### 修复

新增 `apps/web/app/[workspaceSlug]/(dashboard)/chat/error.tsx`，作为最近路由级 error boundary，捕获渲染错误并显示错误信息 + 重试按钮。同时在控制台输出完整 error 对象方便调试。

```
commit: e7da0f5d (同上)
```

---

## 4. Connect Remote Machine 对话框增加 Windows 安装方式

### 问题

Web 端"运行环境"菜单里 "Connect a remote machine" 对话框的 "1. Install the CLI" 只显示 macOS/Linux 的 curl 安装命令，没有 Windows 选项。

### 修复

- 增加平台切换 tab（macOS/Linux | Windows）
- macOS/Linux 下增加 Homebrew 和 curl 子 tab（默认 Homebrew）
- Windows 使用 PowerShell 的 `irm ... | iex` 命令

```
commit: 8047ddbe feat: add Windows install option to Connect Remote Machine dialog
commit: 2549090e feat: add Homebrew install option for macOS/Linux in Connect Remote Machine dialog
```

涉及文件：`packages/views/runtimes/components/connect-remote-dialog.tsx`

---

## 5. SELF_HOSTING.md 增加 Windows 安装说明

### 问题

自部署文档 `SELF_HOSTING.md` 只列出 macOS/Linux 安装方式。

### 修复

在 Quick Install 和 Step 3 两个位置增加 Windows PowerShell 安装命令。

```
commit: 60cb69e2 docs: add Windows installation instructions to SELF_HOSTING.md
```

涉及文件：`SELF_HOSTING.md`

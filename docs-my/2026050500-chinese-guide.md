# Multica Web UI 中文化指南

> 目标：将 Multica 本地部署的 Web UI 界面完整汉化，包括侧边栏导航、Issue 看板、Agent 管理等所有页面。

---

## 一、项目概述

| 项目 | 说明 |
|---|---|
| **仓库** | [awenzoo/multica](https://github.com/awenzoo/multica) |
| **技术栈** | Next.js 16 + TypeScript + Turborepo + pnpm |
| **项目结构** | Monorepo，Web 前端在 `apps/web/`，共享组件在 `packages/` |
| **当前状态** | 官网/文档已有中文，但 Web UI 硬编码英文，未做 i18n |
| **推荐方案** | 引入 `next-intl` 实现国际化 |

---

## 二、快速方案：浏览器翻译（零代码）

如果不想改代码，最快的方式：

1. **Chrome/Edge 安装翻译插件**：
   - [DeepL 翻译](https://chromewebstore.google.com/detail/deepl-translate)
   - [沉浸式翻译](https://chromewebstore.google.com/detail/immersive-translate)
2. 本地部署 Multica 后打开 `http://localhost:3000`
3. 一键翻译整个页面

**优点**：零改动，立即可用
**缺点**：每次打开都需要手动翻译，无法持久化

---

## 三、完整汉化方案（代码改造）

### 步骤 1：克隆代码

```bash
git clone https://github.com/awenzoo/multica.git
cd multica
```

### 步骤 2：安装依赖

```bash
# 安装项目依赖
pnpm install

# 安装 next-intl 国际化库
pnpm add next-intl --filter=@multica/web --filter=@multica/views
```

### 步骤 3：创建翻译文件

创建目录：
```bash
mkdir -p apps/web/messages
```

#### `apps/web/messages/en.json`（英文基准）

```json
{
  "sidebar": {
    "newIssue": "New Issue",
    "inbox": "Inbox",
    "myIssues": "My Issues",
    "issues": "Issues",
    "projects": "Projects",
    "autopilot": "Autopilot",
    "agents": "Agents",
    "runtimes": "Runtimes",
    "skills": "Skills",
    "settings": "Settings",
    "pinned": "Pinned",
    "workspace": "Workspace",
    "configure": "Configure",
    "unpin": "Unpin",
    "createWorkspace": "Create workspace",
    "workspaces": "Workspaces",
    "pendingInvitations": "Pending invitations",
    "join": "Join",
    "decline": "Decline",
    "logout": "Log out",
    "help": "Help"
  },
  "issues": {
    "title": "Issues",
    "boardView": "Board",
    "listView": "List",
    "createIssue": "Create Issue",
    "backlog": "Backlog",
    "todo": "To Do",
    "inProgress": "In Progress",
    "inReview": "In Review",
    "done": "Done",
    "noStatus": "No Status",
    "comments": "Comments",
    "reply": "Reply",
    "description": "Description",
    "labels": "Labels",
    "assignee": "Assignee",
    "priority": "Priority",
    "status": "Status",
    "noIssues": "No issues yet",
    "searchIssues": "Search issues..."
  },
  "agents": {
    "title": "Agents",
    "createAgent": "Create Agent",
    "model": "Model",
    "runtime": "Runtime",
    "concurrency": "Concurrency",
    "skills": "Skills",
    "activity": "Activity",
    "instructions": "Instructions",
    "envVars": "Environment Variables"
  },
  "common": {
    "loading": "Loading...",
    "saving": "Saving...",
    "delete": "Delete",
    "edit": "Edit",
    "cancel": "Cancel",
    "confirm": "Confirm",
    "close": "Close",
    "search": "Search",
    "create": "Create",
    "update": "Update",
    "save": "Save"
  }
}
```

#### `apps/web/messages/zh.json`（中文翻译）

```json
{
  "sidebar": {
    "newIssue": "新建 Issue",
    "inbox": "收件箱",
    "myIssues": "我的 Issues",
    "issues": "Issues",
    "projects": "项目",
    "autopilot": "自动驾驶",
    "agents": "智能体",
    "runtimes": "运行环境",
    "skills": "技能",
    "settings": "设置",
    "pinned": "已置顶",
    "workspace": "工作区",
    "configure": "配置",
    "unpin": "取消置顶",
    "createWorkspace": "创建工作区",
    "workspaces": "工作区列表",
    "pendingInvitations": "待处理的邀请",
    "join": "加入",
    "decline": "拒绝",
    "logout": "退出登录",
    "help": "帮助"
  },
  "issues": {
    "title": "Issues",
    "boardView": "看板",
    "listView": "列表",
    "createIssue": "创建 Issue",
    "backlog": "待办",
    "todo": "待处理",
    "inProgress": "进行中",
    "inReview": "审核中",
    "done": "已完成",
    "noStatus": "无状态",
    "comments": "评论",
    "reply": "回复",
    "description": "描述",
    "labels": "标签",
    "assignee": "负责人",
    "priority": "优先级",
    "status": "状态",
    "noIssues": "暂无 Issue",
    "searchIssues": "搜索 Issue..."
  },
  "agents": {
    "title": "智能体",
    "createAgent": "创建智能体",
    "model": "模型",
    "runtime": "运行环境",
    "concurrency": "并发数",
    "skills": "技能",
    "activity": "活动",
    "instructions": "指令",
    "envVars": "环境变量"
  },
  "common": {
    "loading": "加载中...",
    "saving": "保存中...",
    "delete": "删除",
    "edit": "编辑",
    "cancel": "取消",
    "confirm": "确认",
    "close": "关闭",
    "search": "搜索",
    "create": "创建",
    "update": "更新",
    "save": "保存"
  }
}
```

### 步骤 4：配置 next-intl

#### 4.1 创建 i18n 配置

创建 `apps/web/i18n.ts`：

```typescript
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  // 默认中文，可通过 cookie 切换
  const locale = 'zh';

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
```

#### 4.2 修改 next.config.ts

修改 `apps/web/next.config.ts`，在顶部添加：

```typescript
import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./apps/web/i18n.ts');

const nextConfig: NextConfig = {
  // ... 保持现有配置不变
};

export default withNextIntl(nextConfig);
```

### 步骤 5：创建翻译 Hook

创建 `packages/views/i18n/use-translations.ts`：

```typescript
import { useTranslations as useNextIntlTranslations } from 'next-intl';

export function useT() {
  const sidebar = useNextIntlTranslations('sidebar');
  const issues = useNextIntlTranslations('issues');
  const agents = useNextIntlTranslations('agents');
  const common = useNextIntlTranslations('common');

  return { sidebar, issues, agents, common };
}
```

### 步骤 6：替换侧边栏硬编码文本

修改 `packages/views/layout/app-sidebar.tsx`：

```typescript
// 在 import 部分添加
import { useT } from '../i18n/use-translations';

// 在 AppSidebar 组件中替换导航数组
export function AppSidebar(...) {
  const t = useT();
  const { pathname } = useNavigation();

  // 替换个人导航
  const personalNav = [
    { key: "inbox", label: t.sidebar('inbox'), icon: Inbox },
    { key: "myIssues", label: t.sidebar('myIssues'), icon: CircleUser },
  ];

  // 替换工作区导航
  const workspaceNav = [
    { key: "issues", label: t.sidebar('issues'), icon: ListTodo },
    { key: "projects", label: t.sidebar('projects'), icon: FolderKanban },
    { key: "autopilots", label: t.sidebar('autopilot'), icon: Zap },
    { key: "agents", label: t.sidebar('agents'), icon: Bot },
  ];

  // 替换配置导航
  const configureNav = [
    { key: "runtimes", label: t.sidebar('runtimes'), icon: Monitor },
    { key: "skills", label: t.sidebar('skills'), icon: BookOpenText },
    { key: "settings", label: t.sidebar('settings'), icon: Settings },
  ];

  // ... 其余代码保持不变
}
```

### 步骤 7：添加语言切换器

在侧边栏底部添加切换按钮，修改 `packages/views/layout/app-sidebar.tsx`：

```typescript
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Languages } from 'lucide-react';

function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();

  const toggle = () => {
    const next = locale === 'zh' ? 'en' : 'zh';
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000`;
    router.refresh();
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-sidebar-accent"
    >
      <Languages className="size-3.5" />
      {locale === 'zh' ? 'English' : '中文'}
    </button>
  );
}
```

在 `SidebarFooter` 中渲染：

```tsx
<SidebarFooter className="p-2">
  <div className="flex justify-between">
    <LanguageSwitcher />
    <HelpLauncher />
  </div>
</SidebarFooter>
```

### 步骤 8：批量汉化其他组件

以下文件需要逐个做 `t()` 替换：

| 文件路径 | 涉及页面 | 优先级 |
|---|---|---|
| `packages/views/layout/app-sidebar.tsx` | 侧边栏导航 | ⭐⭐⭐ |
| `packages/views/issues/components/issues-page.tsx` | Issue 列表 | ⭐⭐⭐ |
| `packages/views/issues/components/board-view.tsx` | 看板视图 | ⭐⭐⭐ |
| `packages/views/issues/components/status-icon.tsx` | 状态标签 | ⭐⭐ |
| `packages/views/issues/components/comment-card.tsx` | 评论 | ⭐⭐ |
| `packages/views/issues/components/list-view.tsx` | 列表视图 | ⭐⭐ |
| `packages/views/issues/components/pickers/assignee-picker.tsx` | 负责人选择 | ⭐⭐ |
| `packages/views/issues/components/pickers/priority-picker.tsx` | 优先级选择 | ⭐⭐ |
| `packages/views/issues/components/pickers/status-picker.tsx` | 状态选择 | ⭐⭐ |
| `packages/views/agents/components/agents-page.tsx` | Agent 页面 | ⭐⭐⭐ |
| `packages/views/agents/components/create-agent-dialog.tsx` | 创建 Agent | ⭐⭐ |
| `packages/views/agents/components/tabs/activity-tab.tsx` | Agent 活动 | ⭐ |
| `packages/views/agents/components/tabs/skills-tab.tsx` | Agent 技能 | ⭐ |
| `packages/views/modals/create-issue.tsx` | 创建 Issue 弹窗 | ⭐⭐⭐ |
| `packages/views/modals/create-project.tsx` | 创建项目弹窗 | ⭐⭐ |
| `packages/views/modals/create-workspace.tsx` | 创建工作区弹窗 | ⭐⭐ |
| `packages/views/settings/components/settings-page.tsx` | 设置页 | ⭐⭐ |
| `packages/views/settings/components/account-tab.tsx` | 账户设置 | ⭐ |
| `packages/views/settings/components/workspace-tab.tsx` | 工作区设置 | ⭐ |
| `packages/views/runtimes/components/runtimes-page.tsx` | 运行环境页 | ⭐ |
| `packages/views/skills/components/skills-page.tsx` | 技能页 | ⭐ |
| `packages/views/onboarding/steps/step-welcome.tsx` | 欢迎引导 | ⭐ |
| `packages/views/chat/components/chat-window.tsx` | 聊天窗口 | ⭐ |

#### 替换模式（每个文件通用）

```typescript
// 1. 在文件顶部 import
import { useT } from '../i18n/use-translations';

// 2. 在组件函数体内调用
const t = useT();

// 3. 替换硬编码字符串
// 改前：
<span>Issues</span>
// 改后：
<span>{t.sidebar('issues')}</span>

// 改前：
<h1>Board View</h1>
// 改后：
<h1>{t.issues('boardView')}</h1>
```

### 步骤 9：动态语言检测（可选）

如果希望根据用户设置自动选择语言，修改 `apps/web/i18n.ts`：

```typescript
import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value ?? 'zh';

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
```

### 步骤 10：启动开发环境

```bash
# 启动 Web 开发服务器
pnpm dev:web

# 或使用 turbo 直接运行
cd apps/web && pnpm dev
```

浏览器打开 `http://localhost:3000`，界面应为中文。

---

## 四、需要翻译的完整字符串清单

以下是从源代码中提取的所有硬编码英文文本，翻译时需要逐一覆盖：

### 侧边栏（app-sidebar.tsx）

| 原文 | 建议翻译 |
|---|---|
| Inbox | 收件箱 |
| My Issues | 我的 Issues |
| Issues | Issues（保留英文） |
| Projects | 项目 |
| Autopilot | 自动驾驶 |
| Agents | 智能体 |
| Runtimes | 运行环境 |
| Skills | 技能 |
| Settings | 设置 |
| Workspace | 工作区 |
| Configure | 配置 |
| Pinned | 已置顶 |
| Create workspace | 创建工作区 |
| Workspaces | 工作区列表 |
| Pending invitations | 待处理的邀请 |
| Join | 加入 |
| Decline | 拒绝 |
| Log out | 退出登录 |
| Unpin | 取消置顶 |

### Issue 相关

| 原文 | 建议翻译 |
|---|---|
| Board | 看板 |
| List | 列表 |
| Backlog | 待办 |
| To Do | 待处理 |
| In Progress | 进行中 |
| In Review | 审核中 |
| Done | 已完成 |
| No Status | 无状态 |
| Comments | 评论 |
| Reply | 回复 |
| Description | 描述 |
| Labels | 标签 |
| Assignee | 负责人 |
| Priority | 优先级 |
| Status | 状态 |
| No issues yet | 暂无 Issue |
| Search issues... | 搜索 Issue... |

### Agent 相关

| 原文 | 建议翻译 |
|---|---|
| Create Agent | 创建智能体 |
| Model | 模型 |
| Runtime | 运行环境 |
| Concurrency | 并发数 |
| Activity | 活动 |
| Instructions | 指令 |
| Environment Variables | 环境变量 |

### 通用

| 原文 | 建议翻译 |
|---|---|
| Loading... | 加载中... |
| Saving... | 保存中... |
| Delete | 删除 |
| Edit | 编辑 |
| Cancel | 取消 |
| Confirm | 确认 |
| Close | 关闭 |
| Search | 搜索 |
| Create | 创建 |
| Update | 更新 |
| Save | 保存 |

---

## 五、自部署指南

Multica 支持 Docker Compose 自托管，详见 [SELF_HOSTING.md](https://github.com/awenzoo/multica/blob/main/SELF_HOSTING.md)。

### 快速自部署

```bash
# 带服务器组件安装
curl -fsSL https://raw.githubusercontent.com/awenzoo/multica/main/scripts/install.sh | bash -s -- --with-server

# 初始设置
multica setup self-host
```

汉化后的代码改动在自部署中同样生效。

---

## 六、注意事项

1. **`packages/core/` 中的字符串**：部分文本在 `@multica/core` 包中（如 store 初始值、API 返回的默认值），需要单独处理
2. **Toast 提示**：使用 `sonner` 库弹出提示的地方，也需要用 `t()` 替换
3. **Markdown/富文本编辑器**：TipTap 编辑器中的占位符文本需替换
4. **图表标签**：`packages/views/runtimes/components/charts/` 中的图表 Y 轴/X 轴标签
5. **保持向后兼容**：建议保留 `en.json` 作为默认，通过 cookie 控制语言

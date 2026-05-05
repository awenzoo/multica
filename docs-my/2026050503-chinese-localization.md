# Web UI 中文化实施记录

> 日期：2026-05-05
> 详细方案见：`docs/multica-chinese-guide.md`

## 方案概述

引入 `next-intl` 库，默认中文，通过 `NextIntlClientProvider` 提供翻译。

## 实施步骤

### 1. 安装依赖

```bash
pnpm add next-intl --filter=@multica/web --filter=@multica/views
```

### 2. 创建翻译文件

- `apps/web/messages/en.json` — 英文基准
- `apps/web/messages/zh.json` — 中文翻译

翻译分组：`sidebar`、`issues`、`agents`、`settings`、`common`

### 3. 配置 next-intl

#### apps/web/i18n.ts

```typescript
import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  const locale = "zh";
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
```

**注意**：路径必须用 `./messages/` 而不是 `../messages/`，因为 Turbopack 从 `apps/web/` 目录解析。

#### apps/web/next.config.ts

```typescript
import createNextIntlPlugin from "next-intl/plugin";
const withNextIntl = createNextIntlPlugin("./i18n.ts");
// ... 在文件末尾
export default withNextIntl(nextConfig);
```

### 4. 修改根布局 apps/web/app/layout.tsx

```typescript
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

export default async function RootLayout({ children }) {
  const messages = await getMessages();
  return (
    <html lang="zh" ...>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

### 5. 创建翻译 Hook

`packages/views/i18n/use-translations.ts`：

```typescript
"use client";
import { useTranslations } from "next-intl";

export function useT() {
  const sidebar = useTranslations("sidebar");
  const issues = useTranslations("issues");
  const agents = useTranslations("agents");
  const common = useTranslations("common");
  const settings = useTranslations("settings");
  return { sidebar, issues, agents, common, settings };
}
```

### 6. 汉化组件

#### 侧边栏 (`packages/views/layout/app-sidebar.tsx`)

- 导航数组从模块级常量改为 key 映射，在组件内用 `t.sidebar(key)` 获取翻译
- 替换了：Inbox→收件箱、Issues、Projects→项目、Agents→智能体、Settings→设置、Workspaces→工作区列表、Log out→退出登录 等

#### Issue 页头 (`packages/views/issues/components/issues-header.tsx`)

- 替换了筛选器标签：Status→状态、Priority→优先级、Assignee→负责人、Creator→创建者、Project→项目、Label→标签
- 替换了视图切换：Board→看板、List→列表、View→视图
- 替换了子组件：ActorSubContent、ProjectSubContent、LabelSubContent 中的文本

#### 设置页 (`packages/views/settings/components/settings-page.tsx`)

- 替换了标签页：Profile→个人资料、Appearance→外观、Notifications→通知、API Tokens→API 令牌
- 替换了分组：General→通用、Repositories→代码仓库、Labs→实验室、Members→成员

## 已知问题

- 登录页 Continue 按钮可能受 next-intl 水合影响导致不可点击，待排查
- 约 20 个低优先级组件尚未汉化（弹窗、聊天窗口、搜索等）

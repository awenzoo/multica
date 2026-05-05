# Git 操作记录

> 日期：2026-05-05

## 仓库信息

- **Fork 地址**：`https://github.com/awenzoo/multica`
- **原始仓库**：`https://github.com/multica-ai/multica`
- **主分支**：`main`
- **Git 用户**：`awenzoo <awenzoo@users.noreply.github.com>`

## SSH 配置

### 生成密钥

```bash
ssh-keygen -t ed25519 -C "awenzoo@users.noreply.github.com" -f ~/.ssh/id_ed25519 -N ""
```

公钥已添加到 GitHub → Settings → SSH and GPG keys。

### 切换远程地址

```bash
git remote set-url origin git@github.com:awenzoo/multica.git
```

## 提交记录

### Commit 1: feat(i18n): add Chinese localization for Web UI

```
c07c909d
```

文件变更（13 files, +1307, -86）：
- 新增：`apps/web/i18n.ts`、`apps/web/messages/en.json`、`apps/web/messages/zh.json`
- 新增：`packages/views/i18n/use-translations.ts`
- 新增：`docs/multica-chinese-guide.md`
- 修改：`apps/web/app/layout.tsx`、`apps/web/next.config.ts`、`apps/web/package.json`
- 修改：`packages/views/layout/app-sidebar.tsx`、`packages/views/issues/components/issues-header.tsx`
- 修改：`packages/views/settings/components/settings-page.tsx`、`packages/views/package.json`
- 修改：`pnpm-lock.yaml`

### Commit 2: fix(i18n): fix module path resolution for next-intl config

```
cb05d64b
```

文件变更（2 files, +2, -4）：
- 修改：`apps/web/i18n.ts`（路径从 `../messages/` 改为 `./messages/`）
- 修改：`apps/web/app/layout.tsx`（恢复 `getMessages()` 调用）

## 文档 URL 修改

`docs/multica-chinese-guide.md` 中所有 `multica-ai/multica` 替换为 `awenzoo/multica`，涉及：
- 仓库链接（第 11 行）
- git clone 命令（第 39 行）
- SELF_HOSTING.md 链接（第 510 行）
- 安装脚本 URL（第 516 行）

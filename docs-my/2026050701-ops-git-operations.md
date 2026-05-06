# Git 操作记录

> 日期：2026-05-07

---

## SSH 连接 GitHub 失败排查

### 问题
在办公网络环境下，`git pull` 和 `git push` 通过 SSH（`git@github.com`）和 HTTPS 均失败：
- SSH: `Connection closed by 198.18.0.111 port 22`
- HTTPS: `LibreSSL SSL_connect: SSL_ERROR_SYNCY in connection to github.com:443`

### 原因
网络环境对 GitHub 的直连有限制，但并非完全不可用——偶尔可以连通。

### 解决
重试后 SSH 连接恢复正常。`pnpm-lock.yaml` 的未暂存变更会阻止 `git pull --rebase`，需要先 `git checkout -- pnpm-lock.yaml` 或 `git stash`。

### 操作流程
```bash
git stash                          # 如果有未暂存变更
git pull --rebase origin main      # 拉取并 rebase
git push origin main               # 推送
```

### 关联 commit
- `cb1b6f8b` → `0296f76e`（rebase 后推送成功）

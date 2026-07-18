---
description: "Use when creating git branches, naming branches, preparing commits, or performing day-to-day git workflow in chatot. Covers branch naming and non-interactive git usage constraints."
name: "Chatot Git Workflow"
---
# Chatot Git Workflow

- 工作中如需新建 git 分支，分支名使用 `/` 作为层级分隔符，例如 `feature/reply/cache`、`fix/user/scope`。
- 不使用 `-` 作为整段分支名分隔形式，例如避免 `feature-reply-cache`、`fix-user-scope` 这类命名。
- 创建 commit 时遵循当前仓库既有风格：优先使用 `emoji + conventional commit` 结构，例如 `✨ feat(router): improve authorize process`、`🔧 build(dependencies): vervison upgrade & adjust eslint rule`。
- commit subject 继续保持简短英文短语风格，通常以小写动词开头；`type(scope): subject` 中的 `scope` 可按现有提交写成单个模块名或组合范围，如 `media`、`router`、`model & database`。
- 优先使用非交互式 git 命令，避免依赖交互式控制台流程。
- 如工作区本身已有未提交修改，不要回退或覆盖与当前任务无关的用户变更。

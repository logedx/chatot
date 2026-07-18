# Chatot Agent Entry

本仓库的约束文档以本文件为入口，细分规则放在 `.github/instructions/`。

## 总体要求

- 先看 `eslint.config.js`，格式与命名以实际 lint 规则为准。
- 优先复用现有模块与辅助函数，尤其是 `src/lib/`、`src/helper/`、`src/store/`、`src/router/` 中已经存在的能力。
- 仅在已有模式不适用时再引入新结构，避免平行抽象与重复工具函数。
- 工作中如需新建 git 分支，分支名使用 `/` 作为层级分隔符，不使用 `-` 作为整段命名分隔形式。
- commit 信息遵循当前仓库既有风格，优先使用 `emoji + conventional commit`。
- 涉及代码变更时，默认执行 `npm run eslint` 与 `npm test`；仅文档变更时至少校验路径、frontmatter 与引用关系。

## 指令索引

- `.github/instructions/typescript-style.instructions.md`
  - TypeScript、ESM、缩进换行、命名、排版与导出约束
- `.github/instructions/backend-patterns.instructions.md`
  - Express Router、Mongoose Model/Schema、错误处理与领域层复用约束
- `.github/instructions/testing.instructions.md`
  - Mocha / Chai / Sinon 测试写法与断言风格
- `.github/instructions/git-workflow.instructions.md`
  - Git 分支命名与日常非交互式工作流约束
- `.github/instructions/create-api-flow.instructions.md`
  - 新增创建接口（POST）时的业务流程、校验顺序与联动更新约束

## 参考文件

- `src/app.ts`
- `src/router/user.ts`
- `src/router/keyword.ts`
- `src/router/media.ts`
- `src/model/user.ts`
- `src/store/database.ts`
- `test/lib/reply.ts`

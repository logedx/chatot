---
description: "Use when editing TypeScript, ESM imports, lint fixes, refactors, new backend code, or test files in chatot. Covers the repository's required formatting, naming, import, and export style."
name: "Chatot TypeScript Style"
applyTo:
  - "index.ts"
  - "src/**/*.ts"
  - "bin/**/*.ts"
  - "test/**/*.ts"
---
# Chatot TypeScript Style

- 使用 ESM，项目内相对导入始终带 `.js` 后缀。
- 导入分组保持为：Node 内建模块 → 第三方依赖 → 项目内模块；分组之间保留空行。
- 本地模块在同一文件中经常以 `import * as xxx from '...'` 的形式整体引入；只有文件已明显采用命名导入时再跟随原写法。
- 缩进使用 **tab**，字符串默认使用 **single quotes**，语句末尾 **不写分号**。
- 大括号遵循 **Allman** 风格：函数、类、条件语句的 `{` 单独换行。
- 缩进与对齐按现有 ESLint 规则严格执行：禁止用空格代替层级缩进；参数列表、对象字面量、变量声明等多行场景保持“首项对齐”风格，不要自行改成 2/4 空格缩进。
- 多行导入、调用参数、对象字面量、链式调用保持现有纵向排版，不要压回单行，也不要混用额外空格制造新样式。
- 不使用三元表达式；简单条件保持 `if` 写法，复杂多分支或高耦合条件优先改为“规则映射”方式（如 `Record`/映射表驱动）以降低嵌套与分支复杂度。
- 换行要求优先级很高：链式调用保持逐段换行；二元操作符换行时操作符放在下一行行首（operator-linebreak: before）。
- 语句之间维持现有“分段空行”节奏：`import`、变量声明、控制流、`return`、函数声明之间按规则留空行，不要把多个逻辑阶段压成连续紧凑块。
- 注释与代码之间保持可读换行；新增注释时遵循“行注释前保留空行”的现有规则。
- 统一使用 Unix 换行（LF），避免 CRLF 与行尾空白。
- 值级标识符保持 `snake_case`，类型、类、命名空间保持 `PascalCase`。现有名称如 `default_schema`、`in_keyword_clue`、`HandlerBundle` 应视为基准。
- 导出优先使用具名导出；只有仓库已经形成固定模式时再使用默认导出，例如入口文件与 Mongoose model 文件。
- 导出的函数、Express middleware、公共常量尽量保留显式类型；局部结构优先就近声明 `type`，不要把一次性类型抽到远处。
- 现有代码会保留对象字面量与 schema 字段的对齐排版；修改这些片段时保持原有对齐与空行节奏，不要改成紧凑写法。
- 逻辑判断优先复用现成探测函数与断言能力，例如 `detective.is_*`、`reply.*.asserts(...)`，不要重复发明同类判定工具。
- 现有文件常通过空行分段表达逻辑块；追加逻辑时延续这种节奏，避免把多个步骤压成一段。

## 直接参考

- `src/app.ts`
- `src/router/user.ts`
- `src/lib/secret.ts`
- `src/store/database.ts`

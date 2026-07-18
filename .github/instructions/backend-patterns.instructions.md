---
description: "Use when editing Express routers, Mongoose models, schema definitions, store modules, request parsing, error handling, or new backend features in chatot. Covers established backend structure and domain patterns."
name: "Chatot Backend Patterns"
applyTo:
  - "src/router/**/*.ts"
  - "src/model/**/*.ts"
  - "src/schema/**/*.ts"
  - "src/store/**/*.ts"
  - "src/lib/**/*.ts"
  - "src/helper/**/*.ts"
---
# Chatot Backend Patterns

## Router

- Router 文件保持 `export const router = express.Router()` 入口，并直接在同文件注册路由。
- 请求参数优先沿用 `surmise.capture(...)`、`infer(...)`、`infer_optional(...)`、`fritter(...)` 这一套推断与过滤工具，而不是手写零散校验。
- 鉴权、资源装载、checkpoint 等能力优先复用现有中间件，例如 `token_router`、`retrieve_router`，不要把相同前置逻辑散落到每个 handler 内。
- 正常成功响应通常使用 `res.json()` 或 `res.json({...})`；错误优先抛出 `reply.Exception` 子类或使用 `reply.*.asserts(...)`，不要在业务层重复拼装错误响应。

## Model / Schema

- schema 类型定义与 mongoose model 通常分层放置：`src/schema/*` 定义结构类型，`src/model/*` 组装 `Default` 命名空间、`default_schema`、索引与默认导出。
- model 文件保持现有 `export namespace Default` 结构，优先在其中集中 `Define`、`Schema`、`HydratedDocument` 等类型别名。
- 索引声明放在 `default_schema` 创建之后、导出 model 之前。
- 涉及敏感字段、包装类型、关联类型时，优先复用 `database.Sensitive`、`schema.Types.*`、现有 `database` 类型别名，不要绕开封装直接退回原始 `mongoose` 写法。

## Shared Utilities

- 能放在 `src/lib/` 的通常是跨领域纯工具；能放在 `src/helper/` 的通常是偏业务映射或文案辅助。扩展时先匹配现有职责边界。
- 复用已有错误、国际化、检测与结构工具：`reply`、`i18n`、`detective`、`structure`、`schema`。
- 如果某个能力已经存在于相邻模块，优先补充原模块，而不是新增一个名称相近的新文件。

## 直接参考

- `src/router/user.ts`
- `src/router/reply.ts`
- `src/model/user.ts`
- `src/schema/user.ts`
- `src/store/database.ts`

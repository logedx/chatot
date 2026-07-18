---
description: "Use when creating new POST create endpoints, adding creation business flows, or extending create API logic in chatot routers. Covers validation order, persistence flow, and post-create side effects."
name: "Chatot Create API Flow"
applyTo: "src/router/**/*.ts"
---
# Chatot Create API Flow

## 创建接口标准形态

- 新增创建接口优先使用 `router.post('/path', ...middleware, async function create (req, res) { ... })` 结构，处理函数命名保持 `create`。
- 先声明前置中间件，再写业务处理；鉴权、checkpoint、资源装载、stamp 校验优先复用 `retrieve_router.*`、`token_router.checkpoint(...)`、`stamp_router.*`。
- 不要把鉴权、资源查询、权限校验逻辑散落到 handler 内重复实现。

## 输入与校验顺序

- 在 handler 内先定义 `type Suspect`，再用 `surmise.capture<Suspect>(req.body | req.query | req.headers)` 收敛输入。
- 输入处理顺序保持一致：
  - 先 `set(...)` 注入上下文值，例如 token 中的 `weapp`、`user`
  - 再 `infer(...)` 处理必填字段
  - 再 `infer_optional(...)` 处理可选字段
  - 最后补充业务派生值，例如随机值、转换值、落库前组装值
- 依赖外部资源或数据库对象时，必须显式使用 `reply.NotFound.asserts(...)` 或同类断言做存在性校验。

## 落库与联动更新

- 创建动作优先走 model 领域方法或已有静态能力，例如 `create(...)`、`insure(...)`、`claim(...)`、`authorize()`，不要在路由层直接堆叠过多持久化细节。
- 若创建行为会联动 token、scope、checkpoint、跨对象关联，落库后立即执行对应更新，保持与现有接口行为一致。
- 需要记录检查点或审计对象时，沿用既有上下文对象和关联方式，不要新造平行记录机制。

## 响应约束

- 需要暴露额外响应头时使用 `res.expose(...)`，再执行 `res.json(...)`。
- 成功响应保持仓库现有风格：无实体时使用 `res.json()`；有结果时使用 `res.json(data)`，不要额外包一层 `success` 或 `message`。

## 分支复杂度

- 不使用三元表达式。
- 简单条件使用 `if`。
- 复杂多分支、强规则型判断优先改用规则映射（如 `Record`、映射表、查表式分发）而不是层层 `if / else`。

## 直接参考

- `src/router/user.ts`
- `src/router/keyword.ts`
- `src/router/media.ts`
- `src/router/stamp.ts`
- `src/router/authorize.ts`

---
description: "Use when writing or updating Mocha, Chai, Sinon, unit tests, assertions, stubs, or regression tests in chatot. Covers the repository's existing test structure and verification style."
name: "Chatot Testing Style"
applyTo: "test/**/*.ts"
---
# Chatot Testing Style

- 测试框架以 `mocha` 为主，断言使用 `chai.expect(...)`，替身优先使用 `sinon.stub(...)`。
- 测试文件保持与源码相近的模块分组方式，例如 `test/lib/*` 对应 `src/lib/*`。
- 现有测试普遍使用 `mocha.describe(...)` + `mocha.it(...)` 的显式命名空间写法，继续沿用，不要混用解构导入后的 `describe` / `it`。
- `it(...)` 的描述保持 `should ...` 风格，与现有英文断言说明一致。
- 即使测试逻辑很短，也通常保留 `async` 测试函数；若只是为了匹配统一写法而未实际 `await`，可按现有模式局部保留 lint disable。
- 对 `console`、外部依赖或副作用进行替身替换后，要在同一用例内显式 `restore()`，不要依赖隐式清理。
- 断言优先验证公开行为、错误类型、关键属性和值，不要把断言绑定到无关实现细节。

## 直接参考

- `test/lib/reply.ts`
- `test/lib/secret.ts`

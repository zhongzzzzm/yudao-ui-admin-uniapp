# AGENTS.md

干饭人管理后台 · 移动端：uni-app 跨端应用（H5 / 微信小程序 / App），后端对接干饭人（yudao 系）管理后台的 `admin-api`。基于 unibest 模板二次开发，正在从 "yudao" 品牌迁移为 "ganfanren"（`src/` 下已无 yudao 引用，新增代码不要引入该词）。

## 常用命令

包管理器只用 pnpm（`preinstall` 强制），Node >= 20。

- 开发：`pnpm dev:h5`、`pnpm dev:mp-weixin`（可加 `:test` / `:prod` 切换 mode）
- 构建：`pnpm build:h5`、`pnpm build:mp-weixin`
- 类型检查：`pnpm type-check`（vue-tsc；`@wot-ui/ui` 在 node_modules 里的类型报错是已知噪声，过滤 node_modules 后看本仓库错误）
- Lint：`pnpm lint` / `pnpm lint:fix`（eslint --cache，lint-staged 会在提交时自动跑）
- 小程序上传：`node ./scripts/upload-weixin.js`（支持 `--dry-run`）

验证涉及构建配置的改动时，至少跑 `pnpm type-check` + `pnpm build:h5` + `pnpm build:mp-weixin`。

## 架构与分层

- **路由与清单是生成的**：`src/pages.json` 和 `src/manifest.json` 由约定式路由插件生成，不要手改；改 `pages.config.ts` 和 `manifest.config.ts`，改完检查生成产物和分包配置。Tabbar 配置统一在 `src/tabbar/config.ts`。
- **分包即业务模块**：`src/pages-{system,infra,bpm,core,ai,crm,erp,fms,hrm,im,iot,mall,member,mes,mp,pay,statistics,wms}` 对应 `src/api/<模块>/`。每个业务模块内部自带 `components/`、`store/`、`utils/` 等（参考 `src/pages-fms/`）。
- **HTTP 层**：统一用 `@/http/http` 的 `http`，类型 `PageParam` / `PageResult` 来自 `@/http/types`。`src/http/interceptor.ts` 处理 token（双 token 模式）、租户、API 加解密，头部注释标明是 unibest 官方维护代码，不要大改，避免上游合并冲突。
- **组件 easycom 前缀**（`pages.config.ts`）：`fg-` → `src/components/fg-*`，`yd-` → `src/components/ganfanren-ui/yd-*`（项目自有 UI，通过 `ganfanren-ui/index.ts` 导出），`wd-` → wot-ui，`z-paging` → 分页组件。新组件按前缀规则放对应目录，无需 import。
- **状态**：Pinia（`src/store/`），pinia-plugin-persistedstate；字典用 `src/hooks/useDict.ts`。

## 环境与平台

- 环境文件在 `env/.env*`，按 mode 叠加（development/test/production）。后端默认 `http://localhost:48080/admin-api`，租户开关、API 加密 key、双 token 模式都在这里配。
- 代码必须多端兼容（H5 + 各家小程序 + App），平台差异用 `#ifdef` 条件编译；写法参考现有页面。
- 微信小程序有专用 baseUrl 回退逻辑（`VITE_SERVER_BASEURL__WEIXIN_*`），构建 mp-weixin 会自动拉起微信开发者工具。

## 上游合并（unibest）

同步上游 unibest 时**不要整段 merge / cherry-pick**，按 `docs/merge/` 里的月度计划手动抽取低风险项。tabbar 相关提交一律不合并：`src/tabbar/*` 是干饭人定制实现（5 个入口 + 登录态白名单保护）。实施时不要把工作区里无关的已暂存文件混入提交。

## 其他约定

- 注释、UI 文案用中文；API 模块的 interface 字段逐个写中文注释（参考 `src/api/fms/voucher/index.ts`）。
- 提交信息遵循 conventional commits（husky + commitlint）。
- 需要了解框架细节（请求封装、i18n、样式、图标等）先看 `docs/base/`，如 `8-request.md`、`12-env.md`。

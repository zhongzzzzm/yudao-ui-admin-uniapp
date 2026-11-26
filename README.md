# 干饭人 — 移动端（H5 / 微信小程序 / App）

> 干饭人管理后台的移动端，基于 [uni-app](https://uniapp.dcloud.io/) + [unibest](https://github.com/feige996/unibest) 模板二次开发，通过后端 `admin-api` 提供移动端入口。
>
> 业务口径与 PC 端对齐：**报送管理、数据校验、税务管理、财务处理、报价测算、轻量审批、系统管理**，一套代码覆盖 H5、微信小程序与 Android / iOS App。
>
> 配套工程：`ganfanren-backend`（Spring Boot API 服务）、`ganfanren-frontend`（PC 端管理后台）。

## 🌐 平台支持

| H5 | 微信小程序 | Android App | iOS App |
|:--:|:----------:|:-----------:|:-------:|
| ✅ |     ✅     |     ✅      |   ✅    |

H5 与微信小程序是日常使用形态，脚本、构建与上传链路都已打通；App 走 uni-app 打包。其余小程序平台（支付宝、抖音等）的 dev/build 脚本保留自模板，未做针对性适配。

## 🚀 技术栈

| 框架 | 说明 | 版本 |
| --- | --- | --- |
| [Vue](https://vuejs.org/) | 渐进式 JavaScript 框架 | 3.4.x |
| [uni-app](https://uniapp.dcloud.io/) | 跨平台应用开发框架 | 3.0.x |
| [TypeScript](https://www.typescriptlang.org/) | JavaScript 超集 | 5.8.x |
| [Vite](https://vitejs.dev/) | 构建工具 | 5.2.x |
| [Pinia](https://pinia.vuejs.org/) | 状态管理（含 persistedstate 持久化） | 2.0.x |
| [UnoCSS](https://unocss.dev/) | 原子化 CSS 引擎 | 66.x |
| [unibest](https://github.com/feige996/unibest) | uni-app 开发模板（本项目上游） | 4.1.0 |
| [wot-ui](https://wot-ui.cn/) | 轻量 UI 组件库 | 2.2.x |
| [z-paging](https://z-paging.zxlee.cn/) | 分页列表组件 | 2.8.x |
| [vue-i18n](https://vue-i18n.intlify.dev/) | 国际化 | 9.1.x |

此外使用 `crypto-js` / `jsencrypt` 处理登录与接口加解密，`dayjs` 处理日期。

## 📁 项目结构

```
ganfanren-app/
├── src/
│   ├── pages/                  # 主包：工作台 / 待办 / 消息 / 我的 / 看板 / 通讯录 / 通用文件预览
│   ├── pages-core/             # 登录注册、个人中心、设置等基础页面（分包）
│   ├── pages-system/           # 系统管理（分包）
│   ├── pages-infra/            # 基础设施（分包）
│   ├── pages-rpt/              # 报送管理 + 数据校验（分包）
│   ├── pages-tax/              # 税务管理（分包）
│   ├── pages-fin/              # 财务（分包）
│   ├── pages-bpm/              # 轻量审批（分包）
│   ├── pages-fl/               # 报价测算 / 复核 / 取数（分包）
│   ├── api/                    # 接口定义，按业务域与分包一一对应
│   ├── http/                   # uni.request 封装：拦截器、双 token、SSE、多部分上传
│   ├── store/                  # Pinia store（token / user / dict / theme）
│   ├── hooks/                  # useAccess、useDict、useRequest、useUpload 等
│   ├── components/             # fg-* 通用组件、ganfanren-ui（yd-*）、字典与选择器
│   ├── layouts/                # 默认布局
│   ├── router/                 # 路由守卫（登录拦截）
│   ├── tabbar/                 # 自定义 tabbar：配置、store、组件
│   ├── static/                 # 图片、图标、tabbar 素材
│   ├── style/                  # 全局样式与 iconfont
│   ├── types/                  # 类型声明（含自动生成的 uni-pages.d.ts）
│   ├── utils/                  # 上传、下载、加密、日期、树、校验等工具
│   ├── pages.json              # ⚠️ 由约定式路由插件生成，不要手改
│   └── manifest.json           # ⚠️ 由 manifest 插件生成，不要手改
├── env/                        # 环境变量（.env + 按 mode 叠加）
├── scripts/                    # 构建辅助：微信上传、拉起开发者工具、基础文件生成
├── docs/                       # unibest 上游文档与月度合并计划
├── pages.config.ts             # 路由 / easycom / tabbar 配置入口
├── manifest.config.ts          # 应用名、appid、平台能力配置入口
├── vite.config.ts              # 插件与分包注册
├── uno.config.ts               # UnoCSS 配置（含图标 safelist）
├── start.sh                    # 开发启动脚本（按平台 + 模式）
└── build-h5-prod.sh            # H5 生产构建并打包 zip
```

## 🧩 业务模块

### 主包（`src/pages`）

| 页面 | 说明 |
| --- | --- |
| `index` | 工作台：按分组展示业务入口，菜单数据源为 `src/pages/index/menu.json`（分组 ▸ 二级分组 ▸ 菜单，按权限过滤） |
| `todo` | 待办：审批与业务待办聚合 |
| `message` | 消息：站内通知消息 |
| `user` | 我的：个人信息、设置入口 |
| `analytics` | 分析看板 |
| `contact` | 通讯录 |
| `common/preview` | 文件在线预览（对接后端 kkFileView） |

### 分包

| 分包 | 对应 API | 主要页面 |
| --- | --- | --- |
| `pages-rpt` | `api/rpt` | 报送任务、复核工作台、数据底稿、配置总览、数据指标、指标值查询、报表模板版本、底稿定义、计算联动日志；校验任务、报表对比、数据对比、报表/表样/规则/字典等基础数据配置、数据版本、重报登记 |
| `pages-tax` | `api/tax` | 办税台账、公司定义、台账附件 |
| `pages-fin` | `api/fin` | 发票台账、银行流水、进项票抵扣、发票入账匹配、凭证比对、财务快报、存款结息、流动性测算与现金流、行程单/住宿单拆分、预收挂账、公司通讯录、文件任务 |
| `pages-fl` | `api/fl` | 报价测算、报价复核、取数 |
| `pages-bpm` | `api/bpm` | 我的申请、通用申请单、全部待办、批量审批、我的已办、抄送我的、任务详情 |
| `pages-system` | `api/system` | 用户、角色、部门、岗位、菜单、数据权限规则、节假日日历、通知公告、字典、邮件、企微机器人、操作/登录日志、租户、OAuth2、社交登录 |
| `pages-infra` | `api/infra` | 文件管理、配置管理、定时任务、访问日志、错误日志 |
| `pages-core` | `api/system`、`api/login` | 登录 / 验证码 / 注册 / 忘记密码、社交登录、个人中心、安全设置、协议与隐私、404 |

业务功能口径为**对齐 PC 端全量能力**（2026-11 起取消「App 只读」约定），tax / fin / rpt / bpm / fl 均含编辑操作。少数重交互形态仍以 PC 为主（银行流水列映射可视化编辑器、数据权限条件构建器、指标血缘 DAG 等），移动端用 JSON 编辑或层级列表替代，并在页面内注明。

## ✨ 通用能力

| 能力 | 说明 |
| --- | --- |
| 自定义 Tabbar | 工作台 / 待办 / 消息 / 我的 四个入口，配置集中在 `src/tabbar/config.ts`，按登录态与路由白名单控制可见性 |
| 约定式路由 | 文件系统即路由，`pages.json` / `manifest.json` 自动生成 |
| 请求封装 | `@/http/http` 统一出口：双 token 刷新与请求重放、租户头、API 加解密、登录失效跳转、SSE、文件上传 |
| 登录拦截 | `src/router/interceptor.ts` 路由守卫 + 白名单 |
| 字典 | `useDict` + `src/store/dict.ts`，支持缓存丢失后的补偿加载 |
| 表单与选择 | `yd-*` 组件：树选择、日期区间、表单选择器、图片/文件上传；`fg-*` 通用组件 |
| 多端适配 | `#ifdef` 条件编译；微信小程序专用 baseUrl 回退与开发者工具自动拉起 |
| 文件预览 | 统一走 `pages/common/preview`，对接后端 kkFileView |

## 🔧 快速开始

### 环境要求

- Node.js >= 20
- pnpm（仓库锁定 `pnpm@10.10.0`，`preinstall` 强制只允许 pnpm）
- 微信小程序调试需安装微信开发者工具；打包 App 需 HBuilderX 或云打包

### 安装与启动

```bash
# 安装依赖
pnpm install

# H5 开发（默认端口 9800）
pnpm dev:h5

# 微信小程序开发（构建后自动拉起微信开发者工具）
pnpm dev:mp-weixin

# App 开发
pnpm dev:app
```

`start.sh` 是对上面的封装，会先停掉占用端口的旧实例再启动：

```bash
./start.sh                 # H5 + development
./start.sh h5 test         # H5 + test
./start.sh mp-weixin       # 微信小程序
./start.sh app-android     # Android App
```

> dev 服务请在终端内自行启动 / 重启；改动完成后以 `pnpm lint`、`pnpm type-check` 通过为交付标准。

H5 默认直连 `VITE_SERVER_BASEURL`（`http://localhost:48080/admin-api`，对应本地后端）。需要走 Vite 代理时，把 `env/.env` 里的 `VITE_APP_PROXY_ENABLE` 置为 `true`，请求会转发到 `VITE_SERVER_BASEURL`。

### 构建

```bash
pnpm build:h5          # H5 构建 → dist/build/h5
pnpm build:h5:prod     # H5 + production 环境
pnpm build:mp-weixin   # 微信小程序构建 → dist/build/mp-weixin
pnpm build:app         # App 构建
./build-h5-prod.sh     # 生产构建 + 打包 zip（已有产物时加 --skip-build）
```

`build-h5-prod.sh` 会执行 `pnpm build:h5:prod` 并把 `dist/build/h5` 压成 `~/Downloads/ganfanren-h5.zip`（可用 `--dest=` 指定输出目录或 zip 路径），压缩包内为 `index.html + assets + static`，解压即可部署。

### 微信小程序上传

```bash
pnpm upload:mp-weixin --dry-run                  # 预检，不真正上传
pnpm upload:mp-weixin --version=1.0.1 --desc="修复登录问题"
WECHAT_UPLOAD_PRIVATE_KEY_PATH=/path/private.key pnpm upload:mp-weixin
```

### 代码检查

```bash
pnpm lint        # ESLint（带缓存）
pnpm lint:fix    # 自动修复
pnpm type-check  # vue-tsc 类型检查
```

## ⚙️ 环境配置

环境文件在 `env/` 下，按 mode 叠加：`env/.env` → `.env.development` / `.env.test` / `.env.production`。变量必须以 `VITE_` 开头才能被前端读取。

| 变量 | 说明 |
| --- | --- |
| `VITE_SERVER_BASEURL` | 后端请求地址，默认 `http://localhost:48080/admin-api` |
| `VITE_UPLOAD_BASEURL` | 上传地址 |
| `VITE_STATIC_BASEURL` | 静态资源地址 |
| `VITE_APP_PORT` | H5 开发端口，默认 `9800` |
| `VITE_APP_PROXY_ENABLE` / `VITE_APP_PROXY_PREFIX` | H5 是否走 Vite 代理及代理前缀（`/admin-api`），默认关闭、直连后端 |
| `VITE_AUTH_MODE` | `single` / `double`，默认双 token |
| `VITE_APP_TENANT_ENABLE` | 租户开关（请求携带 `tenant-id`） |
| `VITE_APP_API_ENCRYPT_*` | 接口加解密开关、请求头与 AES key |
| `VITE_UNI_APPID` / `VITE_WX_APPID` | uni-app appid 与微信小程序 appid |
| `VITE_SERVER_BASEURL__WEIXIN_*` | 微信小程序按 `envVersion`（develop / trial / release）使用的专用地址，未配置时回退 `VITE_SERVER_BASEURL` |

## 📌 开发约定

- **不要手改生成文件**：`src/pages.json`、`src/manifest.json` 由插件生成，改 `pages.config.ts` / `manifest.config.ts`；tabbar 改 `src/tabbar/config.ts`。
- **新增分包必须注册**：`vite.config.ts` 的 UniPages `subPackages` 与 `src/pages-*`、`src/api/<域>` 保持一致，当前为 core / system / infra / rpt / tax / fin / bpm / fl。
- **组件按 easycom 前缀放置**（无需 import）：`fg-*` → `src/components/fg-*`，`yd-*` → `src/components/ganfanren-ui/yd-*`，`wd-*` 为 wot-ui，`z-paging` 为分页组件。
- **HTTP 统一走 `@/http/http`**，分页类型来自 `@/http/types`；`src/http/interceptor.ts` 为上游维护代码，避免大改。
- **工作台菜单改 `src/pages/index/menu.json`**，权限标识与后端菜单保持一致。
- **多端兼容**：新页面必须能在 H5、微信小程序与 App 运行，平台差异用 `#ifdef`。
- **上游合并**：不整段 merge / cherry-pick unibest，按 `docs/merge/` 月度计划手动抽取低风险项；tabbar 相关提交一律不合入。
- 注释与 UI 文案用中文；API interface 字段逐个写中文注释；提交信息遵循 conventional commits（husky + commitlint）。

## 📚 相关文档

| 文档 | 内容 |
| --- | --- |
| [`AGENTS.md`](./AGENTS.md) | 移动端分包、HTTP、上游合并等协作约定 |
| [`docs/base/`](./docs/base/) | unibest 上游文档：请求封装、环境变量、i18n、样式、图标等 |
| [`docs/merge/`](./docs/merge/) | 与 unibest 上游的月度合并计划 |
| 仓库根 `docs/README.md` | 全仓文档地图（L0 总纲 → L1 规范 → L2 模块 → L3 设计） |

## 📄 开源协议

本项目基于 [unibest](https://github.com/feige996/unibest)（MIT）二次开发，遵循 [MIT License](./LICENSE)。

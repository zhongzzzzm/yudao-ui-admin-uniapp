#!/usr/bin/env bash
# 干饭人 App 启动脚本
# 用法: ./start.sh [平台] [模式]
#   平台: h5(默认) | app | app-android | app-ios | mp-weixin 等 uni-app 平台
#   模式: dev(默认) | test | prod
# 示例:
#   ./start.sh                 # 以 H5 方式启动（开发模式）
#   ./start.sh h5 test         # H5 + test 模式
#   ./start.sh app-android     # Android App 开发模式
set -euo pipefail

cd "$(dirname "$0")"

PLATFORM="${1:-h5}"
MODE="${2:-dev}"

# 模式后缀: dev -> 无后缀, test -> :test, prod -> :prod
case "$MODE" in
  dev)  MODE_SUFFIX="" ;;
  test) MODE_SUFFIX=":test" ;;
  prod) MODE_SUFFIX=":prod" ;;
  *) echo "未知模式: $MODE (可选 dev/test/prod)"; exit 1 ;;
esac

# 平台映射到 package.json 中的 dev 脚本名
case "$PLATFORM" in
  h5)        DEV_SCRIPT="dev:h5${MODE_SUFFIX}" ;;
  app)       DEV_SCRIPT="dev:app${MODE_SUFFIX}" ;;
  app-android) DEV_SCRIPT="dev:app-android" ;;
  app-ios)   DEV_SCRIPT="dev:app-ios" ;;
  mp-weixin) DEV_SCRIPT="dev:mp-weixin${MODE_SUFFIX}" ;;
  *)         DEV_SCRIPT="dev:${PLATFORM}${MODE_SUFFIX}" ;;
esac

if ! grep -q "\"${DEV_SCRIPT}\":" package.json; then
  echo "[start] package.json 中不存在脚本: ${DEV_SCRIPT}，请检查平台/模式参数"
  exit 1
fi

# 检查 pnpm（工程 preinstall 强制使用 pnpm）
if ! command -v pnpm >/dev/null 2>&1; then
  echo "[start] 未检测到 pnpm，尝试通过 corepack 启用..."
  if command -v corepack >/dev/null 2>&1; then
    corepack enable >/dev/null 2>&1 || npm i -g pnpm
  else
    npm i -g pnpm
  fi
fi

# dev server 端口: 读取 env/.env 的 VITE_APP_PORT, 默认 9000
PORT=$(grep -E '^VITE_APP_PORT' env/.env 2>/dev/null | head -1 | cut -d= -f2 | tr -d '[:space:]')
PORT="${PORT:-9800}"

# 停止已启动的 dev server（按端口查找，兜底按本项目 uni 进程名查找）
PIDS=$(lsof -ti tcp:"$PORT" 2>/dev/null || true)
UNI_PIDS=$(pgrep -f "ganfanren-app/node_modules/.bin/uni" 2>/dev/null | grep -v $$ || true)
PIDS=$(printf '%s\n%s\n' "$PIDS" "$UNI_PIDS" | sort -u | grep -v '^$' || true)
if [ -n "$PIDS" ]; then
  echo "[start] 检测到已有实例在运行 (PID: $(echo $PIDS | tr '\n' ' ')), 先停止"
  kill $PIDS 2>/dev/null || true
  for i in $(seq 1 10); do
    PIDS=$(printf '%s\n%s\n' "$(lsof -ti tcp:"$PORT" 2>/dev/null || true)" "$(pgrep -f "ganfanren-app/node_modules/.bin/uni" 2>/dev/null | grep -v $$ || true)" | sort -u | grep -v '^$' || true)
    [ -z "$PIDS" ] && break
    sleep 1
  done
  if [ -n "$PIDS" ]; then
    echo "[start] 优雅停止超时, 强制 kill -9"
    kill -9 $PIDS 2>/dev/null || true
  fi
  echo "[start] 旧实例已停止"
fi

# 依赖未安装或刚拉取代码后自动补装
if [ ! -d node_modules ]; then
  echo "[start] 首次运行，安装依赖 (pnpm install)..."
  pnpm install
fi

echo "[start] 启动干饭人 App: pnpm ${DEV_SCRIPT}"
exec pnpm "${DEV_SCRIPT}"

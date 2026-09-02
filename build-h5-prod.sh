#!/usr/bin/env bash
# H5 打包脚本：执行 production 构建，并把产物压缩为 zip 放到 ~/Downloads
#
# 使用示例：
#   ./build-h5-prod.sh                        # 构建 + 压缩为 ~/Downloads/ganfanren-h5.zip
#   ./build-h5-prod.sh --skip-build           # 跳过构建，直接压缩现有产物
#   ./build-h5-prod.sh --dest=/path/dir       # 输出到指定目录（生成 /path/dir/ganfanren-h5.zip）
#   ./build-h5-prod.sh --dest=/path/out.zip   # 自定义 zip 输出路径

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_COMMAND="pnpm build:h5:prod"
SOURCE_DIR="$ROOT_DIR/dist/build/h5"
ZIP_NAME="ganfanren-h5.zip"
DEFAULT_ZIP_PATH="$HOME/Downloads/$ZIP_NAME"

SKIP_BUILD=false
ZIP_PATH="$DEFAULT_ZIP_PATH"

for arg in "$@"; do
  case "$arg" in
    --skip-build) SKIP_BUILD=true ;;
    --dest=*)
      DEST="${arg#--dest=}"
      case "$DEST" in
        *.zip) ZIP_PATH="$DEST" ;;
        *) ZIP_PATH="${DEST%/}/$ZIP_NAME" ;;
      esac
      ;;
    *)
      echo "未知参数: $arg"
      echo "用法: ./build-h5-prod.sh [--skip-build] [--dest=/path/dir|/path/out.zip]"
      exit 1
      ;;
  esac
done

echo "H5 打包参数"
echo "- 构建命令: $([ "$SKIP_BUILD" = true ] && echo '跳过' || echo "$BUILD_COMMAND")"
echo "- 产物来源: $SOURCE_DIR"
echo "- 输出文件: $ZIP_PATH"

if [ "$SKIP_BUILD" = false ]; then
  echo ""
  echo "执行构建: $BUILD_COMMAND"
  (cd "$ROOT_DIR" && $BUILD_COMMAND)
fi

if [ ! -f "$SOURCE_DIR/index.html" ]; then
  echo "构建产物不存在: $SOURCE_DIR，请先执行 $BUILD_COMMAND"
  exit 1
fi

# 覆盖旧 zip；内容放在压缩包根目录，解压即 index.html + assets + static
rm -f "$ZIP_PATH"
mkdir -p "$(dirname "$ZIP_PATH")"
(cd "$SOURCE_DIR" && zip -r -q "$ZIP_PATH" .)

FILE_COUNT="$(find "$SOURCE_DIR" -type f | wc -l | tr -d ' ')"
ZIP_SIZE_MB="$(du -k "$ZIP_PATH" | awk '{printf "%.2f", $1 / 1024}')"
echo "已压缩 ${FILE_COUNT} 个文件，zip 大小 ${ZIP_SIZE_MB} MB"

echo ""
echo "H5 打包完成: $ZIP_PATH"

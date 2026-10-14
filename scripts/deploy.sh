#!/bin/sh
# PenPuz 一键部署：构建静态站点。
# vite preview 按请求从磁盘读取产物，构建成功后新版本立即生效，无需重启服务。
set -e
export PATH="/run/current-system/sw/bin:$PATH"
cd "$(dirname "$0")/.."
pnpm build

#!/usr/bin/env bash
# Renders infra/og/diagnostico.html to public/og-diagnostico.jpg (1200x630).
# Needs Google Chrome and the Bebas Neue / Inter fonts installed locally.
set -euo pipefail
cd "$(dirname "$0")/../.."
tmp="$(mktemp -d)"
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
  --window-size=1200,630 --screenshot="$tmp/og.png" "file://$PWD/infra/og/diagnostico.html" >/dev/null 2>&1
node -e "require('sharp')('$tmp/og.png').resize(1200,630).jpeg({quality:86,mozjpeg:true}).toFile('public/og-diagnostico.jpg').then(i=>console.log(i))"
rm -rf "$tmp"

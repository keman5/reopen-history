#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
if command -v go >/dev/null 2>&1; then
  go clean -cache -testcache
fi
python3 - <<'PY'
from pathlib import Path
from PIL import Image, ImageOps

sources = {
    'history.png': Path('/Users/jiguang/Downloads/Snipaste_2026-11-09_16-57-42.png'),
    'settings.png': Path('/Users/jiguang/Downloads/Snipaste_2026-11-09_16-58-02.png'),
}
output = Path('assets/store/edge')
output.mkdir(parents=True, exist_ok=True)
for name, source in sources.items():
    with Image.open(source) as original:
        fitted = ImageOps.contain(original.convert('RGB'), (1280, 800), Image.Resampling.LANCZOS)
        canvas = Image.new('RGB', (1280, 800), 'white')
        canvas.paste(fitted, ((1280-fitted.width)//2, (800-fitted.height)//2))
        target = output / name
        canvas.save(target, optimize=True)
        print(f'{source.name} -> {target} (1280 x 800)')
PY

#!/usr/bin/env bash
# 랜드마크 정답 · 채점용 사진 폴더에 사진을 넣는다 (복사 — 원본은 그대로 둔다).
# 폴더는 저장소 바깥(기본 ../landmark-bench)이라 Git 에 안 들어간다. 고객 사진이 들어갈 수 있으니 폴더째 지우는 것으로 정리한다.
#
# 사용 (new_momong 에서):
#   bash tools/landmark-bench/seed.sh <사진 폴더> [접두어]
#   예) bash tools/landmark-bench/seed.sh ../face_landmark/test_image test_
set -euo pipefail

SRC="${1:?사진 폴더를 주세요}"
PREFIX="${2:-}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BENCH="${LANDMARK_BENCH_DIR:-$ROOT/../landmark-bench}"
mkdir -p "$BENCH/images" "$BENCH/truth"

n=0
for f in "$SRC"/*; do
  case "$(printf '%s' "$f" | tr 'A-Z' 'a-z')" in *.jpg|*.jpeg|*.png|*.webp) ;; *) continue ;; esac
  base="$(basename "$f" | tr -c 'A-Za-z0-9._\n-' '_')"
  dest="$BENCH/images/${PREFIX}${base}"
  [ -e "$dest" ] && continue
  cp "$f" "$dest"
  n=$((n + 1))
done
echo "$n 장 추가 → $BENCH/images ($(ls "$BENCH/images" | wc -l | tr -d ' ') 장)"

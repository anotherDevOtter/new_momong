#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
인프라 이전 1-1: Python 얼굴 분석 결과를 기준값 JSON 으로 저장한다.

웹(TS) 판정 로직을 이식한 뒤 같은 사진의 결과와 비교하는 데 쓴다.
판정 결과(wnc / snh)와 함께 Python 이 뽑은 랜드마크도 저장한다.
→ 같은 랜드마크를 TS 로직에 넣으면 '로직 이식 오류'만 따로 볼 수 있다.

로컬 전용. S3 에 올리지 않는다 (save_images=False).
모듈이 만드는 결과 이미지는 --work-dir/output_images 에 쌓인다.

사용:
  <venv>/bin/python make_baseline.py \
      --face-landmark ../../../face_landmark \
      --images ../../../face_landmark/test_image \
      --out baselines

venv 는 face_landmark/requirements.txt 기준 (opencv < 5, mediapipe 0.10.14).
OpenCV 5 는 haarcascade XML 이 없어 SNH_TYPE_02 · 14 가 실패한다.
"""

import argparse
import contextlib
import io
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

IMAGE_EXTS = {'.png', '.jpg', '.jpeg', '.bmp'}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--face-landmark', required=True, help='face_landmark 저장소 경로')
    parser.add_argument('--images', required=True, help='테스트 사진 폴더')
    parser.add_argument('--out', required=True, help='기준값 JSON 저장 폴더')
    parser.add_argument('--work-dir', default=None, help='모듈 결과 이미지가 쌓일 작업 폴더 (기본: --out/_work)')
    args = parser.parse_args()

    fl_dir = Path(args.face_landmark).resolve()
    img_dir = Path(args.images).resolve()
    out_dir = Path(args.out).resolve()
    work_dir = Path(args.work_dir).resolve() if args.work_dir else out_dir / '_work'
    out_dir.mkdir(parents=True, exist_ok=True)
    (work_dir / 'output_images').mkdir(parents=True, exist_ok=True)

    sys.path.insert(0, str(fl_dir))
    # analyze_face 는 modules/ 를 자기 위치 기준으로 찾는다. 결과 이미지는 cwd 기준이라 작업 폴더로 옮긴다.
    os.chdir(work_dir)

    import cv2
    import mediapipe as mp
    from analyze_face import FaceAnalyzer

    if not os.path.exists(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'):
        sys.exit(f'haarcascade 없음 (OpenCV {cv2.__version__}). requirements.txt 기준 venv 로 실행할 것.')

    env = {
        'opencv': cv2.__version__,
        'mediapipe': mp.__version__,
        'python': sys.version.split()[0],
    }

    analyzer = FaceAnalyzer()
    # 모듈 경로가 cwd 기준 상대경로('modules/...')라서 face_landmark 기준 절대경로로 바꾼다.
    for registry in (analyzer.wnc_modules, analyzer.snh_modules):
        for info in registry.values():
            info['module'] = str(fl_dir / info['module'])
    expected = {'wnc': set(analyzer.wnc_modules), 'snh': set(analyzer.snh_modules)}
    images = sorted(p for p in img_dir.iterdir() if p.suffix.lower() in IMAGE_EXTS)
    summary = []

    for path in images:
        image_id = f'baseline_{path.stem}'
        image = cv2.imread(str(path))
        h, w = image.shape[:2]

        # 모듈들이 stdout 에 진행 로그를 찍는다. 기준값에는 필요 없으므로 버린다.
        with contextlib.redirect_stdout(io.StringIO()):
            try:
                landmarks = analyzer.extract_landmarks(image)
                lm = [[round(p.x, 6), round(p.y, 6), round(p.z, 6)] for p in landmarks]
            except Exception as e:
                lm = None
                lm_error = str(e)
            result = analyzer.analyze(str(path), image_id, save_images=False)

        record = {
            'image': path.name,
            'image_size': {'width': w, 'height': h},
            'generated_at': datetime.now(timezone.utc).isoformat(timespec='seconds'),
            'env': env,
            # MediaPipe 정규화 좌표 (0~1). 픽셀 = x*width, y*height
            'landmarks': lm,
            'result': result,
        }
        if lm is None:
            record['landmark_error'] = lm_error

        (out_dir / f'{path.stem}.json').write_text(
            json.dumps(record, ensure_ascii=False, indent=2), encoding='utf-8')

        if result.get('success'):
            data = result['data']
            # 모듈이 실패하면 결과에서 조용히 빠진다. 빠진 모듈을 드러낸다.
            missing = [f'{part.upper()}_{k}' for part in ('wnc', 'snh')
                       for k in sorted(expected[part] - set(data[part]['results']), key=int)]
            odd = [f'{part.upper()}_{k}={r.get("grade")}' for part in ('wnc', 'snh')
                   for k, r in data[part]['results'].items()
                   if r.get('grade') not in ('W', 'N', 'C', 'S', 'H')]
            summary.append(f"{path.name}: WNC={data['wnc']['final']} {data['wnc']['counts']} "
                           f"SNH={data['snh']['final']} {data['snh']['counts']}"
                           + (f"  빠짐: {', '.join(missing)}" if missing else '')
                           + (f"  이상 등급: {', '.join(odd)}" if odd else ''))
        else:
            summary.append(f"{path.name}: 실패 — {result.get('error')}")

    print(f"env: {env}")
    print('\n'.join(summary))


if __name__ == '__main__':
    main()

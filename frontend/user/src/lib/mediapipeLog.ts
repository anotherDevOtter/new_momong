/**
 * MediaPipe wasm 은 'INFO: Created TensorFlow Lite XNNPACK delegate for CPU.' 같은
 * 정보 로그를 console.error 로 뱉는다. 오류가 아닌데 Next 개발 오버레이가 오류로 띄운다.
 *
 * wasm 글루 코드가 로드 시점의 console.error 를 붙잡아 두기 때문에, 감쌌다 푸는
 * 방식으로는 잡히지 않을 때가 있다. mediapipe 를 불러오기 전에 한 번만 걸어 두고
 * 그대로 둔다 — 'INFO:' 로 시작하는 줄만 버리고 나머지는 그대로 흘린다. (2026-09-12)
 */
let installed = false;

export function silenceMediapipeInfoLog() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  const original = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].startsWith('INFO:')) return;
    original(...args);
  };
}

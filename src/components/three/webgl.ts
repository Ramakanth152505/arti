/**
 * WebGL capability probe.
 *
 * The 3D signature element must degrade gracefully: if a real WebGL context
 * cannot be created (old browser, disabled GPU, headless environment without a
 * GL backend) the UI falls back to a static emblem and says so, rather than
 * rendering an empty black box or throwing during initialisation.
 *
 * The result is cached — creating a probe context is not free and the answer
 * cannot change within a session.
 */
let cached: boolean | null = null;

export function hasWebGL(): boolean {
  if (cached !== null) return cached;
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    cached = false;
    return cached;
  }
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    cached = Boolean(gl);
    // Release the probe context immediately so it does not count against the
    // browser's live-context budget.
    if (gl && 'getExtension' in gl) {
      const lose = (gl as WebGLRenderingContext).getExtension('WEBGL_lose_context');
      lose?.loseContext();
    }
  } catch {
    cached = false;
  }
  return cached;
}

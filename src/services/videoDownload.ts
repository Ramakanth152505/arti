/**
 * ARTI AI — client-side video download.
 *
 * A genuine browser download of the actual generated asset. The file never
 * leaves the device: nothing is uploaded to ARTI or any other service. When the
 * engine hands back a data URL we decode it locally; when it hands back a
 * temporary remote URL we fetch the bytes directly from that host (the engine
 * must permit the request) and hand the browser a Blob.
 *
 * If a remote URL cannot be fetched (expired or cross-origin restricted), we do
 * not pretend the download succeeded — we report the real reason and offer the
 * engine's own URL as the fallback.
 *
 * A series is downloaded per-episode (or per selected episode); ARTI never
 * attempts to package a multi-terabyte production into one archive.
 */

export type DownloadOutcome =
  | { ok: true; filename: string; method: 'blob' }
  | { ok: false; reason: string; remoteUrl?: string };

function extensionFor(format: string): string {
  const f = format.toLowerCase();
  if (f === 'webm') return 'webm';
  if (f === 'mov') return 'mov';
  if (f === 'mkv') return 'mkv';
  if (f === 'm4v') return 'm4v';
  return 'mp4';
}

/** Build a safe, meaningful filename from a title/prompt and index. */
export function buildVideoFilename(title: string, format: string, index = 1): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
  const stamp = new Date().toISOString().slice(0, 10);
  const suffix = index > 1 ? `-${index}` : '';
  return `arti-${slug || 'video'}${suffix}-${stamp}.${extensionFor(format)}`;
}

async function toBlob(url: string): Promise<Blob> {
  if (url.startsWith('data:')) {
    const res = await fetch(url);
    return res.blob();
  }
  // Remote engine URL: fetch the bytes directly from the engine's host.
  const res = await fetch(url, { mode: 'cors' });
  if (!res.ok) throw new Error(`Engine returned ${res.status}`);
  return res.blob();
}

function triggerDownload(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so the navigation has started; the browser keeps
  // the already-resolved blob alive for the in-flight download.
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

/**
 * Download one generated video. Returns a truthful outcome — a failure never
 * masquerades as a successful save.
 */
export async function downloadVideo(
  videoUrl: string,
  title: string,
  format: string,
  index = 1
): Promise<DownloadOutcome> {
  const filename = buildVideoFilename(title, format, index);
  try {
    const blob = await toBlob(videoUrl);
    triggerDownload(blob, filename);
    return { ok: true, filename, method: 'blob' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return {
      ok: false,
      reason: `This video could not be downloaded directly (${message}). The engine URL may have expired or blocked the request.`,
      remoteUrl: videoUrl.startsWith('data:') ? undefined : videoUrl,
    };
  }
}

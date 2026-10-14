/**
 * ARTI AI — client-side music download.
 *
 * A genuine browser download of the actual generated/processed audio. The file
 * never leaves the device: nothing is uploaded to ARTI or any other service.
 * When the provider hands back a data URL we decode it locally; when it hands
 * back a temporary remote URL we fetch the bytes directly from that host (the
 * provider must permit the request) and hand the browser a Blob.
 *
 * If a remote URL cannot be fetched (expired or cross-origin restricted), we do
 * not pretend the download succeeded — we report the real reason.
 */

export type DownloadOutcome =
  | { ok: true; filename: string; method: 'blob' }
  | { ok: false; reason: string; remoteUrl?: string };

function extensionFor(format: string): string {
  const f = format.toLowerCase();
  if (f === 'wav') return 'wav';
  if (f === 'ogg') return 'ogg';
  if (f === 'm4a' || f === 'aac') return 'm4a';
  if (f === 'flac') return 'flac';
  return 'mp3';
}

/** Build a safe, meaningful filename from a title and index. */
export function buildMusicFilename(title: string, format: string, index = 1): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
  const stamp = new Date().toISOString().slice(0, 10);
  const suffix = index > 1 ? `-${index}` : '';
  return `arti-${slug || 'track'}${suffix}-${stamp}.${extensionFor(format)}`;
}

async function toBlob(url: string): Promise<Blob> {
  if (url.startsWith('data:')) {
    const res = await fetch(url);
    return res.blob();
  }
  const res = await fetch(url, { mode: 'cors' });
  if (!res.ok) throw new Error(`Provider returned ${res.status}`);
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
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

/**
 * Download one track. Returns a truthful outcome — a failure never masquerades
 * as a successful save.
 */
export async function downloadTrack(
  audioUrl: string,
  title: string,
  format: string,
  index = 1
): Promise<DownloadOutcome> {
  const filename = buildMusicFilename(title, format, index);
  try {
    const blob = await toBlob(audioUrl);
    triggerDownload(blob, filename);
    return { ok: true, filename, method: 'blob' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return {
      ok: false,
      reason: `This track could not be downloaded directly (${message}). The provider URL may have expired or blocked the request.`,
      remoteUrl: audioUrl.startsWith('data:') ? undefined : audioUrl,
    };
  }
}

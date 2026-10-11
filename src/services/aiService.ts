/**
 * ARTI AI — AI response integration boundary.
 *
 * This is the single place where ARTI talks to a language model. No other
 * module in the app is allowed to fabricate, mock, or simulate a model
 * response; if no provider is configured, callers receive an honest error and
 * the UI shows a real "not connected" state with a recovery path.
 *
 * Supported providers (configured in Settings > Connected Services):
 *   - Anthropic Claude   (browser direct API, opt-in via api.anthropic.com)
 *   - OpenAI             (browser direct API, opt-in via api.openai.com)
 *
 * SECURITY: the API key is read from localStorage where the owner stored it in
 * this browser and is sent only to the chosen provider's own API host. It is
 * never logged, never sent to any other origin, and never bundled into the
 * build. Direct browser calls to these providers require the owner's opt-in
 * header (see `dangerouslyAllowBrowser`); the honest limitation is documented
 * in Settings and surfaced in the conversation notice.
 */

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export type AiProvider = 'anthropic' | 'openai';

export type AiErrorCode =
  | 'not-configured'
  | 'network'
  | 'auth'
  | 'rate-limit'
  | 'provider';

export class AiServiceError extends Error {
  readonly code: AiErrorCode;
  readonly retryable: boolean;

  constructor(code: AiErrorCode, message: string, retryable: boolean) {
    super(message);
    this.name = 'AiServiceError';
    this.code = code;
    this.retryable = retryable;
  }
}

export interface AiConnection {
  provider: AiProvider;
  key: string;
  model: string;
}

const ANTHROPIC_ENDPOINT = 'https://api.anthropic.com/v1/messages';
const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const ANTHROPIC_VERSION = '2023-06-01';

const DEFAULT_MODELS: Record<AiProvider, string> = {
  anthropic: 'claude-3-5-sonnet-latest',
  openai: 'gpt-4o-mini',
};

function readKey(name: string): string {
  if (typeof window === 'undefined') return '';
  try {
    return (window.localStorage.getItem(name) || '').trim();
  } catch {
    return '';
  }
}

/**
 * Resolve the active provider from the keys the owner stored in Settings.
 * Anthropic is preferred when both are present. Returns `null` when nothing is
 * configured — the caller must then show the real "not connected" state.
 */
export function getConnection(): AiConnection | null {
  const anthropicKey = readKey('arti_key_anthropic');
  if (anthropicKey) {
    return { provider: 'anthropic', key: anthropicKey, model: DEFAULT_MODELS.anthropic };
  }
  const openaiKey = readKey('arti_key_openai');
  if (openaiKey) {
    return { provider: 'openai', key: openaiKey, model: DEFAULT_MODELS.openai };
  }
  return null;
}

export function isAiConfigured(): boolean {
  return getConnection() !== null;
}

export function getProviderLabel(provider: AiProvider): string {
  return provider === 'anthropic' ? 'Anthropic Claude' : 'OpenAI';
}

function classifyStatus(status: number): AiErrorCode {
  if (status === 401 || status === 403) return 'auth';
  if (status === 429) return 'rate-limit';
  return 'provider';
}

async function requestAnthropic(
  conn: AiConnection,
  turns: ChatTurn[],
  signal: AbortSignal
): Promise<string> {
  const messages = turns.map((t) => ({ role: t.role, content: t.content }));
  const res = await fetch(ANTHROPIC_ENDPOINT, {
    method: 'POST',
    signal,
    headers: {
      'content-type': 'application/json',
      'x-api-key': conn.key,
      'anthropic-version': ANTHROPIC_VERSION,
      // Opt-in header required by Anthropic for direct browser calls.
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: conn.model,
      max_tokens: 2048,
      messages,
    }),
  });

  if (!res.ok) {
    throw new AiServiceError(classifyStatus(res.status), `Anthropic API error ${res.status}`, res.status >= 500 || res.status === 429);
  }
  const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  const text = (data.content || [])
    .filter((b) => b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text as string)
    .join('');
  if (!text.trim()) {
    throw new AiServiceError('provider', 'Anthropic returned an empty response.', true);
  }
  return text;
}

async function requestOpenAI(
  conn: AiConnection,
  turns: ChatTurn[],
  signal: AbortSignal
): Promise<string> {
  const res = await fetch(OPENAI_ENDPOINT, {
    method: 'POST',
    signal,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${conn.key}`,
    },
    body: JSON.stringify({
      model: conn.model,
      messages: turns.map((t) => ({ role: t.role, content: t.content })),
    }),
  });

  if (!res.ok) {
    throw new AiServiceError(classifyStatus(res.status), `OpenAI API error ${res.status}`, res.status >= 500 || res.status === 429);
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = data.choices?.[0]?.message?.content || '';
  if (!text.trim()) {
    throw new AiServiceError('provider', 'OpenAI returned an empty response.', true);
  }
  return text;
}

/**
 * Send the full conversation so far and return the assistant's reply.
 * Throws {@link AiServiceError} on every failure path; it never returns a
 * fabricated answer.
 */
export async function sendChatCompletion(
  turns: ChatTurn[],
  signal: AbortSignal
): Promise<string> {
  const conn = getConnection();
  if (!conn) {
    throw new AiServiceError(
      'not-configured',
      'No AI provider is connected. Add an Anthropic or OpenAI API key in Settings > Connected Services.',
      false
    );
  }

  try {
    return conn.provider === 'anthropic'
      ? await requestAnthropic(conn, turns, signal)
      : await requestOpenAI(conn, turns, signal);
  } catch (err) {
    if (err instanceof AiServiceError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new AiServiceError(
      'network',
      'Could not reach the AI provider. Check your network connection and try again.',
      true
    );
  }
}

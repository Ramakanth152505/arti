/**
 * ARTI AI — intelligent prompt clarification for the Images workspace.
 *
 * The goal is to help a user express intent without writing an expert-level
 * prompt. The engine has two modes, and it always reports which one it used:
 *
 *   - `model`  — when a real language model is connected in Settings, the
 *                prompt is analysed by that model (strict JSON contract).
 *   - `rules`  — a transparent, deterministic keyword analyser. It is NOT an
 *                autonomous AI analyst and the UI labels it as a rule-based
 *                check so its limitation is never overstated.
 *
 * Either way the original prompt is preserved verbatim and only genuinely
 * unresolved details are asked about — a detail already present in the prompt
 * is never re-asked.
 */

import { isAiConfigured, sendChatCompletion } from './aiService';
import { getStyleById, type ImageStyle } from './imageStyles';

export interface ClarificationOption {
  value: string;
  label: string;
}

export interface ClarificationQuestion {
  id: string;
  question: string;
  hint?: string;
  options: ClarificationOption[];
  /** `technical` questions gate the request; `preference` questions are optional. */
  kind: 'technical' | 'preference';
  allowCustom: boolean;
}

export interface PromptAnalysis {
  /** Which engine produced this analysis — surfaced honestly in the UI. */
  method: 'rules' | 'model';
  /** True when at least one unresolved preference/technical detail remains. */
  needsClarification: boolean;
  questions: ClarificationQuestion[];
  /** Human-readable domains detected in the prompt (for transparency). */
  detected: string[];
  /** True when the user explicitly asked to generate without questions. */
  immediateRequested: boolean;
}

/* --------------------------------------------------------------------------
   Aspect-ratio / dimension catalogue.
   -------------------------------------------------------------------------- */
export interface AspectRatioOption {
  value: string;
  label: string;
  /** width / height. */
  ratio: number;
  kind: 'square' | 'portrait' | 'landscape' | 'custom';
}

export const ASPECT_RATIOS: AspectRatioOption[] = [
  { value: '1:1', label: 'Square 1:1', ratio: 1, kind: 'square' },
  { value: '4:5', label: 'Portrait 4:5', ratio: 0.8, kind: 'portrait' },
  { value: '2:3', label: 'Tall portrait 2:3', ratio: 2 / 3, kind: 'portrait' },
  { value: '9:16', label: 'Vertical 9:16', ratio: 9 / 16, kind: 'portrait' },
  { value: '3:2', label: 'Landscape 3:2', ratio: 1.5, kind: 'landscape' },
  { value: '16:9', label: 'Wide landscape 16:9', ratio: 16 / 9, kind: 'landscape' },
  { value: '21:9', label: 'Ultrawide 21:9', ratio: 21 / 9, kind: 'landscape' },
  { value: 'panorama', label: 'Panorama (3:1)', ratio: 3, kind: 'landscape' },
  { value: 'custom', label: 'Custom dimensions', ratio: 1, kind: 'custom' },
];

export function getAspectRatio(value: string): AspectRatioOption {
  return ASPECT_RATIOS.find((a) => a.value === value) ?? ASPECT_RATIOS[0];
}

/* --------------------------------------------------------------------------
   Rule-based detection tables.
   -------------------------------------------------------------------------- */
interface Domain {
  id: string;
  label: string;
  keywords: RegExp;
  /** Matches when the prompt already names a specific scene in this domain. */
  specified: RegExp;
  sceneOptions: ClarificationOption[];
}

const DOMAINS: Domain[] = [
  {
    id: 'nature',
    label: 'nature',
    keywords: /\b(nature|landscape|mountain|forest|ocean|sea|beach|coast|waterfall|desert|snow|sunrise|sunset|tree|wildflower|flower|river|lake|jungle|valley|field|sky|clouds?|wildlife|animal|bird|meadow|glacier|canyon)\b/i,
    specified: /\b(mountain|forest|sunrise|sunset|ocean|sea|beach|coast|waterfall|desert|snow|flower|plant|wildlife|animal|river|lake|valley|field|meadow|glacier|canyon)\b/i,
    sceneOptions: [
      { value: 'mountains', label: 'Mountains' },
      { value: 'forest', label: 'Forest' },
      { value: 'sunrise-sunset', label: 'Sunrise or sunset' },
      { value: 'ocean', label: 'Ocean' },
      { value: 'waterfall', label: 'Waterfall' },
      { value: 'flowers-plants', label: 'Flowers and plants' },
      { value: 'wildlife', label: 'Wildlife' },
      { value: 'mixed-landscape', label: 'A mixed natural landscape' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    id: 'people',
    label: 'people',
    keywords: /\b(portrait|person|people|man|woman|child|girl|boy|face|character|figure|model|fashion|human|family|dancer|warrior|knight|hero|queen|king)\b/i,
    specified: /\b(portrait|full-?body|close-?up|group|face|character|bust)\b/i,
    sceneOptions: [
      { value: 'single-portrait', label: 'Single portrait' },
      { value: 'group', label: 'Group of people' },
      { value: 'full-body', label: 'Full-body figure' },
      { value: 'character-design', label: 'Fictional character' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    id: 'architecture',
    label: 'architecture',
    keywords: /\b(architecture|building|house|interior|city|tower|bridge|castle|temple|cathedral|street|skyline|room|facade)\b/i,
    specified: /\b(interior|exterior|cityscape|ruins|skyline|room)\b/i,
    sceneOptions: [
      { value: 'exterior', label: 'Building exterior' },
      { value: 'interior', label: 'Interior space' },
      { value: 'cityscape', label: 'Cityscape' },
      { value: 'ruins', label: 'Ruins or historic structure' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    id: 'product',
    label: 'product',
    keywords: /\b(product|bottle|watch|shoe|gadget|packaging|brand|logo|device|phone|laptop|car|vehicle|furniture)\b/i,
    specified: /\b(hero|flat-?lay|lifestyle|studio shot)\b/i,
    sceneOptions: [
      { value: 'hero-shot', label: 'Hero product shot' },
      { value: 'lifestyle', label: 'Lifestyle context' },
      { value: 'flat-lay', label: 'Flat-lay arrangement' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    id: 'fantasy',
    label: 'fantasy',
    keywords: /\b(fantasy|dragon|magic|wizard|elf|myth|legend|kingdom|sorcer|spell|enchant|fairy|demon|angel)\b/i,
    specified: /\b(dragon|creature|kingdom|wizard|castle)\b/i,
    sceneOptions: [
      { value: 'epic-scene', label: 'Epic scene' },
      { value: 'creature', label: 'Creature or being' },
      { value: 'magical-place', label: 'Magical place' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    id: 'scifi',
    label: 'science fiction',
    keywords: /\b(scifi|science fiction|cyberpunk|spaceship|robot|android|futuristic|space|alien|mech|hologram|neon)\b/i,
    specified: /\b(city|space|spaceship|robot|android|mech)\b/i,
    sceneOptions: [
      { value: 'city', label: 'Future city' },
      { value: 'space', label: 'Space scene' },
      { value: 'technology', label: 'Technology or machine' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    id: 'abstract',
    label: 'abstract',
    keywords: /\b(abstract|pattern|geometric|texture|gradient|shapes?|minimal|conceptual)\b/i,
    specified: /\b(pattern|texture|geometric|minimal)\b/i,
    sceneOptions: [
      { value: 'pattern', label: 'Repeating pattern' },
      { value: 'composition', label: 'Free composition' },
      { value: 'texture', label: 'Texture study' },
      { value: 'other', label: 'Other' },
    ],
  },
];

const MOOD_KEYWORDS = /\b(peaceful|calm|serene|dramatic|moody|dreamlike|ethereal|realistic|natural|magical|dark|atmospheric|mysterious|tense|joyful|melancholic|epic|romantic|cozy|cosy|warm|cold|eerie|hopeful|nostalgic|vibrant|quiet|energetic)\b/i;

const COMPOSITION_KEYWORDS = /\b(wide|landscape orientation|close-?up|macro|aerial|drone|panoram|portrait orientation|centered|centred|symmetr|rule of thirds|overhead|top-down|low angle|high angle|eye level|full frame|full-body|bust)\b/i;

const USE_KEYWORDS = /\b(wallpaper|desktop|mobile|phone|social media|instagram|poster|banner|website|presentation|print|printing|thumbnail|cover|album|book)\b/i;

const IMMEDIATE_KEYWORDS = /\b(generate now|just generate|no questions|without questions|immediately|skip questions|asap|right away)\b/i;

function detectDomains(prompt: string): Domain[] {
  return DOMAINS.filter((d) => d.keywords.test(prompt));
}

/* --------------------------------------------------------------------------
   Rule-based analysis.
   -------------------------------------------------------------------------- */
function analyzeWithRules(prompt: string): PromptAnalysis {
  const text = prompt.trim();
  const detectedDomains = detectDomains(text);
  const detected = detectedDomains.map((d) => d.label);
  const immediateRequested = IMMEDIATE_KEYWORDS.test(text);

  const hasMood = MOOD_KEYWORDS.test(text);
  const hasComposition = COMPOSITION_KEYWORDS.test(text);
  const hasUse = USE_KEYWORDS.test(text);

  const questions: ClarificationQuestion[] = [];

  // Scene / subject — only when no domain is already named.
  if (detectedDomains.length === 0) {
    questions.push({
      id: 'subject',
      question: 'What kind of image do you want?',
      hint: 'Pick the closest subject so the result is on target.',
      kind: 'preference',
      allowCustom: true,
      options: [
        { value: 'nature', label: 'A natural scene' },
        { value: 'people', label: 'A person or character' },
        { value: 'architecture', label: 'Architecture or a place' },
        { value: 'product', label: 'A product or object' },
        { value: 'fantasy', label: 'A fantasy scene' },
        { value: 'scifi', label: 'A science-fiction scene' },
        { value: 'abstract', label: 'Something abstract' },
        { value: 'other', label: 'Other' },
      ],
    });
  } else {
    const domain = detectedDomains[0];
    // Only ask about the scene when the prompt does not already name one.
    if (!domain.specified.test(text)) {
      questions.push({
        id: 'scene',
        question: `What type of ${domain.label} scene do you want?`,
        kind: 'preference',
        allowCustom: true,
        options: domain.sceneOptions,
      });
    }
  }

  // Mood — only when the prompt expresses no mood.
  if (!hasMood) {
    questions.push({
      id: 'mood',
      question: 'What mood should the image have?',
      kind: 'preference',
      allowCustom: true,
      options: [
        { value: 'peaceful', label: 'Peaceful' },
        { value: 'dramatic', label: 'Dramatic' },
        { value: 'dreamlike', label: 'Dreamlike' },
        { value: 'realistic', label: 'Realistic' },
        { value: 'magical', label: 'Magical' },
        { value: 'dark-atmospheric', label: 'Dark and atmospheric' },
        { value: 'other', label: 'Other' },
      ],
    });
  }

  // Composition — only when the prompt expresses none.
  if (!hasComposition) {
    questions.push({
      id: 'composition',
      question: 'What composition do you prefer?',
      kind: 'preference',
      allowCustom: true,
      options: [
        { value: 'wide-landscape', label: 'Wide landscape' },
        { value: 'close-up', label: 'Close-up' },
        { value: 'aerial', label: 'Aerial view' },
        { value: 'panoramic', label: 'Panoramic view' },
        { value: 'portrait-composition', label: 'Portrait composition' },
        { value: 'other', label: 'Other' },
      ],
    });
  }

  // Intended use — only when not stated.
  if (!hasUse) {
    questions.push({
      id: 'use',
      question: 'What is the intended use?',
      kind: 'preference',
      allowCustom: true,
      options: [
        { value: 'desktop-wallpaper', label: 'Desktop wallpaper' },
        { value: 'mobile-wallpaper', label: 'Mobile wallpaper' },
        { value: 'social-post', label: 'Social-media post' },
        { value: 'website-banner', label: 'Website banner' },
        { value: 'presentation', label: 'Presentation' },
        { value: 'printing', label: 'Printing' },
        { value: 'general', label: 'General use' },
        { value: 'other', label: 'Other' },
      ],
    });
  }

  // A very short prompt with nothing resolved still needs the core question.
  const needsClarification =
    questions.length > 0 &&
    !(immediateRequested && (detectedDomains.length > 0 || text.split(/\s+/).length >= 8));

  return { method: 'rules', needsClarification, questions, detected, immediateRequested };
}

/* --------------------------------------------------------------------------
   Optional model-assisted analysis. Used only when a language model is
   genuinely connected; any failure falls back to the rule engine.
   -------------------------------------------------------------------------- */
interface ModelQuestion {
  id?: unknown;
  question?: unknown;
  hint?: unknown;
  options?: unknown;
  allowCustom?: unknown;
}

function coerceModelQuestions(raw: unknown, ruleFallback: PromptAnalysis): ClarificationQuestion[] {
  if (!Array.isArray(raw)) return ruleFallback.questions;
  const out: ClarificationQuestion[] = [];
  for (const item of raw as ModelQuestion[]) {
    if (!item || typeof item.question !== 'string') continue;
    const options = Array.isArray(item.options)
      ? (item.options as unknown[])
          .map((o) => (typeof o === 'string' ? { value: o, label: o } : null))
          .filter((o): o is ClarificationOption => o !== null)
      : [];
    if (options.length === 0) continue;
    out.push({
      id: typeof item.id === 'string' ? item.id : 'q' + out.length,
      question: item.question,
      hint: typeof item.hint === 'string' ? item.hint : undefined,
      options,
      kind: 'preference',
      allowCustom: item.allowCustom !== false,
    });
    if (out.length >= 5) break;
  }
  return out.length > 0 ? out : ruleFallback.questions;
}

async function analyzeWithModel(
  prompt: string,
  style: ImageStyle | undefined,
  signal: AbortSignal
): Promise<PromptAnalysis> {
  const system =
    'You are an image-prompt clarifier. Given a user prompt, list only the genuinely unresolved visual choices ' +
    '(scene, mood, composition, lighting, intended use). Never ask about a detail already present in the prompt. ' +
    'Reply with strict JSON: {"questions":[{"id":"mood","question":"...","hint":"...","options":["..."],"allowCustom":true}]}. ' +
    'At most 5 questions, 3-8 options each.';
  const styleNote = style ? ` Selected style: ${style.name}.` : '';
  const reply = await sendChatCompletion(
    [{ role: 'user', content: `${system}\n\nPrompt: "${prompt}".${styleNote}` }],
    signal
  );
  const jsonText = reply.slice(reply.indexOf('{'), reply.lastIndexOf('}') + 1);
  const parsed = JSON.parse(jsonText) as { questions?: unknown };
  const ruleFallback = analyzeWithRules(prompt);
  const questions = coerceModelQuestions(parsed.questions, ruleFallback);
  return {
    method: 'model',
    needsClarification: questions.length > 0,
    questions,
    detected: ruleFallback.detected,
    immediateRequested: ruleFallback.immediateRequested,
  };
}

/**
 * Analyse a prompt. Uses the connected language model when available, and
 * otherwise (or on any failure) the transparent rule engine. Never throws.
 */
export async function analyzePrompt(
  prompt: string,
  style: ImageStyle | undefined,
  signal: AbortSignal
): Promise<PromptAnalysis> {
  const text = prompt.trim();
  if (!text) {
    return { method: 'rules', needsClarification: false, questions: [], detected: [], immediateRequested: false };
  }
  if (isAiConfigured()) {
    try {
      const analysis = await analyzeWithModel(text, style, signal);
      // The model may return nothing; keep the honest rule fallback then.
      if (analysis.questions.length > 0) return analysis;
      return analyzeWithRules(text);
    } catch {
      return analyzeWithRules(text);
    }
  }
  return analyzeWithRules(text);
}

/* --------------------------------------------------------------------------
   Final prepared-prompt composition.
   -------------------------------------------------------------------------- */
export interface PreparedPromptInput {
  originalPrompt: string;
  styleId?: string;
  /** Question id → chosen label (or free-text custom answer). */
  answers: Record<string, string>;
  ratioLabel: string;
  sizeToken?: string;
  negativePrompt?: string;
}

/**
 * Combine the original prompt (verbatim), the selected style's real prompt
 * guidance, the clarification answers and the output shape into one prepared
 * prompt. Never contradicts or drops the user's original wording.
 */
export function buildPreparedPrompt(input: PreparedPromptInput): string {
  const parts: string[] = [input.originalPrompt.trim()];

  const style = getStyleById(input.styleId);
  if (style) parts.push(style.promptGuidance);

  const answerClauses = Object.entries(input.answers)
    .filter(([, value]) => value && value.trim() && value !== 'other')
    .map(([, value]) => value.trim());
  if (answerClauses.length > 0) parts.push(answerClauses.join(', '));

  if (input.ratioLabel) parts.push(`composition framing: ${input.ratioLabel}`);

  let prepared = parts.filter(Boolean).join('. ');

  if (input.negativePrompt && input.negativePrompt.trim()) {
    prepared += `\n\nNegative prompt: ${input.negativePrompt.trim()}`;
  }
  return prepared;
}

/** The default negative guidance for a style, when it declares one. */
export function defaultNegativeForStyle(styleId: string | undefined): string {
  return getStyleById(styleId)?.negativeGuidance ?? '';
}

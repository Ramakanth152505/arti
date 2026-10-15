/**
 * ARTI AI — Videos style library (single source of truth).
 *
 * A data-driven catalogue of reusable *visual* style definitions. Each entry
 * carries human-readable copy plus the real prompt guidance that is inserted
 * into the user's prompt before it reaches a provider — selecting
 * `Epic Cinematic` contributes cinematic guidance, not the bare word.
 *
 * Style describes HOW a video looks. It is deliberately separate from the video
 * *type* taxonomy (`videoTypes.ts`), which describes WHAT is being produced and
 * how the production is organised. The two controls never substitute for each
 * other.
 *
 * A style is a creative instruction, not a capability guarantee: it never
 * asserts that any provider renders it perfectly. Previews are honest CSS
 * swatches, never fabricated generated footage. Adding a style is a data change
 * only — the Videos UI is data-driven.
 */

export type VideoStyleCategoryId =
  | 'cinematic-realistic'
  | 'animation'
  | 'illustration-artistic'
  | 'historical-period'
  | 'fantasy-fictional'
  | 'sci-fi-futuristic'
  | 'additional-visual';

export interface VideoStyleCategory {
  id: VideoStyleCategoryId;
  label: string;
  description: string;
}

export interface VideoStyle {
  id: string;
  name: string;
  category: VideoStyleCategoryId;
  description: string;
  /** Positive prompt guidance inserted into the user's prompt. */
  promptGuidance: string;
  /** Optional negative-prompt guidance for providers that accept one. */
  negativeGuidance?: string;
  /** Two-colour swatch for the labelled style-preview tile. */
  swatch: [string, string];
}

export const VIDEO_STYLE_CATEGORIES: VideoStyleCategory[] = [
  { id: 'cinematic-realistic', label: 'Cinematic & Realistic', description: 'Camera-accurate, filmic and documentary treatments.' },
  { id: 'animation', label: 'Animation', description: '2D, 3D, hand-drawn and stylised animated looks.' },
  { id: 'illustration-artistic', label: 'Illustration & Artistic', description: 'Painterly, drawn and graphic-novel treatments.' },
  { id: 'historical-period', label: 'Historical & Period', description: 'Period-accurate eras, kingdoms and reenactment.' },
  { id: 'fantasy-fictional', label: 'Fantasy & Fictional Worlds', description: 'Invented worlds, myth and magic.' },
  { id: 'sci-fi-futuristic', label: 'Science Fiction & Futuristic', description: 'Futuristic, space and speculative technology.' },
  { id: 'additional-visual', label: 'Additional Visual Styles', description: 'Genre, format and commercial treatments.' },
];

/** Compact seed: [id, name, description, positiveGuidance, negativeGuidance?]. */
type StyleSeed = [string, string, string, string, string?];

/** Deterministic, muted swatch pairs drawn from the ARTI palette family. */
const SWATCHES: Array<[string, string]> = [
  ['#1F2A44', '#C6A75E'],
  ['#1F2A44', '#C6A75E'],
  ['#C6A75E', '#C6A75E'],
  ['#1F2A44', '#C6A75E'],
  ['#1F2A44', '#E8DCC8'],
  ['#1F2A44', '#E8DCC8'],
  ['#1F2A44', '#C6A75E'],
  ['#1F2A44', '#E8DCC8'],
  ['#1F2A44', '#C6A75E'],
  ['#1F2A44', '#E8DCC8'],
];

function build(category: VideoStyleCategoryId, seeds: StyleSeed[]): VideoStyle[] {
  return seeds.map((seed, i) => ({
    id: seed[0],
    name: seed[1],
    category,
    description: seed[2],
    promptGuidance: seed[3],
    negativeGuidance: seed[4],
    swatch: SWATCHES[(i + category.length) % SWATCHES.length],
  }));
}

const CINEMATIC_REALISTIC = build('cinematic-realistic', [
  ['photorealistic', 'Photorealistic', 'Camera-accurate realism.', 'photorealistic rendering, accurate real-world materials and skin, natural lighting response, believable depth of field, no stylisation'],
  ['ultra-realistic', 'Ultra-Realistic', 'Hyper-detailed realism.', 'ultra-realistic footage, fine micro-detail, physically accurate light and shadow, subtle sensor grain, lifelike motion'],
  ['cinematic-realism', 'Cinematic Realism', 'Filmic realism.', 'cinematic realism, motivated lighting, controlled depth of field, deliberate camera movement, filmic contrast and colour'],
  ['hollywood-cinematic', 'Hollywood-Inspired Cinematic', 'Studio-blockbuster look.', 'Hollywood-inspired cinematic staging, sweeping composition, dramatic key light, anamorphic feel, orchestral pacing'],
  ['documentary', 'Documentary', 'Observational documentary.', 'documentary footage, natural available light, handheld observational framing, candid real-world subjects, honest unpolished texture'],
  ['historical-documentary', 'Historical Documentary', 'Period documentary.', 'historical documentary treatment, period-appropriate dress and setting, restrained interview and archive-style framing, naturalistic light'],
  ['nature-documentary', 'Nature Documentary', 'Wildlife documentary.', 'nature documentary cinematography, telephoto wildlife framing, golden-hour natural light, patient observational pacing, macro detail'],
  ['travel-film', 'Travel Film', 'Travelogue footage.', 'travel film cinematography, immersive location framing, golden-hour light, sweeping establishing shots, authentic local colour'],
  ['epic-cinematic', 'Epic Cinematic', 'Grand-scale cinema.', 'epic cinematic scale, vast compositions, dramatic atmospheric light, slow deliberate camera moves, monumental sense of scale'],
  ['independent-film', 'Independent Film', 'Indie film texture.', 'independent film aesthetic, naturalistic performance, available light, intimate handheld framing, muted organic palette'],
  ['film-noir', 'Film Noir', 'Classic noir.', 'film noir, high-contrast black and white, deep shadows and slatted light, low-key chiaroscuro, moody hard lighting'],
  ['neo-noir', 'Neo-Noir', 'Modern noir.', 'neo-noir, saturated night colour, neon reflections on wet surfaces, deep shadows, cynical moody atmosphere'],
  ['vintage-cinema', 'Vintage Cinema', 'Aged film look.', 'vintage cinema, aged film stock, soft grain, halation, slight gate weave, muted period colour, gentle flicker'],
  ['retro-cinema', 'Retro Cinema', 'Retro film stock.', 'retro cinema, faded warm film stock, visible grain, soft contrast, period-authentic colour response'],
  ['slow-cinema', 'Slow Cinema', 'Contemplative pacing.', 'slow cinema, long static or very slow camera holds, minimal cutting, contemplative framing, natural ambient light'],
  ['experimental-cinema', 'Experimental Cinema', 'Avant-garde film.', 'experimental cinema, unconventional framing and editing rhythm, abstract visual motifs, deliberate formal play'],
  ['imax-composition', 'IMAX-Inspired Composition', 'Large-format scale.', 'IMAX-inspired composition, extremely large-format clarity, immersive scale, wide deep-focus vistas, minimal distortion'],
  ['architectural-film', 'Architectural Film', 'Architecture cinematography.', 'architectural cinematography, precise straight lines, measured symmetry, controlled daylight, slow revealing moves'],
  ['luxury-commercial', 'Luxury Commercial', 'Premium brand film.', 'luxury commercial, immaculate lighting, glossy premium surfaces, restrained elegant motion, high-end product polish'],
  ['product-advertisement', 'Product Advertisement', 'Product ad.', 'product advertisement, clean studio lighting, hero product framing, precise controlled moves, crisp commercial finish'],
  ['fashion-film', 'Fashion Film', 'Fashion editorial film.', 'fashion film, editorial styling, dramatic directional light, confident model movement, high-fashion colour grade'],
  ['sports-cinematography', 'Sports Cinematography', 'Sports action.', 'sports cinematography, dynamic tracking and panning, slow-motion peak action, stadium light, kinetic energy'],
  ['music-video', 'Music Video', 'Music promo.', 'music video treatment, stylised lighting and colour, rhythmic cutting, bold visual motifs, performance energy'],
  ['wedding-film', 'Wedding Film', 'Wedding cinematography.', 'wedding film, warm romantic light, intimate candid moments, soft shallow focus, graceful movement'],
  ['aerial-cinematography', 'Aerial Cinematography', 'Drone cinematography.', 'aerial drone cinematography, sweeping high vantage, smooth gliding movement, revealing scale from above'],
  ['surveillance-style', 'Surveillance-Style Footage', 'CCTV aesthetic (lawful creative use).', 'surveillance-style footage, fixed wide-angle perspective, high vantage, muted low-light detail, timestamped CCTV character'],
]);

const ANIMATION = build('animation', [
  ['2d-animation', '2D Animation', 'Flat 2D animation.', '2D animation, clean flat colour, clear shapes, expressive hand-drawn motion, consistent line'],
  ['3d-animation', '3D Animation', 'CGI animation.', '3D animation, appealing character rigging, soft global illumination, polished render, believable squash and stretch'],
  ['hand-drawn-animation', 'Traditional Hand-Drawn Animation', 'Classical cel animation.', 'traditional hand-drawn animation, visible inked line, painted cels, lively frame-by-frame motion'],
  ['anime', 'Anime', 'Japanese anime.', 'anime, cel-shaded colour, expressive large eyes, dynamic key animation, dramatic speed lines and lighting'],
  ['manga-inspired', 'Manga-Inspired Animation', 'Manga aesthetic.', 'manga-inspired animation, high-contrast ink shading, screen-tone texture, dramatic composition'],
  ['chibi-animation', 'Chibi Animation', 'Chibi characters.', 'chibi animation, exaggerated cute proportions, simple rounded shapes, bouncy playful motion'],
  ['cartoon', 'Cartoon', 'Cartoon look.', 'cartoon animation, bold outlines, bright flat palette, exaggerated expressive motion'],
  ['classic-cartoon', 'Classic Cartoon', 'Golden-age cartoon.', 'classic cartoon, rubber-hose animation, sepia-warm palette, hand-inked look, vintage timing'],
  ['modern-tv-animation', 'Modern TV Animation', 'TV animation.', 'modern TV animation, clean vector colour, snappy timing, appealing simplified character design'],
  ['stylized-3d-animation', 'Stylized 3D Animation', 'Stylised CGI.', 'stylised 3D animation, exaggerated proportions, painterly textures on 3D forms, expressive stylised lighting'],
  ['stop-motion', 'Stop-Motion Animation', 'Stop-motion.', 'stop-motion animation, tactile miniature sets, visible frame-to-frame increments, practical lighting'],
  ['clay-animation', 'Clay Animation', 'Claymation.', 'clay animation, plasticine characters, visible fingerprints and sculpted texture, warm practical light'],
  ['paper-cut-animation', 'Paper-Cut Animation', 'Cut-out animation.', 'paper-cut animation, layered cut-paper shapes, subtle shadow depth, flat planar motion'],
  ['puppet-animation', 'Puppet Animation', 'Puppet theatre.', 'puppet animation, articulated marionette characters, visible strings or rods, theatrical staging'],
  ['motion-graphics', 'Motion Graphics', 'Animated graphics.', 'motion graphics, clean geometric shapes, precise easing, typographic movement, crisp graphic colour'],
  ['experimental-animation', 'Experimental Animation', 'Abstract animation.', 'experimental animation, abstract shape and colour, unconventional motion, formal visual play'],
  ['storybook-animation', 'Storybook Animation', 'Illustrated storybook.', 'storybook animation, illustrated children\'s-book style, soft palette, gentle storybook motion'],
  ['family-animation', 'Family Animation', 'Family-friendly CGI.', 'family animation, warm appealing character design, bright inviting colour, gentle expressive performance'],
  ['stylized-action-animation', 'Stylized Action Animation', 'Action animation.', 'stylised action animation, dynamic key poses, impact frames, exaggerated smears, kinetic camera'],
]);

const ILLUSTRATION_ARTISTIC = build('illustration-artistic', [
  ['pencil-sketch', 'Pencil Sketch', 'Graphite drawing.', 'pencil sketch, graphite shading and hatching, visible paper tooth, hand-drawn line'],
  ['charcoal-sketch', 'Charcoal Sketch', 'Charcoal drawing.', 'charcoal drawing, smudged deep blacks, rough textured strokes, expressive tonal mass'],
  ['ink-illustration', 'Ink Illustration', 'Pen-and-ink.', 'ink illustration, confident varied line weight, cross-hatched shading, high contrast'],
  ['watercolor', 'Watercolor', 'Watercolour painting.', 'watercolour, translucent washes, soft blooming edges, visible paper grain, luminous layered colour'],
  ['oil-painting', 'Oil Painting', 'Oil paint.', 'oil painting, visible impasto brushwork, rich blended colour, classical painterly light'],
  ['acrylic-painting', 'Acrylic Painting', 'Acrylic paint.', 'acrylic painting, bold opaque colour, crisp edges, flat painterly planes'],
  ['digital-painting', 'Digital Painting', 'Digital painting.', 'digital painting, painterly brush texture, controlled lighting, rich rendered colour'],
  ['pastel-art', 'Pastel Art', 'Pastel drawing.', 'pastel drawing, soft chalky texture, blended warm colour, visible paper tooth'],
  ['comic-book-style', 'Comic-Book Style', 'Comic art.', 'comic-book style, bold inked outlines, flat vivid colour, dramatic panel-like composition'],
  ['graphic-novel-style', 'Graphic-Novel Style', 'Graphic novel.', 'graphic-novel style, restrained ink line, muted limited palette, atmospheric shading'],
  ['storyboard-style', 'Storyboard Style', 'Storyboard panels.', 'storyboard style, loose monochrome line sketches, clear staging and camera notation, quick tonal shading'],
  ['minimalist-illustration', 'Minimalist Illustration', 'Minimal illustration.', 'minimalist illustration, reduced flat shapes, generous negative space, limited palette'],
  ['surrealist-art', 'Surrealist Art', 'Surrealism.', 'surrealist art, dreamlike juxtaposition, impossible scale, uncanny quiet atmosphere'],
  ['abstract-animation', 'Abstract Animation', 'Abstract motion.', 'abstract animation, non-representational shape and colour, rhythmic motion, formal experimentation'],
  ['impressionist-visuals', 'Impressionist-Inspired Visuals', 'Impressionism.', 'impressionist-inspired visuals, broken dabs of colour, soft atmospheric light, shimmering surface'],
  ['expressionist-visuals', 'Expressionist-Inspired Visuals', 'Expressionism.', 'expressionist-inspired visuals, distorted expressive forms, heightened emotion colour, bold brush energy'],
  ['art-nouveau-visuals', 'Art Nouveau-Inspired Visuals', 'Art Nouveau.', 'art nouveau-inspired visuals, flowing organic line, decorative floral motif, ornamental composition'],
  ['art-deco-visuals', 'Art Deco-Inspired Visuals', 'Art Deco.', 'art deco-inspired visuals, geometric ornament, streamlined symmetry, metallic gold and deep contrast'],
  ['paper-texture', 'Paper Texture', 'Paper-grain aesthetic.', 'paper-texture aesthetic, visible fibrous grain, soft deckled edges, tactile printed feel'],
  ['cut-paper-illustration', 'Cut-Paper Illustration', 'Cut-paper art.', 'cut-paper illustration, crisp layered silhouettes, subtle drop shadow, bold flat colour'],
  ['ink-wash-visuals', 'Ink-Wash-Inspired Visuals', 'Ink wash.', 'ink-wash-inspired visuals, flowing diluted ink, soft bleeding gradients, contemplative negative space'],
]);

const HISTORICAL_PERIOD = build('historical-period', [
  ['ancient-civilizations', 'Ancient Civilizations', 'Ancient world.', 'ancient civilization setting, period-appropriate architecture and dress, sun-baked materials, historically grounded detail'],
  ['ancient-kingdoms', 'Ancient Kingdoms', 'Ancient kingdoms.', 'ancient kingdom setting, monumental stone architecture, period costume and craft detail, warm natural light'],
  ['medieval-kingdoms', 'Medieval Kingdoms', 'Medieval era.', 'medieval kingdom setting, stone castles and timber towns, period-accurate clothing and armour, overcast northern light'],
  ['royal-courts', 'Royal Courts', 'Royal court drama.', 'royal court setting, opulent period interiors, courtly dress, candlelit dramatic atmosphere'],
  ['historical-war-drama', 'Historical War Drama', 'War drama.', 'historical war drama, period-accurate uniforms and equipment, gritty battlefield atmosphere, desaturated palette'],
  ['ancient-indian-historical', 'Ancient Indian Historical Drama', 'Indian period drama.', 'ancient Indian historical drama, period-appropriate temples, textiles and ornament, warm golden light, historically grounded detail'],
  ['mythological-epic', 'Mythological Epic', 'Mythic epic.', 'mythological epic, grand divine scale, ornate iconography, dramatic celestial light, reverent staging'],
  ['ancient-architecture', 'Ancient Architecture', 'Ancient architecture.', 'ancient architecture focus, monumental masonry, weathered stone detail, raking architectural light'],
  ['renaissance-drama', 'Renaissance-Inspired Drama', 'Renaissance era.', 'renaissance-inspired drama, period garments, painterly chiaroscuro light, richly detailed interiors'],
  ['victorian-period-drama', 'Victorian Period Drama', 'Victorian era.', 'Victorian period drama, period dress and interiors, gaslight warmth, restrained formal staging'],
  ['mughal-historical-drama', 'Mughal-Inspired Historical Drama', 'Mughal era.', 'Mughal-inspired historical drama, intricate architecture and textiles, ornate detail, warm hazy light'],
  ['medieval-european-fantasy', 'Medieval European Fantasy', 'Medieval fantasy.', 'medieval European fantasy, thatched and stone settlements, period-fantasy dress, misty atmospheric light'],
  ['historical-adventure', 'Historical Adventure', 'Period adventure.', 'historical adventure, sweeping period locations, dynamic staging, sunlit naturalistic light'],
  ['archaeological-reconstruction', 'Archaeological Reconstruction', 'Reconstruction.', 'archaeological reconstruction, evidence-grounded structure and artefact detail, neutral documentary lighting'],
  ['period-authentic-documentary', 'Period-Authentic Documentary', 'Period documentary.', 'period-authentic documentary, researched dress and setting, naturalistic light, restrained observational framing'],
  ['historical-reenactment', 'Historical Reenactment', 'Reenactment.', 'historical reenactment, costumed participants, authentic period props, natural daylight, honest documentary tone'],
]);

const FANTASY_FICTIONAL = build('fantasy-fictional', [
  ['high-fantasy', 'High Fantasy', 'High fantasy.', 'high fantasy, sweeping otherworldly landscapes, mythic architecture, luminous magic, epic scale'],
  ['dark-fantasy', 'Dark Fantasy', 'Dark fantasy.', 'dark fantasy, ominous shadowed world, gothic ruins, brooding palette, unsettling atmosphere'],
  ['epic-fantasy', 'Epic Fantasy', 'Epic fantasy.', 'epic fantasy, vast kingdoms and armies, monumental scale, dramatic sky, mythic gravitas'],
  ['medieval-fantasy', 'Medieval Fantasy', 'Medieval fantasy.', 'medieval fantasy, feudal settlements, period-fantasy costume, atmospheric forest and castle light'],
  ['mythological-fantasy', 'Mythological Fantasy', 'Mythic fantasy.', 'mythological fantasy, divine beings and legendary creatures, ornate sacred iconography, dramatic light'],
  ['magical-kingdoms', 'Magical Kingdoms', 'Enchanted kingdoms.', 'magical kingdom, enchanted architecture, glowing arcane detail, whimsical luminous atmosphere'],
  ['dragons-creatures', 'Dragons & Mythical Creatures', 'Mythical creatures.', 'mythical creatures and dragons, grand anatomical scale, scaled and leathery detail, dramatic reveal lighting'],
  ['royal-dynasties', 'Royal Dynasties', 'Dynastic drama.', 'royal dynasty setting, heraldic ornament, opulent court interiors, stately formal staging'],
  ['lost-civilizations', 'Lost Civilizations', 'Lost world.', 'lost civilization, overgrown ruins, enigmatic ancient technology, humid jungle light, sense of mystery'],
  ['alternate-history', 'Alternate History', 'Alternate timeline.', 'alternate-history setting, familiar-but-changed world detail, period-fusion design, grounded plausibility'],
  ['fairy-tale-fantasy', 'Fairy-Tale Fantasy', 'Fairy-tale world.', 'fairy-tale fantasy, storybook charm, enchanted forest detail, soft magical light'],
  ['gothic-fantasy', 'Gothic Fantasy', 'Gothic fantasy.', 'gothic fantasy, cathedral-like architecture, gargoyles and stained glass, moody low-key light'],
  ['supernatural-drama', 'Supernatural Drama', 'Supernatural.', 'supernatural drama, uncanny quiet tension, muted palette, subtle otherworldly detail'],
  ['cosmic-fantasy', 'Cosmic Fantasy', 'Cosmic fantasy.', 'cosmic fantasy, colossal celestial scale, swirling nebulae, awe-struck framing'],
  ['fictional-empire', 'Fictional Empire', 'Invented empire.', 'fictional empire, monumental imperial architecture, disciplined ceremonial scale, authoritative lighting'],
  ['interplanetary-civilization', 'Interplanetary Civilization', 'Interplanetary world.', 'interplanetary civilization, multi-world architecture, vast transit scale, planetary light'],
  ['futuristic-kingdom', 'Futuristic Kingdom', 'Future kingdom.', 'futuristic kingdom, ornate high-technology palace, luminous materials, regal futuristic atmosphere'],
  ['original-fictional-universe', 'Original Fictional Universe', 'Original universe.', 'original fictional universe, cohesive invented world design, consistent internal rules, distinctive visual identity'],
]);

const SCI_FI_FUTURISTIC = build('sci-fi-futuristic', [
  ['hard-science-fiction', 'Hard Science Fiction', 'Hard sci-fi.', 'hard science fiction, physically plausible technology, realistic spacecraft and physics, grounded industrial detail'],
  ['space-exploration', 'Space Exploration', 'Space exploration.', 'space exploration, realistic orbital and planetary environments, vacuum light, awe and isolation'],
  ['space-opera', 'Space Opera', 'Space opera.', 'space opera, grand interstellar scale, dramatic fleets and worlds, sweeping romantic composition'],
  ['cyberpunk', 'Cyberpunk', 'Cyberpunk.', 'cyberpunk, rain-slick neon streets, high-tech low-life contrast, dense signage, moody night colour'],
  ['biopunk', 'Biopunk', 'Biopunk.', 'biopunk, organic biotechnology, wet engineered surfaces, unsettling bio-mechanical detail'],
  ['solarpunk', 'Solarpunk', 'Solarpunk.', 'solarpunk, sustainable lush future, abundant greenery and clean energy, optimistic warm light'],
  ['dystopian-sci-fi', 'Dystopian Science Fiction', 'Dystopia.', 'dystopian science fiction, oppressive brutalist scale, muted grim palette, surveillance tension'],
  ['utopian-sci-fi', 'Utopian Science Fiction', 'Utopia.', 'utopian science fiction, serene ordered future, luminous clean architecture, hopeful atmosphere'],
  ['futuristic-architecture', 'Futuristic Architecture', 'Future architecture.', 'futuristic architecture focus, bold engineered forms, luminous surfaces, precise geometry'],
  ['robotic-civilizations', 'Robotic Civilizations', 'Robot civilizations.', 'robotic civilization, precise machined forms, synthetic materials, cool clinical light'],
  ['alien-worlds', 'Alien Worlds', 'Alien worlds.', 'alien world, unfamiliar biology and geology, otherworldly atmosphere, strange but coherent ecology'],
  ['planetary-exploration', 'Planetary Exploration', 'Planetary exploration.', 'planetary exploration, rugged survey terrain, harsh natural light, scientific equipment detail'],
  ['scientific-visualization', 'Scientific Visualization', 'Scientific viz.', 'scientific visualization, accurate data-driven phenomena, clean diagrammatic clarity, precise rendering'],
  ['speculative-technology', 'Speculative Technology', 'Speculative tech.', 'speculative technology, near-future prototypes, believable engineering detail, naturalistic light'],
  ['space-station-drama', 'Space-Station Drama', 'Space station.', 'space-station drama, confined industrial interiors, utilitarian lighting, claustrophobic scale'],
  ['interstellar-adventure', 'Interstellar Adventure', 'Interstellar.', 'interstellar adventure, vast cosmic distances, relativistic scale, dramatic celestial light'],
  ['futuristic-documentary', 'Futuristic Documentary', 'Future documentary.', 'futuristic documentary, observational tone, naturalistic lighting, credible future-world detail'],
  ['high-tech-industrial', 'High-Tech Industrial Cinematography', 'Industrial tech.', 'high-tech industrial cinematography, precision machinery, clean engineered surfaces, cool directional light'],
]);

const ADDITIONAL_VISUAL = build('additional-visual', [
  ['horror', 'Horror', 'Horror.', 'horror, oppressive shadow, unsettling framing, creeping dread, restrained reveal', 'bright cheerful lighting, lighthearted tone'],
  ['psychological-thriller', 'Psychological Thriller', 'Psychological thriller.', 'psychological thriller, tense restrained framing, unstable perspective, cold palette, mounting unease'],
  ['mystery', 'Mystery', 'Mystery.', 'mystery, withholding framing, deep shadow, muted palette, quiet investigative tension'],
  ['crime-drama', 'Crime Drama', 'Crime drama.', 'crime drama, gritty urban realism, low-key night light, tense naturalistic staging'],
  ['action', 'Action', 'Action.', 'action, dynamic camera energy, impactful choreography, sharp cutting rhythm, kinetic movement'],
  ['adventure', 'Adventure', 'Adventure.', 'adventure, sweeping locations, forward-driving movement, sunlit naturalistic light'],
  ['romance', 'Romance', 'Romance.', 'romance, soft warm light, intimate framing, gentle movement, tender atmosphere'],
  ['comedy', 'Comedy', 'Comedy.', 'comedy, bright even lighting, clear staging, expressive timing, warm inviting palette'],
  ['thriller', 'Thriller', 'Thriller.', 'thriller, escalating tension, tight framing, cool palette, controlled pacing'],
  ['family-drama', 'Family Drama', 'Family drama.', 'family drama, warm naturalistic light, intimate domestic framing, sincere restrained performance'],
  ['sports-drama', 'Sports Drama', 'Sports drama.', 'sports drama, focused athletic framing, motivating light, determined pacing'],
  ['educational-animation', 'Educational Animation', 'Educational.', 'educational animation, clear labelled visuals, uncluttered staging, friendly consistent design'],
  ['explainer-video', 'Explainer Video', 'Explainer.', 'explainer video, clean motion graphics, clear visual hierarchy, supportive typography, calm pacing'],
  ['corporate-film', 'Corporate Film', 'Corporate film.', 'corporate film, polished professional lighting, confident clean staging, restrained modern palette'],
  ['social-media-short', 'Social-Media Short', 'Social short.', 'social-media short, punchy opening hook, vertical-friendly framing, bold colour, fast pacing'],
  ['vertical-video', 'Vertical Video', 'Vertical format.', 'vertical 9:16 composition, subject centred for mobile, strong foreground interest, readable at small size'],
  ['cinematic-title-sequence', 'Cinematic Title Sequence', 'Title sequence.', 'cinematic title sequence, graphic title treatment, rhythmic reveal, atmospheric light, elegant motion'],
  ['abstract-motion-design', 'Abstract Motion Design', 'Abstract motion.', 'abstract motion design, non-representational shape and colour, precise easing, rhythmic composition'],
  ['minimalist-visual-storytelling', 'Minimalist Visual Storytelling', 'Minimal storytelling.', 'minimalist visual storytelling, reduced means, strong composition, generous negative space, quiet clarity'],
]);

export const VIDEO_STYLES: VideoStyle[] = [
  ...CINEMATIC_REALISTIC,
  ...ANIMATION,
  ...ILLUSTRATION_ARTISTIC,
  ...HISTORICAL_PERIOD,
  ...FANTASY_FICTIONAL,
  ...SCI_FI_FUTURISTIC,
  ...ADDITIONAL_VISUAL,
];

const STYLE_BY_ID = new Map(VIDEO_STYLES.map((s) => [s.id, s]));

export function getVideoStyleById(id: string | undefined): VideoStyle | undefined {
  return id ? STYLE_BY_ID.get(id) : undefined;
}

export function videoStyleCategoryLabel(id: VideoStyleCategoryId): string {
  return VIDEO_STYLE_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

/** Case-insensitive search across name, description and category label. */
export function searchVideoStyles(query: string): VideoStyle[] {
  const q = query.trim().toLowerCase();
  if (!q) return VIDEO_STYLES;
  return VIDEO_STYLES.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      videoStyleCategoryLabel(s.category).toLowerCase().includes(q)
  );
}

/**
 * ARTI AI — Images style library (single source of truth).
 *
 * A data-driven catalogue of reusable style definitions. Each definition
 * carries the human-readable copy plus the actual prompt guidance that is
 * appended to the user's prompt before it is sent to a real provider — so
 * selecting `Watercolor` contributes watercolor-specific visual guidance rather
 * than the bare word "Watercolor".
 *
 * Previews are honest CSS style swatches (a labelled style-preview
 * illustration), never a fabricated generated image. No third-party artwork is
 * embedded. Adding a style is a data change only; the Images UI is data-driven.
 */

export type StyleCategoryId =
  | 'photography'
  | 'fine-art'
  | 'digital-illustration'
  | 'anime-animation'
  | 'historical-vintage'
  | 'premium-luxury'
  | 'fantasy-worlds'
  | 'sci-fi-technology'
  | 'nature-environments'
  | 'graphic-design'
  | 'three-dimensional'
  | 'additional-creative';

export interface StyleCategory {
  id: StyleCategoryId;
  label: string;
  description: string;
}

export interface ImageStyle {
  id: string;
  name: string;
  category: StyleCategoryId;
  description: string;
  /** Positive prompt guidance appended to the user's prompt. */
  promptGuidance: string;
  /** Optional negative-prompt guidance for providers that accept one. */
  negativeGuidance?: string;
  /** Two-colour swatch used for the labelled style-preview tile. */
  swatch: [string, string];
}

export const STYLE_CATEGORIES: StyleCategory[] = [
  { id: 'photography', label: 'Photography & Realism', description: 'Camera-accurate and photographic treatments.' },
  { id: 'fine-art', label: 'Traditional & Fine Art', description: 'Painterly and drawing media.' },
  { id: 'digital-illustration', label: 'Digital Illustration', description: 'Illustrated, vector and 3D-illustration looks.' },
  { id: 'anime-animation', label: 'Anime & Animation', description: 'Anime, manga and animation-inspired aesthetics.' },
  { id: 'historical-vintage', label: 'Historical & Vintage', description: 'Period-accurate eras, film stocks and ageing.' },
  { id: 'premium-luxury', label: 'Premium & Luxury', description: 'Refined, editorial and luxury treatments.' },
  { id: 'fantasy-worlds', label: 'Fantasy & Imaginative', description: 'Invented worlds, myth and magic.' },
  { id: 'sci-fi-technology', label: 'Science Fiction & Technology', description: 'Futuristic, cyber and speculative tech.' },
  { id: 'nature-environments', label: 'Nature & Environments', description: 'Landscapes, flora, fauna and ecosystems.' },
  { id: 'graphic-design', label: 'Graphic Design & Commercial', description: 'Covers, posters, packaging and campaign art.' },
  { id: 'three-dimensional', label: '3D & Rendering', description: 'Rendered materials and 3D scenes.' },
  { id: 'additional-creative', label: 'Additional Creative Styles', description: 'Craft, collage and experimental media.' },
];

/** Compact seed: [id, name, description, positiveGuidance, negativeGuidance?]. */
type StyleSeed = [string, string, string, string, string?];

/** Deterministic, muted swatch pairs drawn from the ARTI palette family. */
const SWATCHES: Array<[string, string]> = [
  ['#1F2A44', '#C6A75E'],
  ['#1F2A44', '#1F2A44'],
  ['#C6A75E', '#C6A75E'],
  ['#1F2A44', '#E8DCC8'],
  ['#1F2A44', '#E8DCC8'],
  ['#1F2A44', '#C6A75E'],
  ['#1F2A44', '#E8DCC8'],
  ['#1F2A44', '#C6A75E'],
  ['#1F2A44', '#E8DCC8'],
  ['#1F2A44', '#C6A75E'],
];

function build(category: StyleCategoryId, seeds: StyleSeed[]): ImageStyle[] {
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

const PHOTOGRAPHY = build('photography', [
  ['photorealistic', 'Photorealistic', 'Lifelike camera-accurate imagery.', 'photorealistic, ultra-detailed, natural lighting, accurate materials and textures, sharp focus, true-to-life colours, professional camera capture'],
  ['hyperrealistic', 'Hyperrealistic', 'Exaggerated micro-detail realism.', 'hyperrealistic, extreme micro-detail, pore-level skin and surface texture, perfect lighting, 8k photographic realism'],
  ['cinematic-photography', 'Cinematic Photography', 'Filmic, dramatic framing.', 'cinematic photography, anamorphic lens, dramatic lighting, shallow depth of field, film colour grade, widescreen composition'],
  ['studio-photography', 'Studio Photography', 'Controlled studio lighting.', 'studio photography, controlled softbox lighting, seamless backdrop, even exposure, high-end commercial capture'],
  ['portrait-photography', 'Portrait Photography', 'Human-centred portrait capture.', 'portrait photography, 85mm lens, flattering soft light, sharp eyes, natural skin tones, shallow depth of field'],
  ['fashion-photography', 'Fashion Photography', 'Editorial fashion capture.', 'fashion photography, editorial styling, dramatic studio or location light, confident pose, high-fashion colour grade'],
  ['product-photography', 'Product Photography', 'Clean commercial product shots.', 'product photography, pristine studio lighting, clean seamless background, crisp reflections, commercial catalogue quality'],
  ['editorial-photography', 'Editorial Photography', 'Magazine-grade storytelling.', 'editorial photography, magazine-quality composition, natural storytelling light, considered negative space'],
  ['macro-photography', 'Macro Photography', 'Extreme close-up detail.', 'macro photography, extreme close-up, razor-thin depth of field, intricate surface detail, diffused ring light'],
  ['wildlife-photography', 'Wildlife Photography', 'Animals in their habitat.', 'wildlife photography, telephoto lens, natural habitat, authentic animal behaviour, golden-hour light, sharp subject isolation'],
  ['nature-photography', 'Nature Photography', 'Natural-world capture.', 'nature photography, natural light, authentic detail, balanced exposure, rich but truthful colour'],
  ['landscape-photography', 'Landscape Photography', 'Wide natural vistas.', 'landscape photography, wide-angle vista, layered depth, dramatic sky, long-exposure clarity, deep tonal range'],
  ['architecture-photography', 'Architecture Photography', 'Buildings and structures.', 'architecture photography, corrected perspective, crisp geometry, balanced daylight, strong lines and rhythm'],
  ['street-photography', 'Street Photography', 'Candid urban moments.', 'street photography, candid documentary framing, available light, real urban texture, decisive moment'],
  ['documentary-photography', 'Documentary Photography', 'Truthful reportage.', 'documentary photography, reportage realism, available light, honest unposed scene, natural colour'],
  ['travel-photography', 'Travel Photography', 'Place and journey.', 'travel photography, evocative sense of place, golden light, rich location detail, inviting composition'],
  ['food-photography', 'Food Photography', 'Appetising food capture.', 'food photography, styled presentation, soft directional light, fresh texture, shallow depth of field, appetising colour'],
  ['aerial-photography', 'Aerial Photography', 'Drone/airborne views.', 'aerial photography, elevated drone perspective, sweeping overview, crisp topographic detail, natural light'],
  ['night-photography', 'Night Photography', 'Low-light nocturnal scenes.', 'night photography, long exposure, city or star light, controlled highlights, deep shadows, rich blacks'],
  ['underwater-photography', 'Underwater Photography', 'Submerged capture.', 'underwater photography, filtered blue-green light, suspended particles, caustic highlights, submerged depth'],
]);

const FINE_ART = build('fine-art', [
  ['oil-painting', 'Oil Painting', 'Classical oil-on-canvas look.', 'oil painting, visible brushwork, rich layered glazes, canvas texture, classical chiaroscuro, fine-art gallery quality'],
  ['watercolor', 'Watercolor', 'Translucent watercolour washes.', 'watercolour painting, translucent washes, soft bleeding edges, visible paper texture, luminous white of the paper, delicate pigment granulation', 'harsh outlines, opaque flat fills, digital gloss'],
  ['acrylic-painting', 'Acrylic Painting', 'Bold acrylic-on-canvas.', 'acrylic painting, bold opaque strokes, matte canvas texture, confident colour blocking, expressive brush marks'],
  ['gouache', 'Gouache', 'Matte opaque gouache.', 'gouache painting, matte opaque pigment, flat velvety colour, subtle brush texture, illustrative clarity'],
  ['charcoal-drawing', 'Charcoal Drawing', 'Smudged monochrome charcoal.', 'charcoal drawing, smudged tonal shading, textured paper grain, expressive dark strokes, monochrome depth'],
  ['pencil-sketch', 'Pencil Sketch', 'Graphite line and shading.', 'pencil sketch, fine graphite hatching, cross-hatched shading, clean paper, delicate line weight'],
  ['ink-illustration', 'Ink Illustration', 'Inked linework and wash.', 'ink illustration, confident brush-pen linework, variable line weight, ink wash shading, strong silhouettes'],
  ['pen-and-ink', 'Pen and Ink Drawing', 'Fine pen hatching.', 'pen and ink drawing, precise hatching and stippling, high-contrast linework, engraving-like density'],
  ['pastel-art', 'Pastel Art', 'Soft chalky pastel.', 'pastel drawing, soft chalky texture, blended strokes, luminous pigment, velvety paper tooth'],
  ['classical-portraiture', 'Classical Portraiture', 'Old-master portrait style.', 'classical portraiture, old-master oil technique, formal pose, chiaroscuro lighting, dignified expression, museum varnish'],
  ['renaissance', 'Renaissance-Inspired Art', 'Renaissance painting language.', 'renaissance-inspired painting, balanced composition, sfumato softness, earthy tempera palette, classical drapery and anatomy'],
  ['baroque', 'Baroque-Inspired Art', 'Dramatic baroque light.', 'baroque-inspired painting, dramatic tenebrism, deep shadow and hot highlight, dynamic diagonal composition, ornate detail'],
  ['impressionist', 'Impressionist-Inspired Art', 'Broken-colour impressionism.', 'impressionist painting, broken colour, loose visible strokes, shimmering light, plein-air atmosphere'],
  ['expressionist', 'Expressionist Art', 'Distorted expressive colour.', 'expressionist painting, heightened emotional colour, distorted forms, energetic strokes, psychological intensity'],
  ['surrealist', 'Surrealist Art', 'Dreamlike illogic.', 'surrealist art, impossible juxtaposition, dreamlike logic, hyper-clear rendering of the uncanny, quiet unease'],
  ['abstract-art', 'Abstract Art', 'Non-representational form.', 'abstract art, non-representational forms, balanced colour fields, gestural marks, considered negative space'],
  ['fine-art-print', 'Fine-Art Print', 'Gallery print quality.', 'fine-art print, archival giclée quality, refined tonal range, subtle paper texture, gallery-presentation finish'],
  ['vintage-illustration', 'Vintage Illustration', 'Mid-century printed illustration.', 'vintage illustration, limited retro palette, printed halftone texture, charming linework, aged-paper warmth'],
]);

const DIGITAL_ILLUSTRATION = build('digital-illustration', [
  ['digital-painting', 'Digital Painting', 'Modern digital paint.', 'digital painting, painterly brushwork, rich blended colour, dramatic lighting, high production value'],
  ['concept-art', 'Concept Art', 'Production design art.', 'concept art, production design quality, clear silhouettes, atmospheric depth, functional world-building detail'],
  ['fantasy-illustration', 'Fantasy Illustration', 'Fantasy book/game art.', 'fantasy illustration, epic scale, ornate detail, dramatic lighting, vivid imaginative world-building'],
  ['sci-fi-illustration', 'Science-Fiction Illustration', 'Sci-fi book/game art.', 'science-fiction illustration, credible speculative technology, scale and atmosphere, crisp design language'],
  ['editorial-illustration', 'Editorial Illustration', 'Conceptual editorial art.', 'editorial illustration, conceptual metaphor, confident colour, strong focal point, magazine cover energy'],
  ['storybook-illustration', 'Storybook Illustration', 'Warm narrative illustration.', 'storybook illustration, warm hand-drawn charm, soft palette, gentle narrative detail, inviting composition'],
  ['childrens-illustration', "Children's Illustration", 'Playful children’s book art.', 'children\u2019s book illustration, playful rounded shapes, cheerful palette, simple clear forms, friendly characters'],
  ['comic-book-art', 'Comic-Book Art', 'Inked comic panels.', 'comic-book art, bold ink linework, dynamic poses, flat vivid colour, halftone shading, panel-ready composition'],
  ['graphic-novel-art', 'Graphic Novel Art', 'Painterly graphic novel.', 'graphic novel art, muted sophisticated palette, painterly ink and wash, cinematic panel composition'],
  ['cel-shaded', 'Cel-Shaded Illustration', 'Flat anime-style shading.', 'cel-shaded illustration, flat colour blocking, crisp ink outlines, hard-edged shadows, animation-ready'],
  ['vector-illustration', 'Vector Illustration', 'Clean vector shapes.', 'vector illustration, clean geometric shapes, flat colour, crisp edges, scalable graphic clarity'],
  ['isometric-illustration', 'Isometric Illustration', 'Isometric scene art.', 'isometric illustration, precise 30-degree projection, tidy geometry, soft ambient occlusion, charming miniature detail'],
  ['low-poly-art', 'Low-Poly Art', 'Faceted polygonal art.', 'low-poly art, faceted triangular surfaces, minimal polygons, flat-shaded facets, stylised colour'],
  ['pixel-art', 'Pixel Art', 'Pixel-perfect sprite art.', 'pixel art, limited palette, crisp pixel-perfect edges, readable silhouette, retro sprite charm'],
  ['minimalist-illustration', 'Minimalist Illustration', 'Reduced essential forms.', 'minimalist illustration, reduced essential forms, generous negative space, restrained palette, quiet elegance'],
  ['flat-illustration', 'Flat Illustration', 'Flat modern graphics.', 'flat illustration, no gradients, bold flat colour, simple geometric shapes, modern editorial clarity'],
  ['3d-illustration', '3D Illustration', 'Rendered illustration look.', '3D illustration, soft global illumination, smooth materials, playful proportions, polished render finish'],
]);

const ANIME_ANIMATION = build('anime-animation', [
  ['anime-illustration', 'Anime-Inspired Illustration', 'Modern anime illustration.', 'anime illustration, clean linework, expressive eyes, cel shading, vibrant but balanced colour'],
  ['manga-art', 'Manga-Inspired Art', 'Monochrome manga art.', 'manga art, high-contrast screentone shading, dynamic ink lines, expressive emotion, panel-ready composition'],
  ['chibi', 'Chibi Illustration', 'Cute chibi proportions.', 'chibi illustration, oversized head and small body, cute simplified features, soft pastel palette, playful pose'],
  ['retro-anime', 'Retro Anime Aesthetic', '80s/90s anime look.', 'retro anime aesthetic, cel animation look, film grain, slightly desaturated palette, vintage TV glow'],
  ['hand-drawn-animation', 'Hand-Drawn Animation Aesthetic', 'Classic animation cels.', 'hand-drawn animation aesthetic, painted cel backgrounds, clean character lines, watercolour background wash'],
  ['soft-storybook-animation', 'Soft Storybook Animation Aesthetic', 'Gentle animated-story look.', 'soft storybook animation aesthetic, pastel palette, rounded gentle shapes, warm diffused light, cosy mood'],
  ['fantasy-animation', 'Fantasy Animation Aesthetic', 'Animated fantasy feature look.', 'fantasy animation aesthetic, rich painted backgrounds, glowing magic light, stylised characters, epic atmosphere'],
  ['stylized-character', 'Stylized Character Illustration', 'Character-design illustration.', 'stylised character illustration, strong shape language, expressive pose, clean rendering, appealing silhouette'],
  ['super-deformed', 'Super-Deformed Character Art', 'Exaggerated SD proportions.', 'super-deformed character art, exaggerated proportions, cute expressive face, bold outlines, dynamic chibi action'],
  ['anime-background-painting', 'Anime Background Painting', 'Detailed anime scenery.', 'anime background painting, highly detailed scenery, soft natural light, painterly clouds and foliage, Makoto-Shinkai-like clarity'],
]);

const HISTORICAL_VINTAGE = build('historical-vintage', [
  ['1920s', '1920s-Inspired Imagery', 'Art-deco jazz-age look.', '1920s-inspired imagery, art-deco geometry, sepia-and-gold palette, jazz-age styling, period-accurate props'],
  ['1930s-vintage-photography', '1930s Vintage Photography', 'Depression-era capture.', '1930s vintage photography, soft-focus period lens, monochrome or muted sepia, period clothing and texture'],
  ['1940s-historical', '1940s Historical Aesthetic', 'Wartime-era look.', '1940s historical aesthetic, period-accurate styling, muted earthy palette, documentary realism, film grain'],
  ['1950s-retro', '1950s Retro Aesthetic', 'Post-war retro.', '1950s retro aesthetic, pastel palette, chrome and diner styling, optimistic period lighting'],
  ['1960s-retro', '1960s Retro Aesthetic', 'Sixties pop-retro.', '1960s retro aesthetic, bold mod colour, geometric patterns, period typography energy'],
  ['1970s-film', '1970s Film Aesthetic', 'Seventies film stock.', '1970s film aesthetic, warm faded palette, heavy grain, soft contrast, period styling'],
  ['1980s-retro', '1980s Retro Aesthetic', 'Eighties retro.', '1980s retro aesthetic, vivid saturated palette, neon accents, chrome and grid motifs, VHS softness'],
  ['1990s-photography', '1990s Photography Aesthetic', 'Nineties snapshot look.', '1990s photography aesthetic, point-and-shoot softness, slightly washed colour, date-stamp vibe, casual framing'],
  ['vintage-film-grain', 'Vintage Film Grain', 'Aged film emulsion.', 'vintage film grain, visible emulsion grain, halation, faded contrast, warm aged colour shift, dust and scratches'],
  ['sepia-photography', 'Sepia Photography', 'Warm sepia tone.', 'sepia photography, warm brown monochrome toning, soft period contrast, aged-paper feel'],
  ['antique-illustration', 'Antique Illustration', 'Engraved antique plate.', 'antique illustration, engraved linework, aged-paper tone, hand-tinted colour, aged print texture'],
  ['classical-european', 'Classical European Aesthetic', 'Old-European refinement.', 'classical European aesthetic, ornate period detail, muted heritage palette, formal balanced composition'],
  ['historical-documentary', 'Historical Documentary Aesthetic', 'Archive-documentary look.', 'historical documentary aesthetic, archive-footage realism, desaturated palette, subtle grain, period authenticity'],
]);

const PREMIUM_LUXURY = build('premium-luxury', [
  ['royal-regal', 'Royal & Regal', 'Regal opulent styling.', 'royal regal aesthetic, opulent detail, deep jewel tones with gold, ornate framing, majestic lighting'],
  ['classic-luxury', 'Classic Luxury', 'Timeless luxury styling.', 'classic luxury aesthetic, refined materials, restrained palette, elegant lighting, impeccable finish'],
  ['premium-editorial', 'Premium Editorial', 'High-end editorial.', 'premium editorial styling, sophisticated art direction, confident negative space, refined colour grade'],
  ['elegant-minimalism', 'Elegant Minimalism', 'Quiet minimal luxury.', 'elegant minimalism, sparse composition, soft neutral palette, precise lighting, calm luxury'],
  ['luxury-product-photography', 'Luxury Product Photography', 'Luxury product shots.', 'luxury product photography, dramatic controlled lighting, reflective premium surfaces, immaculate studio finish'],
  ['gold-and-black', 'Gold-and-Black Aesthetic', 'Gold on black opulence.', 'gold-and-black aesthetic, deep black grounds, polished gold accents, dramatic specular light, opulent contrast'],
  ['museum-quality-fine-art', 'Museum-Quality Fine Art', 'Museum-grade artwork.', 'museum-quality fine art, masterful technique, archival finish, considered composition, gallery presence'],
  ['architectural-luxury', 'Architectural Luxury', 'Luxury architecture.', 'architectural luxury, refined materials, elegant geometry, sophisticated daylight, premium interior detailing'],
  ['high-end-fashion-editorial', 'High-End Fashion Editorial', 'Vogue-grade fashion.', 'high-end fashion editorial, couture styling, dramatic studio light, confident attitude, refined colour grade'],
  ['cinematic-luxury', 'Cinematic Luxury', 'Luxury film look.', 'cinematic luxury, anamorphic highlights, rich shadow detail, sumptuous colour grade, prestige-film atmosphere'],
]);

const FANTASY_WORLDS = build('fantasy-worlds', [
  ['high-fantasy', 'High Fantasy', 'Grand high-fantasy art.', 'high fantasy art, epic sweeping scale, ornate armour and architecture, glowing magic, heroic lighting'],
  ['dark-fantasy', 'Dark Fantasy', 'Grim dark fantasy.', 'dark fantasy art, brooding atmosphere, gothic detail, cold desaturated palette with embers, ominous lighting'],
  ['mythological-illustration', 'Mythological Illustration', 'Myth and legend.', 'mythological illustration, legendary figures, classical symbolic detail, dramatic divine light, timeless scale'],
  ['magical-realism', 'Magical Realism', 'Magic within the real.', 'magical realism, ordinary setting with one quiet impossible element, natural light, subtle surreal detail'],
  ['fairytale-worlds', 'Fairytale Worlds', 'Enchanted fairytale.', 'fairytale world, enchanted forest detail, soft magical glow, storybook charm, whimsical atmosphere'],
  ['epic-fantasy-landscapes', 'Epic Fantasy Landscapes', 'Sweeping fantasy vistas.', 'epic fantasy landscape, vast scale, dramatic mountain and sky, layered atmospheric depth, cinematic wonder'],
  ['myth-inspired-environments', 'Myth-Inspired Environments', 'Mythic locales.', 'myth-inspired environment, ancient monumental ruins, mythic symbolism, dramatic god-rays, timeless mood'],
  ['ancient-kingdom', 'Ancient Kingdom Aesthetic', 'Ancient realm styling.', 'ancient kingdom aesthetic, weathered stone and gold, historic grandeur, warm torchlit atmosphere'],
  ['gothic-illustration', 'Gothic Illustration', 'Gothic romantic dread.', 'gothic illustration, pointed arches and shadow, romantic melancholy, deep violet and bone palette, ornate detail'],
  ['dreamlike-surrealism', 'Dreamlike Surrealism', 'Soft surreal dreamscape.', 'dreamlike surrealism, floating impossible elements, soft diffused light, quiet uncanny beauty'],
  ['cosmic-fantasy', 'Cosmic Fantasy', 'Cosmic-scale fantasy.', 'cosmic fantasy, celestial scale, nebulae and starlight, glowing arcane energy, awe-inspiring depth'],
  ['futuristic-utopia', 'Futuristic Utopia', 'Idealised future world.', 'futuristic utopia, clean luminous architecture, abundant greenery, optimistic daylight, serene advanced technology'],
]);

const SCI_FI_TECHNOLOGY = build('sci-fi-technology', [
  ['futuristic-city', 'Futuristic City', 'Future metropolis.', 'futuristic city, layered vertical architecture, luminous signage, aerial traffic, dusk atmosphere'],
  ['cyberpunk', 'Cyberpunk-Inspired Imagery', 'Cyberpunk neon noir.', 'cyberpunk imagery, dense neon signage, rain-slick streets, high-tech low-life detail, magenta-and-cyan night'],
  ['solarpunk', 'Solarpunk', 'Optimistic green future.', 'solarpunk aesthetic, lush integrated greenery, solar technology, warm daylight, hopeful sustainable design'],
  ['space-exploration', 'Space Exploration', 'Spaceflight scenes.', 'space exploration imagery, credible spacecraft, hard vacuum lighting, planetary scale, awe and isolation'],
  ['planetary-landscapes', 'Planetary Landscapes', 'Alien world terrain.', 'planetary landscape, alien geology, atmospheric haze, distant star or moon, otherworldly colour'],
  ['futuristic-architecture', 'Futuristic Architecture', 'Future-built environments.', 'futuristic architecture, bold parametric geometry, glass and light, clean lines, monumental scale'],
  ['sci-fi-concept-art', 'Sci-Fi Concept Art', 'Sci-fi design art.', 'science-fiction concept art, functional design language, clear silhouette, atmospheric scale, production-ready detail'],
  ['robotics-concept-art', 'Robotics Concept Art', 'Robot design art.', 'robotics concept art, mechanical articulation detail, engineered surfaces, functional joints, industrial finish'],
  ['advanced-technology', 'Advanced Technology Illustration', 'Tech visualisation.', 'advanced technology illustration, precise technical detail, clean interface light, futuristic engineering surfaces'],
  ['industrial-design-visualization', 'Industrial Design Visualization', 'Product/industrial design.', 'industrial design visualisation, engineered form language, functional detail, studio lighting, material honesty'],
  ['holographic-interface', 'Holographic-Interface Concept Art', 'Holographic UI scenes.', 'holographic-interface concept art, translucent volumetric UI panels, glowing data, cool ambient light'],
  ['speculative-technology', 'Speculative Technology Environments', 'Speculative tech worlds.', 'speculative technology environment, plausible near-future infrastructure, moody scale, documentary realism'],
]);

const NATURE_ENVIRONMENTS = build('nature-environments', [
  ['mountain-landscapes', 'Mountain Landscapes', 'Mountain vistas.', 'mountain landscape, dramatic peaks, layered ridges, alpine light, deep atmospheric perspective'],
  ['forest-landscapes', 'Forest Landscapes', 'Woodland scenes.', 'forest landscape, layered canopy, dappled light, mossy detail, quiet depth'],
  ['ocean-coastal', 'Ocean & Coastal Scenes', 'Sea and shore.', 'ocean and coastal scene, breaking waves, coastal light, spray and texture, expansive horizon'],
  ['waterfalls', 'Waterfalls', 'Cascading water.', 'waterfall scene, cascading water, mist and spray, mossy rock, soft diffused light'],
  ['deserts', 'Deserts', 'Arid desert terrain.', 'desert landscape, sculpted dunes, harsh light and shadow, minimal palette, vast emptiness'],
  ['snow-landscapes', 'Snow Landscapes', 'Snow and ice.', 'snow landscape, pristine snow, cool blue shadows, crisp winter light, serene stillness'],
  ['sunrise-sunset', 'Sunrise & Sunset', 'Golden-hour skies.', 'sunrise or sunset scene, warm golden light, long shadows, luminous sky, romantic atmosphere'],
  ['misty-forests', 'Misty Forests', 'Fog-filled woods.', 'misty forest, layered fog, soft diffused light, silhouetted trunks, quiet mystery'],
  ['tropical-environments', 'Tropical Environments', 'Tropical locales.', 'tropical environment, lush foliage, vivid warm light, turquoise water, humid atmosphere'],
  ['botanical-illustration', 'Botanical Illustration', 'Scientific plant art.', 'botanical illustration, precise plant anatomy, clean composition, delicate line and wash, scientific clarity'],
  ['floral-photography', 'Floral Photography', 'Flower capture.', 'floral photography, soft natural light, delicate petal detail, shallow depth of field, elegant colour'],
  ['macro-nature-photography', 'Macro Nature Photography', 'Close-up nature detail.', 'macro nature photography, extreme close-up, dew and texture, diffused light, intimate detail'],
  ['wildlife-illustration', 'Wildlife Illustration', 'Illustrated animals.', 'wildlife illustration, accurate animal anatomy, dynamic pose, natural habitat, expressive detail'],
  ['aerial-landscapes', 'Aerial Landscapes', 'Airborne vistas.', 'aerial landscape, elevated perspective, sweeping patterns, topographic detail, natural light'],
  ['underwater-ecosystems', 'Underwater Ecosystems', 'Reef and marine life.', 'underwater ecosystem, filtered blue-green light, coral and marine life, caustic highlights, submerged depth'],
]);

const GRAPHIC_DESIGN = build('graphic-design', [
  ['poster-art', 'Poster Art', 'Graphic poster design.', 'poster art, bold graphic hierarchy, striking focal image, strong negative space, print-ready composition'],
  ['editorial-cover', 'Editorial Cover', 'Magazine cover art.', 'editorial cover art, confident single image, considered type space, magazine-grade art direction'],
  ['album-cover-art', 'Album-Cover Art', 'Music cover art.', 'album cover art, iconic single image, bold graphic concept, memorable colour, square composition'],
  ['book-cover-art', 'Book-Cover Art', 'Book cover design.', 'book cover art, evocative central image, atmospheric mood, clear title space, shelf-standing design'],
  ['brand-campaign', 'Brand Campaign Imagery', 'Campaign visuals.', 'brand campaign imagery, cohesive art direction, premium styling, clear message, confident colour'],
  ['advertising-concept-art', 'Advertising Concept Art', 'Advertising concept.', 'advertising concept art, witty visual idea, strong focal point, commercial polish, clear hierarchy'],
  ['infographic-illustration', 'Infographic Illustration', 'Information graphics.', 'infographic illustration, clear visual hierarchy, tidy iconography, restrained palette, legible structure'],
  ['presentation-visuals', 'Presentation Visuals', 'Deck visuals.', 'presentation visual, clean uncluttered composition, generous space for text, modern professional palette'],
  ['social-media-artwork', 'Social-Media Artwork', 'Social graphics.', 'social media artwork, bold scroll-stopping focal point, mobile-legible composition, vibrant but tasteful colour'],
  ['thumbnail-artwork', 'Thumbnail Artwork', 'Thumbnail graphics.', 'thumbnail artwork, high-contrast focal subject, punchy colour, readable at small size, clear silhouette'],
  ['packaging-design', 'Packaging Design', 'Product packaging.', 'packaging design, considered label hierarchy, premium material finish, clean graphic system, shelf appeal'],
  ['logo-concept-imagery', 'Logo-Concept Imagery', 'Logo concept art.', 'logo concept imagery, simple memorable mark, strong silhouette, geometric clarity, scalable design'],
  ['minimal-geometric-design', 'Minimal Geometric Design', 'Geometric abstraction.', 'minimal geometric design, precise shapes, balanced colour fields, disciplined grid, clean edges'],
  ['typography-focused-composition', 'Typography-Focused Composition', 'Type-led composition.', 'typography-focused composition, expressive type as the hero, strong hierarchy, considered spacing, graphic balance'],
]);

const THREE_DIMENSIONAL = build('three-dimensional', [
  ['photorealistic-3d-render', 'Photorealistic 3D Render', 'Photoreal CGI.', 'photorealistic 3D render, physically based materials, accurate global illumination, ray-traced reflections, studio-quality CGI'],
  ['stylized-3d-render', 'Stylized 3D Render', 'Stylised CGI.', 'stylised 3D render, appealing simplified forms, soft global illumination, polished shading, characterful proportions'],
  ['product-render', 'Product Render', 'Product CGI.', 'product 3D render, pristine studio lighting, accurate material response, clean backdrop, catalogue-quality CGI'],
  ['architectural-render', 'Architectural Render', 'Architectural CGI.', 'architectural 3D render, accurate daylight simulation, realistic materials, clean geometry, professional visualisation'],
  ['clay-render', 'Clay Render', 'Unpainted clay CGI.', 'clay render, matte uniform grey material, soft ambient occlusion, sculptural form, no textures'],
  ['metallic-material-render', 'Metallic Material Render', 'Metal material study.', 'metallic material render, accurate brushed and polished metal, HDRI reflections, sharp specular highlights, material study'],
  ['isometric-3d-scene', 'Isometric 3D Scene', 'Isometric CGI scene.', 'isometric 3D scene, precise orthographic projection, tidy geometry, soft shadows, charming miniature detail'],
  ['low-poly-3d', 'Low-Poly 3D', 'Faceted low-poly CGI.', 'low-poly 3D render, faceted surfaces, flat shading, minimal polygons, stylised colour palette'],
  ['realistic-material-studies', 'Realistic Material Studies', 'Material reference CGI.', 'realistic material study, physically accurate surfaces, wood, stone, fabric and metal, neutral studio light'],
  ['game-environment-render', 'Game-Environment Render', 'Game level render.', 'game environment render, real-time-quality lighting, modular architecture, atmospheric depth, engine-ready detail'],
  ['character-render', 'Character Render', 'Character CGI.', 'character 3D render, appealing anatomy, subsurface skin shading, detailed costume materials, dynamic lighting'],
  ['industrial-design-render', 'Industrial-Design Render', 'Industrial CGI.', 'industrial design render, engineered form, accurate materials, functional detail, professional studio lighting'],
]);

const ADDITIONAL_CREATIVE = build('additional-creative', [
  ['paper-collage', 'Paper Collage', 'Torn-paper collage.', 'paper collage, torn and cut paper edges, layered texture, visible paper grain, mixed print fragments'],
  ['cut-paper-art', 'Cut-Paper Art', 'Layered cut-paper.', 'cut-paper art, crisp layered silhouettes, subtle drop shadows, bold colour, dimensional depth'],
  ['origami', 'Origami-Inspired Art', 'Folded-paper forms.', 'origami-inspired art, crisp folded geometry, paper crease detail, minimal palette, sculptural forms'],
  ['embroidery', 'Embroidery-Inspired Illustration', 'Stitched thread art.', 'embroidery-inspired illustration, visible stitched thread texture, fabric ground, folk-art warmth, layered thread colour'],
  ['textile-inspired', 'Textile-Inspired Art', 'Woven textile patterns.', 'textile-inspired art, woven pattern detail, fabric texture, rich thread colour, crafted surface'],
  ['stained-glass', 'Stained-Glass-Inspired Art', 'Leaded glass panels.', 'stained-glass-inspired art, bold leaded outlines, luminous coloured glass, backlit glow, geometric divisions'],
  ['mosaic-art', 'Mosaic Art', 'Tiled mosaic.', 'mosaic art, small tessera tiles, grout lines, shimmering varied colour, assembled texture'],
  ['clay-sculpture', 'Clay Sculpture Aesthetic', 'Modelled clay forms.', 'clay sculpture aesthetic, modelled clay surface, thumbprint texture, matte finish, sculptural form'],
  ['chalkboard-illustration', 'Chalkboard Illustration', 'Chalk-on-board art.', 'chalkboard illustration, chalky white linework, dusty blackboard texture, hand-drawn character, smudged shading'],
  ['blueprint-illustration', 'Blueprint Illustration', 'Technical blueprint.', 'blueprint illustration, white technical linework on deep blue, precise dimensions and annotation, drafting clarity'],
  ['technical-line-drawing', 'Technical Line Drawing', 'Precise technical drawing.', 'technical line drawing, precise uniform linework, measured proportions, clean white ground, engineering clarity'],
  ['handcrafted-illustration', 'Handcrafted Illustration', 'Artisanal hand-made look.', 'handcrafted illustration, visible hand-made texture, imperfect charming lines, natural materials, artisanal warmth'],
  ['dream-journal', 'Dream-Journal Aesthetic', 'Sketchbook dream journal.', 'dream journal aesthetic, sketchbook page texture, loose pencil and ink marks, marginalia, intimate uncanny mood'],
  ['experimental-mixed-media', 'Experimental Mixed Media', 'Mixed-media experiment.', 'experimental mixed media, combined paint, print and collage, layered process marks, adventurous texture'],
]);

export const IMAGE_STYLES: ImageStyle[] = [
  ...PHOTOGRAPHY,
  ...FINE_ART,
  ...DIGITAL_ILLUSTRATION,
  ...ANIME_ANIMATION,
  ...HISTORICAL_VINTAGE,
  ...PREMIUM_LUXURY,
  ...FANTASY_WORLDS,
  ...SCI_FI_TECHNOLOGY,
  ...NATURE_ENVIRONMENTS,
  ...GRAPHIC_DESIGN,
  ...THREE_DIMENSIONAL,
  ...ADDITIONAL_CREATIVE,
];

const STYLE_BY_ID = new Map(IMAGE_STYLES.map((s) => [s.id, s]));

export function getStyleById(id: string | undefined): ImageStyle | undefined {
  return id ? STYLE_BY_ID.get(id) : undefined;
}

export function categoryLabel(id: StyleCategoryId): string {
  return STYLE_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

/** Case-insensitive search across name, description and category label. */
export function searchStyles(query: string): ImageStyle[] {
  const q = query.trim().toLowerCase();
  if (!q) return IMAGE_STYLES;
  return IMAGE_STYLES.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      categoryLabel(s.category).toLowerCase().includes(q)
  );
}

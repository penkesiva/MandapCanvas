/**
 * AI wedding invitation maker.
 *
 * The model paints the ARTWORK only. The words (names, date, venue) are typeset on top in real fonts
 * by lib/cardRender.ts, because image models misspell text. That also makes text edits free.
 * Safe to import on the client.
 */

export type CardEvent = "wedding" | "save_the_date" | "engagement" | "haldi" | "mehndi" | "sangeet" | "reception";
export type CardFormat = "card" | "story";
/** Where the text goes; the artwork keeps that area calm and empty. */
export type TextArea = "center" | "lower" | "upper";

export const CARD_EVENTS: { id: CardEvent; name: string; art: string }[] = [
  { id: "wedding", name: "Wedding", art: "an Indian wedding" },
  { id: "save_the_date", name: "Save the date", art: "an Indian wedding save-the-date" },
  { id: "engagement", name: "Engagement", art: "an Indian engagement (sagai / ring ceremony)" },
  { id: "haldi", name: "Haldi", art: "a Haldi ceremony, bright turmeric yellow and marigold" },
  { id: "mehndi", name: "Mehndi", art: "a Mehndi night with henna patterns, green and pink" },
  { id: "sangeet", name: "Sangeet", art: "a Sangeet music and dance night with dhol and string lights" },
  { id: "reception", name: "Reception", art: "an elegant wedding reception evening" },
];

export interface CardTemplate {
  id: string;
  name: string;
  group: "Traditional" | "Modern" | "Fun";
  hint: string;
  /** The art direction sent to the model. */
  art: string;
  /** True when the art shows an illustrated couple. */
  couple: boolean;
  area: TextArea;
  /** Fonts: names, and everything else. */
  display: string;
  body: string;
  ink: string;
  accent: string;
  /** Panel behind the text so it stays readable on any artwork. */
  panel: { fill: string; stroke?: string; radius: number } | null;
  /** Placeholder colors for the gallery before a sample exists. */
  swatch: [string, string, string];
  /** Keyword ideas for the "make it yours" field, matched to the style. */
  ideas: string[];
}

/** A finished invitation saved for sharing at /c/[id]. */
export interface SharedCard {
  url: string;
  template: string;
  at: number;
}

export const CARD_TEMPLATES: CardTemplate[] = [
  {
    id: "royal",
    name: "Royal Rajasthani",
    group: "Traditional",
    hint: "Palace arch, maroon and gold",
    art: "a royal Rajasthani palace jharokha arch framing the card, deep maroon and antique gold, intricate gold filigree borders, hanging marigold and rose garlands, small brass diyas at the base, rich and regal, flat illustrated print style with gold-foil feel",
    couple: false,
    area: "center",
    display: "Cinzel",
    body: "Cormorant Garamond",
    ink: "#4A0D1A",
    accent: "#9A6B1F",
    panel: { fill: "rgba(255,248,236,0.9)", stroke: "#C9A24B", radius: 18 },
    swatch: ["#6D1A36", "#C9A24B", "#FFF3E0"],
    ideas: ["peacocks", "elephants", "palace arches", "lotus pond"],
  },
  {
    id: "marigold",
    name: "Marigold & mango leaves",
    group: "Traditional",
    hint: "Toran, banana leaves, brass lamps",
    art: "a South Indian temple-wedding border: a toran of mango leaves and marigold strings across the top, banana leaves and tall brass kuthu vilakku lamps on both sides, a rangoli kolam pattern at the bottom, warm cream background, vibrant and auspicious, painted illustration",
    couple: false,
    area: "center",
    display: "Yatra One",
    body: "Cormorant Garamond",
    ink: "#5A1A0C",
    accent: "#B5560F",
    panel: { fill: "rgba(255,250,238,0.88)", stroke: "#E3A21A", radius: 20 },
    swatch: ["#E3A21A", "#2F6B2A", "#FFF6E0"],
    ideas: ["marigold garlands", "brass diyas", "mango leaves", "rangoli"],
  },
  {
    id: "ganesha",
    name: "Shubh Vivah",
    group: "Traditional",
    hint: "Ganesha emblem, red and gold",
    art: "a traditional Hindu wedding card: a graceful, respectful gold line-art Lord Ganesha emblem at the top center, a rich red background with fine gold paisley and kalash motifs along the borders, symmetric and auspicious",
    couple: false,
    area: "lower",
    display: "Yatra One",
    body: "Cormorant Garamond",
    ink: "#FFF1D6",
    accent: "#F2C66D",
    panel: { fill: "rgba(120,10,20,0.55)", stroke: "#E2B657", radius: 16 },
    swatch: ["#A3131B", "#E2B657", "#7A0E14"],
    ideas: ["lotus flowers", "diyas", "kalash", "temple bells"],
  },
  {
    id: "mughal",
    name: "Mughal garden",
    group: "Traditional",
    hint: "Emerald, jaali arches, roses",
    art: "a Mughal garden: carved white marble jaali arches, deep emerald green and gold, climbing roses and cypress trees, a reflecting pool at the bottom, elegant and romantic miniature-painting style, suitable for a Nikah or a Hindu wedding",
    couple: false,
    area: "center",
    display: "Great Vibes",
    body: "Cormorant Garamond",
    ink: "#0D3B2C",
    accent: "#9A7A2A",
    panel: { fill: "rgba(250,247,238,0.9)", stroke: "#B8963E", radius: 140 },
    swatch: ["#0F4D36", "#C9A24B", "#F6F1E4"],
    ideas: ["domes and minarets", "roses", "lanterns", "crescent moon"],
  },
  {
    id: "minimal",
    name: "Modern minimal",
    group: "Modern",
    hint: "Ivory paper, fine gold line art",
    art: "a modern minimalist luxury invitation: textured ivory cotton paper, a single delicate gold line-art mandap outline and a few fine line-art marigold sprigs in the corners, generous empty space, refined and quiet",
    couple: false,
    area: "center",
    display: "Playfair Display",
    body: "Cormorant Garamond",
    ink: "#2C2420",
    accent: "#A57D3B",
    panel: null,
    swatch: ["#F7F2E8", "#A57D3B", "#2C2420"],
    ideas: ["olive branch", "a single lotus", "our initials", "gold line art"],
  },
  {
    id: "watercolor",
    name: "Watercolor florals",
    group: "Modern",
    hint: "Blush peonies, soft greens",
    art: "soft watercolor florals: blush pink peonies, garden roses, marigolds and eucalyptus painted loosely in the top and bottom corners on white watercolor paper, airy pastel palette, delicate and romantic",
    couple: false,
    area: "center",
    display: "Great Vibes",
    body: "Cormorant Garamond",
    ink: "#5B3440",
    accent: "#B5677A",
    panel: null,
    swatch: ["#F4C6CF", "#9DB89A", "#FFFFFF"],
    ideas: ["peonies", "our city skyline", "hummingbirds", "eucalyptus"],
  },
  {
    id: "boho",
    name: "Boho terracotta",
    group: "Modern",
    hint: "Arches, pampas, warm sun",
    art: "a boho terracotta design: layered arches in terracotta, sand and blush, dried pampas grass and palm leaves, a minimal sun shape, soft paper texture, warm modern Desi boho aesthetic",
    couple: false,
    area: "center",
    display: "Playfair Display",
    body: "Cormorant Garamond",
    ink: "#5A2E1E",
    accent: "#B5603A",
    panel: { fill: "rgba(250,240,228,0.82)", radius: 200 },
    swatch: ["#C96B45", "#E8CFB2", "#F7EEE3"],
    ideas: ["pampas grass", "desert sunset", "our dog", "string lights"],
  },
  {
    id: "anime",
    name: "Anime love story",
    group: "Fun",
    hint: "Hand-painted anime couple",
    art: "a soft, hand-painted Japanese anime film style illustration: a young Indian bride and groom in wedding attire holding hands under a sky at golden hour, paper lanterns, falling flower petals, dreamy clouds, warm cinematic light",
    couple: true,
    area: "upper",
    display: "M PLUS Rounded 1c",
    body: "M PLUS Rounded 1c",
    ink: "#3B2A4A",
    accent: "#C2477A",
    panel: { fill: "rgba(255,255,255,0.78)", radius: 22 },
    swatch: ["#F7B6C8", "#8EC5FF", "#FFF4E6"],
    ideas: ["cherry blossoms", "a scooter ride", "our cat", "city lights at night"],
  },
  {
    id: "animated3d",
    name: "3D animated",
    group: "Fun",
    hint: "Cute animated-movie couple",
    art: "a charming 3D animated-movie style render: a cute Indian bride and groom with big expressive eyes and warm smiles in festive wedding outfits, standing under a flower-decked mandap, soft global illumination, vibrant and joyful, family-film look (original characters)",
    couple: true,
    area: "upper",
    display: "Fredoka",
    body: "Fredoka",
    ink: "#3A1F2B",
    accent: "#D2405F",
    panel: { fill: "rgba(255,255,255,0.82)", radius: 26 },
    swatch: ["#FFB347", "#E8506E", "#FFF2DD"],
    ideas: ["our dog", "hot air balloons", "fireworks", "a vintage car"],
  },
  {
    id: "genz",
    name: "Gen Z Y2K",
    group: "Fun",
    hint: "Chrome hearts, sparkles, holo",
    art: "a Gen Z Y2K aesthetic: holographic pastel gradient background, glossy chrome hearts, sparkles and stars, playful stickers of marigolds, a disco ball and a tiny mandap, bold and fun, glossy 3D graphics",
    couple: false,
    area: "center",
    display: "Unbounded",
    body: "Unbounded",
    ink: "#2B1650",
    accent: "#E0388B",
    panel: { fill: "rgba(255,255,255,0.7)", stroke: "rgba(255,255,255,0.95)", radius: 28 },
    swatch: ["#C9B6FF", "#FF9AD5", "#9EF0FF"],
    ideas: ["disco ball", "boba tea", "our playlist", "sparkles"],
  },
  {
    id: "bollywood",
    name: "Retro Bollywood poster",
    group: "Fun",
    hint: "70s hand-painted film poster",
    art: "a 1970s hand-painted Bollywood movie poster: a dramatic, glamorous Indian bride and groom as film stars, bold painted brush strokes, saturated reds, oranges and teal, sun-burst rays behind them, vintage paper grain",
    couple: true,
    area: "lower",
    display: "Bungee",
    body: "Cormorant Garamond",
    ink: "#FFF2D6",
    accent: "#FFD15C",
    panel: { fill: "rgba(40,10,10,0.62)", radius: 10 },
    swatch: ["#D7261E", "#F59E1B", "#1E6E6E"],
    ideas: ["film reel", "a vintage car", "dancing in the rain", "marquee lights"],
  },
  {
    id: "madhubani",
    name: "Madhubani folk art",
    group: "Fun",
    hint: "Fish, peacocks, lotus borders",
    art: "traditional Madhubani (Mithila) folk painting: a double border of fish, peacocks, lotus flowers and vines, fine black outlines with bright red, yellow, green and indigo fills, handmade paper texture",
    couple: false,
    area: "center",
    display: "Yatra One",
    body: "Cormorant Garamond",
    ink: "#2A1408",
    accent: "#B3261E",
    panel: { fill: "rgba(255,246,226,0.92)", stroke: "#2A1408", radius: 8 },
    swatch: ["#D9341F", "#F2B705", "#1F7A4D"],
    ideas: ["fish and peacocks", "sun and moon", "tree of life", "lotus"],
  },
  {
    id: "chibi",
    name: "Kawaii chibi",
    group: "Fun",
    hint: "Tiny cute couple, pastels",
    art: "an adorable kawaii chibi illustration: a tiny Indian bride and groom with big heads and rosy cheeks in wedding outfits, surrounded by pastel flowers, hearts and little marigolds, clean flat vector style, soft pastel background",
    couple: true,
    area: "upper",
    display: "Fredoka",
    body: "Fredoka",
    ink: "#4A2A3A",
    accent: "#E26D8F",
    panel: { fill: "rgba(255,255,255,0.8)", radius: 24 },
    swatch: ["#FFD1DC", "#BDE6D8", "#FFF7EC"],
    ideas: ["our cat", "bubble tea", "floating hearts", "a tiny scooter"],
  },
];

export function getCardTemplate(id: string): CardTemplate {
  return CARD_TEMPLATES.find((t) => t.id === id) ?? CARD_TEMPLATES[0];
}

export interface CardDetails {
  name1: string;
  name2: string;
  event: CardEvent;
  date: string; // yyyy-mm-dd
  time: string; // hh:mm
  venue: string;
  city: string;
  hosts: string;
  dressCode: string;
  rsvp: string;
  hashtag: string;
}

export const EMPTY_DETAILS: CardDetails = {
  name1: "",
  name2: "",
  event: "wedding",
  date: "",
  time: "",
  venue: "",
  city: "",
  hosts: "",
  dressCode: "",
  rsvp: "",
  hashtag: "",
};

export const EXAMPLE_DETAILS: CardDetails = {
  name1: "Priya",
  name2: "Arjun",
  event: "wedding",
  date: "2027-02-14",
  time: "18:30",
  venue: "The Ritz-Carlton, Half Moon Bay",
  city: "California",
  hosts: "Together with their families",
  dressCode: "Indian festive",
  rsvp: "RSVP by January 10 · priyaandarjun.com",
  hashtag: "#PriyaWedsArjun",
};

export const DRESS_CODES = ["Indian festive", "Traditional red and gold", "Pastels", "Black tie Indian", "Shades of yellow", "Shades of green", "Whites and ivory", "Indo-western"];

/** The lines of text on the card, top to bottom, as roles the renderer styles. */
export type LineRole = "kicker" | "names" | "amp" | "event" | "date" | "venue" | "small";

export function cardLines(d: CardDetails): { role: LineRole; text: string }[] {
  const n1 = d.name1.trim() || "Priya";
  const n2 = d.name2.trim() || "Arjun";
  const kicker: Record<CardEvent, string> = {
    wedding: d.hosts.trim() || "Together with their families",
    save_the_date: "Save the date",
    engagement: d.hosts.trim() || "Please join us to celebrate the engagement of",
    haldi: "You're invited to the Haldi of",
    mehndi: "You're invited to the Mehndi of",
    sangeet: "Come dance at the Sangeet of",
    reception: d.hosts.trim() || "Please join us for the reception of",
  };
  const event: Partial<Record<CardEvent, string>> = {
    wedding: "request the pleasure of your company at their wedding",
    save_the_date: "are getting married!",
  };
  const lines: { role: LineRole; text: string }[] = [{ role: "kicker", text: kicker[d.event] }];
  lines.push({ role: "names", text: n1 }, { role: "amp", text: "&" }, { role: "names", text: n2 });
  if (event[d.event]) lines.push({ role: "event", text: event[d.event]! });
  const when = [formatDate(d.date), formatTime(d.time)].filter(Boolean).join(" · ");
  lines.push({ role: "date", text: when || "Saturday, February 14, 2027" });
  if (d.event !== "save_the_date") {
    const where = [d.venue.trim(), d.city.trim()].filter(Boolean).join(", ");
    lines.push({ role: "venue", text: where || "Venue to be announced" });
  } else if (d.city.trim()) {
    lines.push({ role: "venue", text: d.city.trim() });
  }
  if (d.dressCode.trim()) lines.push({ role: "small", text: `Dress code: ${d.dressCode.trim()}` });
  if (d.rsvp.trim()) lines.push({ role: "small", text: d.rsvp.trim() });
  if (d.hashtag.trim()) lines.push({ role: "small", text: d.hashtag.trim().startsWith("#") ? d.hashtag.trim() : `#${d.hashtag.trim()}` });
  return lines;
}

function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return "";
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function formatTime(hhmm: string): string {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!m) return "";
  const h = Number(m[1]);
  return `${h % 12 || 12}:${m[2]} ${h < 12 ? "AM" : "PM"}`;
}

const AREA_TEXT: Record<TextArea, string> = {
  center: "the central area (roughly the middle 70% width and 55% height)",
  lower: "the lower half",
  upper: "the upper 45%",
};

export function cardArtPrompt(opts: { template: string; event: CardEvent; format: CardFormat; motifs: string }): string {
  const t = getCardTemplate(opts.template);
  const ev = CARD_EVENTS.find((e) => e.id === opts.event) ?? CARD_EVENTS[0];
  const motifs = opts.motifs.trim().replace(/\s+/g, " ").slice(0, 160);
  return [
    `Create the ARTWORK ONLY for ${ev.art} invitation, as a ${opts.format === "story" ? "tall phone-screen (9:16)" : "portrait card (3:4)"} design.`,
    `STYLE: ${t.art}.`,
    `COMPOSITION (MUST FOLLOW): keep ${AREA_TEXT[t.area]} as calm, uncluttered empty space (plain paper, sky or fabric) where the invitation text will be printed later. Put all decoration${t.couple ? " and the couple" : ""} around that space, never inside it.`,
    motifs ? `Personal touches to weave in subtly: ${motifs}.` : "",
    "ABSOLUTELY NO TEXT: no letters, words, numbers, names, calligraphy, monograms, signatures, logos or watermarks anywhere in the image.",
    "Quality: print-ready, crisp, balanced and symmetric where it suits the style, rich detail at the edges, full-bleed to all four sides.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function parseCardRequest(raw: unknown): { template: string; event: CardEvent; format: CardFormat; motifs: string } | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const template = typeof r.template === "string" && CARD_TEMPLATES.some((t) => t.id === r.template) ? r.template : null;
  const event = CARD_EVENTS.find((e) => e.id === r.event)?.id ?? null;
  const format = r.format === "card" || r.format === "story" ? r.format : null;
  const motifs = typeof r.motifs === "string" ? r.motifs.slice(0, 160) : "";
  if (!template || !event || !format) return null;
  return { template, event, format, motifs };
}

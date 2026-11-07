/** Free tools, listed on /tools and in the sitemap. */
export interface FreeTool {
  slug: string;
  name: string;
  /** One line for the tools grid. */
  blurb: string;
  /** Page <title> and description, written for search. */
  title: string;
  description: string;
  keywords: string[];
  image: string;
  /** Where the tool lives when it isn't under /tools (the bridal look is the Looks product page). */
  href?: string;
}

export function toolHref(t: FreeTool): string {
  return t.href ?? `/tools/${t.slug}`;
}

export const FREE_TOOLS: FreeTool[] = [
  {
    slug: "ai-bridal-look",
    name: "Bridal and groom look",
    blurb: "Upload a selfie. See yourself as a bride or groom in 8 traditions. Try for free.",
    title: "AI Bridal Look Try-On: See Yourself as an Indian Bride or Groom (Free)",
    description:
      "Free AI wedding look try-on for Desi brides and grooms. Upload your photo and see yourself in a bridal lehenga, Kanjeevaram saree, sherwani and safa or a couple portrait, in the tradition and color you choose. Try for free.",
    keywords: [
      "AI bridal look",
      "see yourself as an Indian bride",
      "bridal lehenga try on",
      "virtual saree try on",
      "AI wedding photo generator",
      "groom sherwani try on",
      "Indian wedding look AI",
    ],
    image: "/samples/couple.jpg",
    href: "/looks",
  },
  {
    slug: "ai-venue-decor-visualizer",
    name: "Venue decor visualizer",
    blurb: "Upload a photo of your hall or backyard. See it decorated for your wedding. Try for free.",
    title: "AI Wedding Venue Decor Visualizer: See Your Hall or Backyard Decorated (Free)",
    description:
      "Free AI wedding decor visualizer. Upload a photo of your empty banquet hall, backyard, lawn or temple and see it decorated for the mandap, reception, Sangeet, Mehndi or Haldi in Royal, South Indian, Floral, Modern, Mughal or Boho style. Drag the slider to compare before and after. Try for free.",
    keywords: [
      "wedding venue decor visualizer",
      "AI wedding decoration",
      "see my venue decorated",
      "banquet hall decoration ideas",
      "backyard Indian wedding decor",
      "mandap decoration AI",
      "wedding decor preview",
    ],
    image: "/samples/hero-after.jpg",
  },
  {
    slug: "wedding-art-portrait",
    name: "Art portrait",
    blurb: "Upload a photo of you two. Get it as dreamy anime, 80s retro, a Bollywood poster and more. Try for free.",
    title: "Turn Your Photo Into Art: Anime, 80s, Bollywood Poster Couple Portraits (Free)",
    description:
      "Free AI couple portrait maker. Upload a photo of the two of you and turn it into a dreamy anime still, an 80s retro glamour shot, a Bollywood poster, a Mughal miniature, Madhubani, Tanjore, a classic oil painting, 3D animated, watercolor or pop art. Dress up for the wedding or keep your clothes. Try for free.",
    keywords: [
      "anime couple portrait from photo",
      "turn photo into anime",
      "80s style portrait AI",
      "Bollywood poster from photo",
      "couple portrait AI free",
      "Tanjore painting from photo",
      "save the date portrait",
    ],
    image: "/samples/art/anime.jpg",
  },
  {
    slug: "wedding-invitation-maker",
    name: "Wedding invitation maker",
    blurb: "Type your details, pick one of 13 styles, from royal to anime. Try for free.",
    title: "Free AI Indian Wedding Invitation Maker: 13 Styles, WhatsApp Ready",
    description:
      "Make an Indian wedding invitation, save the date, Mehndi, Sangeet or Haldi card in seconds. Type your details, choose a style (royal Rajasthani, South Indian, Mughal, watercolor, anime, 3D animated, Gen Z, retro Bollywood, Madhubani and more) and download a card or WhatsApp story. Try for free.",
    keywords: [
      "Indian wedding invitation maker",
      "wedding card maker free",
      "WhatsApp wedding invitation",
      "save the date Indian wedding",
      "mehndi invitation card",
      "sangeet invitation",
      "anime wedding invitation",
      "AI wedding invitation",
    ],
    image: "/samples/sangeet.jpg",
  },
  {
    slug: "outfit-photo-color-palette",
    name: "Palette from your outfit photo",
    blurb: "Upload an outfit photo. Get its colors, plus matching groom, family and decor colors.",
    title: "Get a Wedding Color Palette From Your Lehenga or Saree Photo",
    description:
      "Free tool: upload a photo of your lehenga, saree, sherwani or fabric and get its exact colors with names and hex codes, matching groom and family colors, and mandap decor palettes. Your photo never leaves your device.",
    keywords: [
      "color palette from photo",
      "lehenga color palette",
      "saree color combination finder",
      "extract colors from image",
      "matching groom outfit for lehenga",
      "wedding palette from dress",
    ],
    image: "/samples/groom.jpg",
  },
  {
    slug: "wedding-color-palette-finder",
    name: "Wedding color palette finder",
    blurb: "Pick the event and season. Get the 3 best palettes, with flowers in season.",
    title: "Indian Wedding Color Palette Finder: Colors by Event and Season",
    description:
      "Free Desi wedding color palette finder. Choose Haldi, Mehndi, Sangeet, the ceremony or the reception, plus the season, time of day and outfit color, and get the best decor palettes with flowers in season.",
    keywords: [
      "Indian wedding color palette",
      "Indian wedding color schemes",
      "mehndi color theme",
      "sangeet color theme",
      "fall Indian wedding colors",
      "mandap decor colors",
    ],
    image: "/samples/palette-emerald.jpg",
  },
  {
    slug: "outfit-color-matcher",
    name: "Outfit color matcher",
    blurb: "Pick the bride's color. Get the groom's, the family's and the decor's.",
    title: "Indian Wedding Outfit Color Matcher: Groom, Family and Decor Colors",
    description:
      "Free tool for Desi weddings: choose the bride's lehenga or saree color and get matching groom colors, bridal party colors and a mandap decor palette for Haldi, Mehndi, Sangeet, the wedding and the reception.",
    keywords: [
      "lehenga and sherwani color combination",
      "bride and groom outfit color matching",
      "Indian wedding color combinations",
      "groom outfit color for red lehenga",
      "bridesmaid colors Indian wedding",
      "mandap decor color palette",
    ],
    image: "/samples/bride.jpg",
  },
  {
    slug: "wedding-hashtag-generator",
    name: "Desi wedding hashtag generator",
    blurb: "Type two names. Get hashtags for the wedding and every event.",
    title: "Desi Wedding Hashtag Generator: Indian Wedding Hashtags in Seconds",
    description:
      "Free Indian wedding hashtag generator. Enter both names and get #NameWedsName classics, Shaadi hashtags, name blends and event hashtags for Haldi, Mehndi, Sangeet, Baraat and the reception.",
    keywords: [
      "Indian wedding hashtag generator",
      "desi wedding hashtags",
      "shaadi hashtag ideas",
      "wedding hashtag generator",
      "mehndi hashtags",
      "sangeet hashtags",
    ],
    image: "/samples/sangeet.jpg",
  },
];

export function getTool(slug: string): FreeTool {
  return FREE_TOOLS.find((t) => t.slug === slug)!;
}

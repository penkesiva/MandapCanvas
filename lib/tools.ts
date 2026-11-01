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
}

export const FREE_TOOLS: FreeTool[] = [
  {
    slug: "outfit-photo-color-palette",
    name: "Palette from your outfit photo",
    blurb: "Upload a photo of a lehenga, saree or sherwani. Get its exact colors, the matching groom and family colors, and decor that frames it.",
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
    blurb: "Pick the event, the season and the time of day. Get the three palettes that suit it best, with in-season flowers.",
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
    blurb: "Pick the bride's outfit color. Get the groom's colors, the family's colors and a decor palette that won't swallow her.",
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
    blurb: "Type two names. Get classic, Desi and name-blend hashtags, plus one for every event from Haldi to the reception.",
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

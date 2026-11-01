/**
 * The AI bridal look tool: wedding traditions with what the bride and groom wear in each,
 * plus the prompt that turns a person's photo into a wedding portrait of them.
 * Safe to import on the client (no secrets).
 */

import { OUTFIT_COLORS } from "./outfitColors";

export type LookWho = "bride" | "groom" | "couple";

export interface LookTradition {
  id: string;
  name: string;
  /** Short hint shown under the name. */
  hint: string;
  bride: string;
  groom: string;
  /** Default outfit colors (shown on the little figures before a color is picked). */
  brideHex: string;
  groomHex: string;
  safaHex: string;
}

export const LOOK_TRADITIONS: LookTradition[] = [
  {
    id: "north",
    name: "North Indian",
    hint: "Red lehenga, sherwani and safa",
    bride:
      "a heavily embroidered bridal lehenga with zardozi and gota work, a matching fitted blouse, and a sheer net dupatta pinned over the head with a scalloped embroidered border; red and gold chooda bangles with kaleere",
    groom: "a hand-embroidered sherwani with churidar, a draped dupatta stole over one shoulder, a pleated safa turban with a jeweled kalgi brooch, and embroidered mojari shoes",
    brideHex: "#B3131B",
    groomHex: "#F6EFE2",
    safaHex: "#B3131B",
  },
  {
    id: "south",
    name: "South Indian",
    hint: "Kanjeevaram silk and temple gold",
    bride:
      "a Kanjeevaram silk saree with a broad contrasting zari border, draped in the traditional South Indian style, with temple jewelry: a gold oddiyanam waist belt, layered gold necklaces, jhumkas and a nethi chutti; hair in a long braid decorated with jasmine flowers",
    groom: "a crisp silk veshti with a gold zari border, a matching angavastram draped over the shoulders, a simple gold chain, and a sandalwood and kumkum tilak",
    brideHex: "#7A1F3D",
    groomHex: "#F6EFE2",
    safaHex: "#C9A24B",
  },
  {
    id: "bengali",
    name: "Bengali",
    hint: "Banarasi red, shola mukut",
    bride:
      "a red Banarasi silk saree with gold brocade, a white shola mukut crown, delicate white and red chandan dots above the eyebrows, shakha-pola bangles and gold jewelry",
    groom: "an ivory silk dhoti and panjabi kurta, a draped silk shawl, and a tall white conical shola topor headpiece",
    brideHex: "#B3131B",
    groomHex: "#F6EFE2",
    safaHex: "#FFFFFF",
  },
  {
    id: "punjabi",
    name: "Punjabi",
    hint: "Lehenga, chooda and pagg",
    bride:
      "an embroidered bridal lehenga with a dupatta over the head, a red and ivory chooda on both wrists with golden kaleere hanging from them, a maang tikka and a large nath",
    groom: "an embroidered sherwani, a neatly tied pagg turban with a kalgi, a sehra of fresh flowers or pearls pushed back from the face",
    brideHex: "#C2185B",
    groomHex: "#E9D9B6",
    safaHex: "#E7849B",
  },
  {
    id: "gujarati",
    name: "Gujarati",
    hint: "Panetar and gharchola",
    bride:
      "a white and red panetar saree with a red gharchola bandhani dupatta over the head in the Gujarati drape, kundan jewelry, and red and white bangles",
    groom: "an ivory or cream silk kurta with a bandhani-print safa turban, a dupatta stole and mojari shoes",
    brideHex: "#B3131B",
    groomHex: "#F6EFE2",
    safaHex: "#D9503F",
  },
  {
    id: "marathi",
    name: "Marathi",
    hint: "Nauvari and mundavalya",
    bride:
      "a nine-yard nauvari Paithani silk saree with a peacock border, a Maharashtrian nath nose ring, green glass bangles, and strings of pearls (mundavalya) tied across the forehead",
    groom: "an ivory silk kurta and dhoti, a traditional pheta turban, and pearl mundavalya tied across the forehead",
    brideHex: "#0F6E5C",
    groomHex: "#F6EFE2",
    safaHex: "#E2A72E",
  },
  {
    id: "nikah",
    name: "Nikah",
    hint: "Sharara and jhoomar",
    bride:
      "an embroidered sharara or gharara with a long kurta, a dupatta over the head, a jhoomar (passa) ornament on one side of the head, a maang tikka and polki jewelry",
    groom: "a fitted achkan sherwani with churidar, an embroidered stole, and an optional sehra of flowers framing the face from a matching turban",
    brideHex: "#6D1A36",
    groomHex: "#EDE3D1",
    safaHex: "#C9A24B",
  },
  {
    id: "modern",
    name: "Modern pastel",
    hint: "Reception-style couture",
    bride:
      "a modern pastel designer lehenga with delicate sequin and thread work, a light organza dupatta on one shoulder, and fine diamond and pearl jewelry",
    groom: "a tailored pastel bandhgala or a sherwani-style jacket with clean lines, a pocket square, and no turban",
    brideHex: "#F4B6C2",
    groomHex: "#E8E2D6",
    safaHex: "#F4B6C2",
  },
];

export const LOOK_JEWELRY = [
  { id: "delicate", name: "Delicate", text: "minimal, delicate jewelry" },
  { id: "classic", name: "Classic", text: "classic bridal jewelry, elegant and balanced" },
  { id: "royal", name: "Royal", text: "rich, royal heirloom-style jewelry, layered and statement" },
] as const;

export const LOOK_SETTINGS = [
  { id: "mandap", name: "At the mandap", text: "standing in front of a beautifully decorated wedding mandap with marigolds, roses and soft drapes, warm daylight" },
  { id: "studio", name: "Studio portrait", text: "a clean studio portrait with a soft, warm, plain backdrop and flattering soft light" },
  { id: "palace", name: "Palace courtyard", text: "a Rajasthani palace courtyard with carved sandstone arches, golden-hour light" },
  { id: "garden", name: "Garden, golden hour", text: "a lush garden at golden hour with soft backlight and blurred flowers" },
] as const;

export type LookJewelry = (typeof LOOK_JEWELRY)[number]["id"];
export type LookSetting = (typeof LOOK_SETTINGS)[number]["id"];

export interface LookRequest {
  who: LookWho;
  tradition: string;
  /** An OUTFIT_COLORS id, or "" for the tradition's usual colors. */
  color: string;
  jewelry: LookJewelry;
  setting: LookSetting;
}

export function getTradition(id: string): LookTradition {
  return LOOK_TRADITIONS.find((t) => t.id === id) ?? LOOK_TRADITIONS[0];
}

export function parseLookRequest(raw: unknown): LookRequest | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const who = r.who === "bride" || r.who === "groom" || r.who === "couple" ? r.who : null;
  const tradition = typeof r.tradition === "string" && LOOK_TRADITIONS.some((t) => t.id === r.tradition) ? r.tradition : null;
  const color = typeof r.color === "string" && (r.color === "" || OUTFIT_COLORS.some((o) => o.id === r.color)) ? r.color : null;
  const jewelry = LOOK_JEWELRY.find((j) => j.id === r.jewelry)?.id ?? null;
  const setting = LOOK_SETTINGS.find((s) => s.id === r.setting)?.id ?? null;
  if (!who || !tradition || color === null || !jewelry || !setting) return null;
  return { who, tradition, color, jewelry, setting };
}

/**
 * The prompt. Identity comes first and last because image models drift toward a generic face;
 * the outfit, jewelry and setting sit in the middle.
 */
export function buildLookPrompt(req: LookRequest): string {
  const t = getTradition(req.tradition);
  const outfit = OUTFIT_COLORS.find((o) => o.id === req.color);
  const jewelry = LOOK_JEWELRY.find((j) => j.id === req.jewelry)!.text;
  const setting = LOOK_SETTINGS.find((s) => s.id === req.setting)!.text;

  const brideColor = outfit ? `${outfit.name.toLowerCase()} (${outfit.hex}) as the main color` : "the colors traditional for this look";
  const groomColor = outfit ? `colors that complement a ${outfit.name.toLowerCase()} bridal outfit: ${outfit.groom.map((g) => g.name.toLowerCase()).join(", ")}` : "the colors traditional for this look";

  const subject =
    req.who === "couple"
      ? "the two people in the PHOTO as a bride and groom on their wedding day. Keep them in the same left-right positions as in the photo. If the photo shows one person only, dress that person and add no one else"
      : req.who === "bride"
        ? "the person in the PHOTO as a bride on her wedding day. If there are several people in the photo, use the most prominent one only"
        : "the person in the PHOTO as a groom on his wedding day. If there are several people in the photo, use the most prominent one only";

  const groomOwn = outfit ? `${outfit.name.toLowerCase()} (${outfit.hex}) with gold accents` : "the colors traditional for this look";
  const outfits =
    req.who === "couple"
      ? `BRIDE OUTFIT (in ${brideColor}): ${t.bride}.\nGROOM OUTFIT (in ${groomColor}): ${t.groom}.`
      : req.who === "bride"
        ? `BRIDE OUTFIT (in ${brideColor}): ${t.bride}.`
        : `GROOM OUTFIT (in ${groomOwn}): ${t.groom}.`;

  const styling =
    req.who === "groom"
      ? "Grooming: neat, natural; keep any beard, mustache or glasses exactly as in the photo."
      : `Jewelry: ${jewelry}. Makeup: natural, elegant bridal makeup that suits the person's own skin tone. Hair styled for the look; keep the person's own hair color.`;

  return [
    `Create a photo-real ${t.name} wedding portrait of ${subject}.`,
    "IDENTITY (MUST FOLLOW): this must be unmistakably the same real person, recognizable to their family. Keep the exact face: face shape, eyes, eyebrows, nose, lips, jawline, smile, skin tone and complexion, age, ethnicity, body type and any beard, moles or glasses. Do not slim, lighten, smooth or beautify the face, and do not swap it for a model's face.",
    outfits,
    styling,
    `Setting: ${setting}.`,
    "Photography: a professional Indian wedding photographer's portrait, 85mm lens, natural skin texture, soft flattering light, shallow depth of field, rich fabric detail, three-quarter or waist-up framing with the face clearly visible and in sharp focus, tasteful and dignified.",
    "Do not add any text, logos, watermarks, borders or extra people.",
    "FINAL CHECK: the face is the same person as in the PHOTO.",
  ].join("\n\n");
}

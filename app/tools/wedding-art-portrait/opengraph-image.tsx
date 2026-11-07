import { OG_SIZE, toolOgImage } from "@/components/tools/ToolOg";

export const alt = "Turn your photo into art: anime, 80s retro, Bollywood poster and more";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return toolOgImage("Turn your photo into art", "Dreamy anime, 80s retro, Bollywood poster, Tanjore and 6 more styles. Upload a photo of the two of you. Try for free.", ["#9CC9E8", "#FF5FA2", "#E8892B", "#0F4D36", "#E2B43C", "#FFF8EE"]);
}

import { OG_SIZE, toolOgImage } from "@/components/tools/ToolOg";

export const alt = "AI wedding invitation maker";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return toolOgImage("Your wedding card, in 13 styles", "Type your names, date and venue. Royal, South Indian, anime, 3D animated, Gen Z and more. First card free.", ["#6D1A36", "#C9A24B", "#F4C6CF", "#C9B6FF", "#D7261E", "#0F4D36"]);
}

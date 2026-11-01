import { OG_SIZE, toolOgImage } from "@/components/tools/ToolOg";

export const alt = "Indian wedding outfit color matcher";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return toolOgImage("Outfit color matcher", "Bride's lehenga color in. Groom, family and decor colors out.", ["#B3131B", "#F6EFE2", "#D8C08A", "#0F5132", "#F2C4C0", "#F2A900", "#1C3F8C"]);
}

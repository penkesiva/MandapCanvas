import { OG_SIZE, toolOgImage } from "@/components/tools/ToolOg";

export const alt = "Wedding color palette from your outfit photo";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return toolOgImage("Your lehenga, your palette", "Upload an outfit photo. Get its colors, the groom's and family's colors, and decor that frames it.", ["#0F5132", "#C9A24B", "#F6EFE2", "#6D1A36", "#F2C4C0", "#1E4D3A"]);
}

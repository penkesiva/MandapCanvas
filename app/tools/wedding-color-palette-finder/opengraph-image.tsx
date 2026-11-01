import { OG_SIZE, toolOgImage } from "@/components/tools/ToolOg";

export const alt = "Indian wedding color palette finder";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return toolOgImage("Wedding color palette finder", "The right colors for Haldi, Mehndi, Sangeet, the wedding and the reception, by season.", ["#F2A900", "#BFE3D0", "#F2C4C0", "#0F5132", "#6D1A36", "#A4161A", "#1C3F8C", "#F6B99B"]);
}

import { OG_SIZE, toolOgImage } from "@/components/tools/ToolOg";

export const alt = "AI wedding venue decor visualizer";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return toolOgImage("See your venue, decorated", "Upload a photo of your hall or backyard. AI decorates it for the mandap, Sangeet or reception. Try for free.", ["#9E1B32", "#C9A24B", "#F2C4C0", "#0F4D36", "#E8A33A", "#FFF8EE"]);
}

import { OG_SIZE, toolOgImage } from "@/components/tools/ToolOg";

export const alt = "See yourself as an Indian bride or groom";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return toolOgImage("See yourself as a bride or groom", "Upload a photo. Get a photo-real wedding portrait in the tradition and colors you choose. First look free.", ["#B3131B", "#C9A24B", "#F6EFE2", "#C2185B", "#0F5132", "#F4B6C2"]);
}

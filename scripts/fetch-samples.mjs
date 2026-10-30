// Downloads the marketing sample images into public/samples and builds public/og.jpg.
// Run once from the project root:  npm run fetch-samples
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const BASE = "https://d8j0ntlcm91z4.cloudfront.net/user_3KFdRUlXh9J5GJEnxUitHacW41p/";
const FILES = {
  "hero-before": "hf_20261030_083219_250847a7-36ee-44fb-b73e-9076beedd165.png",
  "hero-after": "hf_20261030_083819_23103f32-712d-475c-beec-27f19119bfb5.png",
  "palette-blush": "hf_20261030_083819_23103f32-712d-475c-beec-27f19119bfb5.png",
  "palette-emerald": "hf_20261030_083818_af9a3f1b-e274-413d-8436-bafc8338af52.png",
  "palette-red": "hf_20261030_083819_a87687f5-4027-4ff4-8ada-e5899ac186f9.png",
  haldi: "hf_20261030_082804_39409c5a-315a-495b-8aae-6f9de19d947e.png",
  mehndi: "hf_20261030_082803_bbe024b0-e482-4d1d-bc25-372320e782ec.png",
  sangeet: "hf_20261030_082803_598ba5e6-68ef-4b21-979c-def1c38c1748.png",
  sikh: "hf_20261030_082805_e65c3596-4b22-4069-bdc1-28e93070148c.png",
  nikah: "hf_20261030_082806_9376842e-733f-4dcc-8c99-ab5c3582f500.png",
  "south-indian": "hf_20261030_082804_18c338ee-3988-4994-8a9e-d5d930a5a69b.png",
  reception: "hf_20261030_082806_7963e34d-21a4-4a50-8e1c-72b14b96a1ed.png",
  couple: "hf_20261030_082805_0e814ddd-d0a0-4433-844b-a5820d8ec1fd.png",
  bride: "hf_20261030_082806_adc89fdd-a53d-42f9-9bd5-0014a351fe19.png",
  groom: "hf_20261030_082805_53cc094a-aadb-44f4-9799-bc12f1660ec2.png",
  family: "hf_20261030_082804_c30ef59a-cce8-4184-8d36-82ad2e606683.png",
  "mandap-classic": "hf_20261030_082805_4381cb98-0907-4635-bc64-0974357d8367.png",
};

const outDir = path.join(process.cwd(), "public", "samples");
await fs.mkdir(outDir, { recursive: true });

const cache = new Map();
for (const [name, file] of Object.entries(FILES)) {
  let buf = cache.get(file);
  if (!buf) {
    const res = await fetch(BASE + file);
    if (!res.ok) throw new Error(`Download failed for ${name}: ${res.status}`);
    buf = Buffer.from(await res.arrayBuffer());
    cache.set(file, buf);
  }
  const out = path.join(outDir, `${name}.jpg`);
  await sharp(buf).resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toFile(out);
  console.log("saved", path.relative(process.cwd(), out));
}

// Social share image: sketch | preview, side by side.
const left = await sharp(path.join(outDir, "hero-before.jpg")).resize(600, 630, { fit: "cover" }).toBuffer();
const right = await sharp(path.join(outDir, "hero-after.jpg")).resize(600, 630, { fit: "cover" }).toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 3, background: "#fbf1ee" } })
  .composite([
    { input: left, left: 0, top: 0 },
    { input: right, left: 600, top: 0 },
    { input: Buffer.from('<svg width="1200" height="630"><rect x="594" y="0" width="12" height="630" fill="#e9a23b"/></svg>'), left: 0, top: 0 },
  ])
  .jpeg({ quality: 85 })
  .toFile(path.join(process.cwd(), "public", "og.jpg"));
console.log("saved public/og.jpg");

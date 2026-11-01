/**
 * Color extraction for outfit photos. Runs in the browser on a small copy of the image:
 * weighted k-means (the center of the photo, where the outfit usually is, counts more than the edges),
 * then names each color in the vocabulary Desi families use ("rani pink", "mehndi green", "zari gold").
 */

export type RGB = [number, number, number];

export interface ExtractedColor {
  hex: string;
  rgb: RGB;
  /** Share of the (weighted) photo, 0–1. */
  share: number;
  name: string;
  /** Looks like metallic gold or silver work. */
  metal?: "gold" | "silver";
  /** How much of this color sits in the middle of the photo (where the outfit usually is), 0–1. */
  center?: number;
}

const NAMED: [string, string][] = [
  ["Sindoor red", "#A4161A"],
  ["Bridal red", "#B3131B"],
  ["Maroon", "#5E1220"],
  ["Wine", "#6D1A36"],
  ["Rani pink", "#C2185B"],
  ["Magenta", "#B0186E"],
  ["Hot pink", "#E2457A"],
  ["Rose pink", "#D9798F"],
  ["Dusty rose", "#C9898C"],
  ["Blush", "#F2C4C0"],
  ["Powder pink", "#F7D6E0"],
  ["Peach", "#F6B99B"],
  ["Coral", "#EF7B5E"],
  ["Kesari saffron", "#E8590C"],
  ["Rust", "#A8461C"],
  ["Marigold", "#F2A900"],
  ["Haldi yellow", "#F2C200"],
  ["Mustard", "#C99A1E"],
  ["Butter yellow", "#FFF0B8"],
  ["Mehndi green", "#5E6B2A"],
  ["Parrot green", "#6A8D2B"],
  ["Olive", "#6B7A3A"],
  ["Sage", "#A7BFA0"],
  ["Mint", "#BFE3D0"],
  ["Pista", "#B9D3A0"],
  ["Emerald", "#0F5132"],
  ["Bottle green", "#1E4D3A"],
  ["Teal", "#14706E"],
  ["Firozi", "#2BB3B1"],
  ["Peacock blue", "#0E5E7E"],
  ["Powder blue", "#B9CFE3"],
  ["Royal blue", "#1C3F8C"],
  ["Navy", "#1A2440"],
  ["Lavender", "#C9B8E0"],
  ["Lilac", "#B79CC9"],
  ["Purple", "#5B2A86"],
  ["Plum", "#4E2140"],
  ["Ivory", "#F6EFE2"],
  ["Cream", "#F5E6C8"],
  ["Champagne", "#E8D3B0"],
  ["Beige", "#D8C3A5"],
  ["Sand", "#CDB89A"],
  ["Taupe", "#A0907A"],
  ["Zari gold", "#C9A24B"],
  ["Antique gold", "#B08D57"],
  ["Silver", "#C0C6D0"],
  ["Grey", "#8A8A8A"],
  ["Charcoal", "#3A3A3A"],
  ["Black", "#151515"],
  ["White", "#FAFAF7"],
  ["Brown", "#6B4430"],
];

export function toHex([r, g, b]: RGB): string {
  return "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();
}

export function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Perceptual-ish distance ("redmean"). */
export function colorDistance(a: RGB, b: RGB): number {
  const rm = (a[0] + b[0]) / 2;
  return Math.sqrt((2 + rm / 256) * (a[0] - b[0]) ** 2 + 4 * (a[1] - b[1]) ** 2 + (2 + (255 - rm) / 256) * (a[2] - b[2]) ** 2);
}

export function hsl([r, g, b]: RGB): { h: number; s: number; l: number } {
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === R ? (G - B) / d + (G < B ? 6 : 0) : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
  h *= 60;
  return { h, s, l };
}

export function nameColor(rgb: RGB): string {
  // Very dark but clearly tinted (a shaded emerald, a deep wine): name the hue, not "black".
  const { s, l } = hsl(rgb);
  if (l < 0.16 && s > 0.3) {
    const k = 150 / Math.max(1, ...rgb);
    const base = nameColor(rgb.map((v) => Math.min(255, v * k)) as RGB);
    if (base.startsWith("Deep ") || ["Black", "Charcoal", "Grey"].includes(base)) return base;
    const family: Record<string, string> = { "Parrot green": "green", "Mehndi green": "green", Olive: "olive", Pista: "green", Sage: "green", Mint: "green" };
    return `Deep ${family[base] ?? base.toLowerCase()}`;
  }
  let best = NAMED[0][0];
  let bestD = Infinity;
  for (const [name, hex] of NAMED) {
    const d = colorDistance(rgb, hexToRgb(hex));
    if (d < bestD) {
      bestD = d;
      best = name;
    }
  }
  return best;
}

function metalOf(rgb: RGB): "gold" | "silver" | undefined {
  const { h, s, l } = hsl(rgb);
  if (h >= 32 && h <= 52 && s >= 0.3 && s <= 0.75 && l >= 0.35 && l <= 0.72) return "gold";
  if (s < 0.08 && l >= 0.62 && l <= 0.82) return "silver";
  return undefined;
}

/**
 * Weighted k-means on RGBA pixel data. `width`/`height` describe the pixel grid so the
 * center of the photo can count more than the edges.
 */
export function extractColors(data: Uint8ClampedArray, width: number, height: number, k = 6): ExtractedColor[] {
  const pts: RGB[] = [];
  const w: number[] = [];
  const mid: boolean[] = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      if (data[i + 3] < 128) continue;
      const dx = (x / width - 0.5) / 0.5;
      const dy = (y / height - 0.5) / 0.5;
      const r2 = dx * dx + dy * dy;
      pts.push([data[i], data[i + 1], data[i + 2]]);
      w.push(r2 < 0.45 ? 1 : r2 < 1 ? 0.5 : 0.2);
      mid.push(Math.abs(dx) < 0.5 && Math.abs(dy) < 0.6);
    }
  }
  if (!pts.length) return [];

  // k-means++ seeding (deterministic: farthest-point after the heaviest-weighted center pixel)
  const centers: RGB[] = [pts[Math.floor(pts.length / 2)]];
  while (centers.length < k) {
    let far = 0, farD = -1;
    for (let i = 0; i < pts.length; i += 7) {
      let d = Infinity;
      for (const c of centers) d = Math.min(d, colorDistance(pts[i], c));
      if (d * w[i] > farD) {
        farD = d * w[i];
        far = i;
      }
    }
    centers.push([...pts[far]] as RGB);
  }

  const assign = new Int16Array(pts.length);
  for (let iter = 0; iter < 12; iter += 1) {
    const sum = centers.map(() => [0, 0, 0, 0]);
    for (let i = 0; i < pts.length; i += 1) {
      let best = 0, bestD = Infinity;
      for (let c = 0; c < centers.length; c += 1) {
        const d = colorDistance(pts[i], centers[c]);
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      assign[i] = best;
      const s = sum[best];
      s[0] += pts[i][0] * w[i];
      s[1] += pts[i][1] * w[i];
      s[2] += pts[i][2] * w[i];
      s[3] += w[i];
    }
    for (let c = 0; c < centers.length; c += 1) if (sum[c][3] > 0) centers[c] = [sum[c][0] / sum[c][3], sum[c][1] / sum[c][3], sum[c][2] / sum[c][3]];
  }

  const weight = centers.map(() => 0);
  const count = centers.map(() => 0);
  const inMid = centers.map(() => 0);
  let total = 0;
  for (let i = 0; i < pts.length; i += 1) {
    weight[assign[i]] += w[i];
    count[assign[i]] += 1;
    if (mid[i]) inMid[assign[i]] += 1;
    total += w[i];
  }

  // Merge near-duplicates, then sort by share.
  const out: { rgb: RGB; share: number; center: number }[] = [];
  centers
    .map((rgb, i) => ({ rgb, share: weight[i] / total, center: count[i] ? inMid[i] / count[i] : 0 }))
    .sort((a, b) => b.share - a.share)
    .forEach((c) => {
      const near = out.find((o) => colorDistance(o.rgb, c.rgb) < 38);
      if (near) {
        near.center = (near.center * near.share + c.center * c.share) / (near.share + c.share);
        near.share += c.share;
      } else out.push({ ...c });
    });

  return out
    .filter((c) => c.share >= 0.02)
    .map((c) => {
      const rgb = c.rgb.map(Math.round) as RGB;
      return { rgb, hex: toHex(rgb), share: c.share, name: nameColor(rgb), metal: metalOf(rgb), center: c.center };
    });
}

/**
 * The outfit's main color: the biggest colorful cluster. Background walls, skin and white space tend to be
 * low-saturation or skin-toned, so a colorful cluster wins over them unless the outfit itself is pale.
 */
export function mainOutfitColor(colors: ExtractedColor[]): ExtractedColor | undefined {
  const score = (c: ExtractedColor) => {
    const { h, s, l } = hsl(c.rgb);
    const skin = h >= 12 && h <= 42 && s >= 0.18 && s <= 0.65 && l >= 0.35 && l <= 0.86;
    const brown = h >= 12 && h <= 45 && l < 0.5 && s > 0.15; // wood, hair, a warm room
    const black = l < 0.1 && s < 0.3;
    const center = c.center ?? 0.5;
    return (
      c.share *
      center *
      center *
      (0.6 + 0.6 * Math.min(s, 0.8)) *
      (skin ? 0.3 : 1) *
      (brown ? 0.45 : 1) *
      (black ? 0.3 : 1) *
      (c.metal ? 0.6 : 1)
    );
  };
  return [...colors].sort((a, b) => score(b) - score(a))[0];
}

/** Average color around a point (for the tap-to-pick eyedropper). */
export function sampleAt(data: Uint8ClampedArray, width: number, height: number, x: number, y: number, radius = 3): RGB {
  let r = 0, g = 0, b = 0, n = 0;
  for (let yy = Math.max(0, y - radius); yy <= Math.min(height - 1, y + radius); yy += 1) {
    for (let xx = Math.max(0, x - radius); xx <= Math.min(width - 1, x + radius); xx += 1) {
      const i = (yy * width + xx) * 4;
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      n += 1;
    }
  }
  return [r / n, g / n, b / n];
}

/**
 * Wedding hashtag ideas for Desi weddings. Pure and deterministic, so the same names always give
 * the same list (and the tool page can render real examples on the server for search engines).
 */

export interface HashtagInput {
  name1: string;
  name2: string;
  last1?: string;
  last2?: string;
  year?: string;
  place?: string;
}

export interface HashtagGroup {
  id: string;
  title: string;
  tags: string[];
}

function clean(s: string | undefined): string {
  return (s ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

const VOWELS = /[aeiou]/i;

/** Name blends like Priya + Arjun → "Prijun", "Arya". Keeps only blends that read like words. */
export function blends(a: string, b: string): string[] {
  const out = new Set<string>();
  const cut = (w: string, from: "start" | "end") => {
    const mid = Math.ceil(w.length / 2);
    return from === "start" ? w.slice(0, Math.max(2, mid)) : w.slice(Math.min(w.length - 2, Math.floor(w.length / 2)));
  };
  for (const [x, y] of [
    [a, b],
    [b, a],
  ]) {
    if (x.length < 2 || y.length < 2) continue;
    const head = cut(x, "start");
    const tail = cut(y, "end").toLowerCase();
    const word = head + tail;
    if (word.length >= 4 && word.length <= 10 && VOWELS.test(word)) out.add(word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
    // first letter of one + most of the other, when the second starts with a vowel ("A" + "rjun")
    if (VOWELS.test(y.charAt(0)) && !VOWELS.test(x.charAt(0))) out.add(x.charAt(0).toUpperCase() + y.toLowerCase());
  }
  return [...out]
    .filter((w) => w.toLowerCase() !== a.toLowerCase() && w.toLowerCase() !== b.toLowerCase())
    .filter((w) => !/[^aeiouy]{3}/i.test(w)) // no hard consonant clusters like "Imrsha"
    .slice(0, 3);
}

export function generateHashtags(input: HashtagInput): HashtagGroup[] {
  const a = clean(input.name1);
  const b = clean(input.name2);
  if (!a || !b) return [];
  const la = clean(input.last1);
  const lb = clean(input.last2);
  const year = (input.year ?? "").replace(/\D/g, "").slice(0, 4);
  const place = clean(input.place);
  const bl = blends(a, b);
  const main = bl[0] ?? `${a}${b}`;

  const groups: HashtagGroup[] = [
    {
      id: "classic",
      title: "Classic",
      tags: [`${a}Weds${b}`, `${b}Weds${a}`, `${a}And${b}`, `${a}${b}Forever`, `${a}Meets${b}`, `Ever${a}${b}`],
    },
    {
      id: "desi",
      title: "Desi",
      tags: [
        `${a}${b}KiShaadi`,
        `ShaadiOf${a}And${b}`,
        `${main}Shaadi`,
        `${a}Ka${b}`,
        `${b}Ki${a}`,
        `${main}Wedding`,
        `Baraat${a}${b}`,
      ],
    },
    {
      id: "blends",
      title: "Name blends",
      tags: bl.flatMap((x) => [x, `Team${x}`, `${x}Forever`, `${x}Diaries`]),
    },
    {
      id: "events",
      title: "For each event",
      tags: ["Haldi", "Mehndi", "Sangeet", "Baraat", "Shaadi", "Reception"].map((e) => `${main}${e}`),
    },
  ];

  const extra: string[] = [];
  if (year) extra.push(`${a}${b}${year}`, `${main}${year}`, `${a}Weds${b}${year}`);
  if (place) extra.push(`${a}${b}In${place}`, `${main}In${place}`, `${place}Shaadi${main}`);
  if (la && lb && la !== lb) extra.push(`${la}${lb}Wedding`, `The${la}${lb}Shaadi`, `${la}Meets${lb}`);
  else if (lb) extra.push(`Becoming${lb}`, `Future${lb}s`, `The${lb}Wedding`);
  else if (la) extra.push(`The${la}Wedding`);
  if (extra.length) groups.push({ id: "personal", title: "With year, place or family names", tags: extra });

  const seen = new Set<string>();
  return groups
    .map((g) => ({
      ...g,
      tags: g.tags
        .filter((t) => t.length <= 40)
        .map((t) => `#${t}`)
        .filter((t) => (seen.has(t.toLowerCase()) ? false : (seen.add(t.toLowerCase()), true))),
    }))
    .filter((g) => g.tags.length);
}

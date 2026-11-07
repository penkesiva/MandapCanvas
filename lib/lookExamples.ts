/** Before-and-after examples for the Looks product. Files live in public/samples. */
export const LOOK_EXAMPLES = {
  bride: {
    label: "Bride",
    before: "/samples/look-before.jpg",
    after: "/samples/look-after.jpg",
    beforeAlt: "An everyday photo of a woman in a kitchen",
    afterAlt: "The same woman as a North Indian bride in a red lehenga",
    caption: "North Indian look, classic red, at the mandap.",
  },
  groom: {
    label: "Groom",
    before: "/samples/look-groom-before.jpg",
    after: "/samples/look-groom-after.jpg",
    beforeAlt: "An everyday selfie of a man in a coffee shop",
    afterAlt: "The same man as a groom in a sherwani and safa",
    caption: "North Indian look, ivory sherwani and red safa.",
  },
  couple: {
    label: "Couple",
    before: "/samples/look-couple-before.jpg",
    after: "/samples/look-couple-after.jpg",
    beforeAlt: "An everyday photo of a couple at a waterfront park",
    afterAlt: "The same couple as South Indian bride and groom",
    caption: "South Indian look, Kanjeevaram silk and veshti.",
  },
} as const;

export type LookExampleId = keyof typeof LOOK_EXAMPLES;

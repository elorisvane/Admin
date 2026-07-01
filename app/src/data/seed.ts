import type { Product } from "./products";
import type { Post } from "./posts";

// Original sample catalogue — used once to seed an empty database. Galleries
// (`images`, `modelMedia`, `bannerMedia`) are omitted here: those DB columns
// default to `[]` and the storefront falls back to the single cover `image`.
export const seedProducts: Omit<
  Product,
  "images" | "modelMedia" | "bannerMedia"
>[] = [
  {
    slug: "aurora-diamond-necklace",
    name: "Aurora Diamond Necklace",
    category: "HIGH JEWELLERY",
    subcategory: "",
    price: "$48,500",
    tagline: "Brilliant-cut diamonds set in 18k white gold",
    image: "/assets/1 (4).png",
    description: [
      "A cascade of brilliant-cut diamonds drawn from a single exceptional parcel, the Aurora necklace is the purest expression of the maison's savoir-faire. Each stone is hand-selected for its fire and clarity, then set by a master jeweller over more than two hundred hours.",
      "Designed to catch the light from every angle, Aurora moves with the wearer — a living constellation that transforms an evening into an occasion.",
    ],
    details: [
      { label: "Reference", value: "ELR-NK-0142" },
      { label: "Centre stone", value: "3.04ct, D Flawless" },
      { label: "Total carat", value: "12.6ct" },
      { label: "Metal", value: "18k white gold" },
    ],
    materials: ["18k White Gold", "18k Yellow Gold", "Platinum"],
  },
  {
    slug: "solene-drop-earrings",
    name: "Soléne Drop Earrings",
    category: "EARRINGS",
    subcategory: "",
    price: "$22,900",
    tagline: "Pear-cut diamonds with an articulated drop",
    image: "/assets/1 (2).png",
    description: [
      "Two pear-cut diamonds suspended from a delicate articulated mount, the Soléne earrings are an study in movement and light. The drop sways with the slightest gesture, lending an effortless elegance to both daylight and evening.",
      "A contemporary silhouette grounded in the maison's classical heritage.",
    ],
    details: [
      { label: "Reference", value: "ELR-EA-0098" },
      { label: "Stones", value: "Pear-cut diamonds" },
      { label: "Total carat", value: "4.2ct" },
      { label: "Metal", value: "18k white gold" },
    ],
    materials: ["18k White Gold", "18k Rose Gold"],
  },
  {
    slug: "emeraude-cocktail-ring",
    name: "Émeraude Cocktail Ring",
    category: "RINGS",
    subcategory: "",
    price: "$36,000",
    tagline: "Colombian emerald framed by a diamond halo",
    image: "/assets/1 (6).png",
    description: [
      "At its heart, a Colombian emerald of extraordinary saturation — an entire forest held within its facets. A halo of brilliant-cut diamonds frames the stone, amplifying its depth and presence.",
      "Sculpted in 18k yellow gold, the Émeraude ring is a singular statement piece, made to be treasured for generations.",
    ],
    details: [
      { label: "Reference", value: "ELR-RG-0211" },
      { label: "Centre stone", value: "5.18ct Colombian emerald" },
      { label: "Halo", value: "1.4ct diamonds" },
      { label: "Metal", value: "18k yellow gold" },
    ],
    materials: ["18k Yellow Gold", "18k White Gold", "Platinum"],
  },
  {
    slug: "celeste-tennis-bracelet",
    name: "Céleste Tennis Bracelet",
    category: "BRACELETS",
    subcategory: "",
    price: "$29,750",
    tagline: "A continuous line of round brilliant diamonds",
    image: "/assets/1 (5).png",
    description: [
      "The Céleste bracelet is a continuous line of perfectly matched round brilliant diamonds, each set in a discreet four-prong mount that lets the light pass through unhindered.",
      "A timeless companion, equally at home with eveningwear or worn simply against the skin.",
    ],
    details: [
      { label: "Reference", value: "ELR-BR-0175" },
      { label: "Stones", value: "Round brilliant diamonds" },
      { label: "Total carat", value: "8.0ct" },
      { label: "Metal", value: "18k white gold" },
    ],
    materials: ["18k White Gold", "18k Yellow Gold"],
  },
  {
    slug: "le-temps-automatic-watch",
    name: "Le Temps Automatic",
    category: "WATCHES",
    subcategory: "",
    price: "$64,000",
    tagline: "In-house movement with a diamond-set bezel",
    image: "/assets/1 (7).png",
    description: [
      "Behind the mother-of-pearl dial of Le Temps lies a movement of hundreds of components, assembled and adjusted entirely by hand. A bezel of brilliant-cut diamonds encircles the face, where engineering meets emotion.",
      "A timepiece worn close to the pulse — a small, beating testament to human ingenuity.",
    ],
    details: [
      { label: "Reference", value: "ELR-WA-0031" },
      { label: "Movement", value: "In-house automatic" },
      { label: "Case", value: "36mm, 18k rose gold" },
      { label: "Bezel", value: "1.1ct diamonds" },
    ],
    materials: ["18k Rose Gold", "18k Yellow Gold", "Steel & Gold"],
  },
  {
    slug: "papillon-diamond-brooch",
    name: "Papillon Diamond Brooch",
    category: "BROOCHES",
    subcategory: "",
    price: "$41,200",
    tagline: "A sculpted butterfly in diamonds and sapphires",
    image: "/assets/1 (3).png",
    description: [
      "The Papillon brooch alights on the lapel as if mid-flight — its wings articulated with pavé diamonds and shaded with a gradient of fancy sapphires.",
      "A reinterpretation of a heritage motif with a distinctly contemporary hand, finished entirely by the maison's master setters.",
    ],
    details: [
      { label: "Reference", value: "ELR-BC-0066" },
      { label: "Stones", value: "Diamonds & fancy sapphires" },
      { label: "Total carat", value: "6.3ct" },
      { label: "Metal", value: "18k white gold" },
    ],
    materials: ["18k White Gold", "Platinum"],
  },
];

export const seedPosts: Post[] = [
  {
    slug: "the-art-of-high-jewellery",
    title: "The Art of High Jewellery",
    excerpt:
      "Inside the ateliers where a single creation can take more than a thousand hours to perfect.",
    category: "CRAFTSMANSHIP",
    date: "June 12, 2026",
    readTime: "6 min read",
    image: "/assets/1 (4).png",
    body: [
      "High jewellery is the purest expression of the maison's savoir-faire — a discipline where time is measured not in hours, but in devotion. Each piece begins as a sketch, an idea drawn in gouache long before a single stone is set.",
      "Our master craftsmen work with gems sourced from the most exceptional mines in the world, selecting each for its fire, clarity and character. A necklace may pass through a dozen pairs of hands before it is deemed worthy of the ÉLORIS name.",
      "It is this uncompromising pursuit of perfection that transforms precious materials into objects of lasting emotion — heirlooms designed to outlive trends and be treasured for generations.",
    ],
  },
  {
    slug: "a-cutting-edge-cast",
    title: "A Cutting-Edge Cast",
    excerpt:
      "How our latest campaign reimagines the countryside through a lens of modern elegance.",
    category: "CAMPAIGN",
    date: "May 28, 2026",
    readTime: "4 min read",
    image: "/assets/1 (1).png",
    body: [
      "For our newest campaign we returned to the landscapes that have inspired the maison since its founding — sun-drenched gardens, weathered stone and the quiet luxury of the countryside.",
      "The collection plays with contrast: the softness of natural light against the precision of brilliant-cut diamonds, heritage motifs reinterpreted with a distinctly contemporary hand.",
      "The result is a portrait of effortless sophistication — jewellery made to be lived in, not locked away.",
    ],
  },
  {
    slug: "the-language-of-colour",
    title: "The Language of Colour",
    excerpt:
      "From Burmese rubies to Colombian emeralds, a meditation on the stones that define a collection.",
    category: "GEMOLOGY",
    date: "May 9, 2026",
    readTime: "5 min read",
    image: "/assets/1 (5).png",
    body: [
      "Colour is the soul of a gemstone. A truly exceptional ruby glows with an inner fire the trade calls 'pigeon's blood'; a fine emerald holds an entire forest within its facets.",
      "Our gemologists travel the world to source stones of extraordinary saturation and life, often waiting years for a single specimen worthy of a high-jewellery creation.",
      "Understanding colour is to understand the very language of our craft — and the dialogue between a stone and the setting that frames it.",
    ],
  },
  {
    slug: "time-and-the-watchmaker",
    title: "Time and the Watchmaker",
    excerpt:
      "A look at the mechanical artistry behind our latest timepieces, where engineering meets emotion.",
    category: "WATCHES",
    date: "April 22, 2026",
    readTime: "7 min read",
    image: "/assets/1 (7).png",
    body: [
      "A fine watch is a paradox — a machine built to measure something we can never hold. Behind each ÉLORIS timepiece lies a movement of hundreds of components, assembled and adjusted entirely by hand.",
      "Our watchmakers train for years before they are permitted to touch a complication. Patience is not a virtue here; it is a prerequisite.",
      "The finished piece is more than an instrument. It is a small, beating testament to human ingenuity, worn close to the pulse.",
    ],
  },
];

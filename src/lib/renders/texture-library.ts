/**
 * Curated texture catalog for the region/texture editor "Library" tab. Pure
 * data (no React) so both the API route (resolves id → prompt) and the studio
 * panel (renders the grid) import it.
 *
 * MVP ships no binary thumbnails: each item carries a CSS `swatch` used as a
 * placeholder preview. Add a real `thumbnail` URL later without other changes.
 */

export type TextureCategory =
  | "Grass"
  | "Tile"
  | "Concrete"
  | "Brick"
  | "Stone"
  | "Landscape"
  | "Wood"
  | "Glass"
  | "Metal"
  | "Fabrics";

export interface LibraryTexture {
  id: string;
  name: string;
  category: TextureCategory;
  /** Material description woven into the inpaint prompt. */
  prompt: string;
  /** CSS background used as the thumbnail placeholder. */
  swatch: string;
  /** Optional real thumbnail URL (overrides the swatch when set). */
  thumbnail?: string;
}

export const TEXTURE_CATEGORIES: TextureCategory[] = [
  "Grass",
  "Tile",
  "Concrete",
  "Brick",
  "Stone",
  "Landscape",
  "Wood",
  "Glass",
  "Metal",
  "Fabrics",
];

export const TEXTURE_LIBRARY: LibraryTexture[] = [
  // Grass
  { id: "grass-centipede", name: "Centipede Grass", category: "Grass", prompt: "lush green centipede grass lawn with fine even blades", swatch: "linear-gradient(135deg,#5a8f3c,#7cb342)" },
  { id: "grass-buffalo", name: "Buffalo Grass", category: "Grass", prompt: "soft pale buffalo grass with a slightly silvery green tone", swatch: "linear-gradient(135deg,#7a8f4c,#a7b76b)" },
  { id: "grass-artificial", name: "Artificial Turf", category: "Grass", prompt: "uniform vivid green artificial turf with consistent pile", swatch: "linear-gradient(135deg,#2f7d3f,#49a85a)" },

  // Tile
  { id: "tile-white-ceramic", name: "White Ceramic", category: "Tile", prompt: "glossy white ceramic tiles with thin grout lines", swatch: "linear-gradient(135deg,#f3f5f7,#d9e0e6)" },
  { id: "tile-terracotta", name: "Terracotta", category: "Tile", prompt: "warm terracotta floor tiles with a matte clay finish", swatch: "linear-gradient(135deg,#c1683f,#a9542f)" },
  { id: "tile-mosaic", name: "Mosaic", category: "Tile", prompt: "small mixed-tone mosaic tiles in a fine grid", swatch: "linear-gradient(135deg,#3b7d8c,#7fb0bb)" },

  // Concrete
  { id: "concrete-polished", name: "Polished Concrete", category: "Concrete", prompt: "smooth polished concrete with a soft grey sheen", swatch: "linear-gradient(135deg,#b8bbbe,#94989c)" },
  { id: "concrete-raw", name: "Raw Concrete", category: "Concrete", prompt: "raw board-formed concrete with subtle texture and tone variation", swatch: "linear-gradient(135deg,#9a9d9f,#76787a)" },

  // Brick
  { id: "brick-red", name: "Red Brick", category: "Brick", prompt: "classic red clay brick wall with recessed mortar joints", swatch: "linear-gradient(135deg,#a14233,#7e3326)" },
  { id: "brick-whitewashed", name: "Whitewashed Brick", category: "Brick", prompt: "whitewashed brick wall with exposed texture beneath the paint", swatch: "linear-gradient(135deg,#e8e4df,#cfc8c0)" },

  // Stone
  { id: "stone-slate", name: "Slate", category: "Stone", prompt: "dark grey slate stone cladding with natural cleft texture", swatch: "linear-gradient(135deg,#4a4f55,#2f3338)" },
  { id: "stone-travertine", name: "Travertine", category: "Stone", prompt: "cream travertine stone with soft natural veining", swatch: "linear-gradient(135deg,#e4d8c3,#cdbd9f)" },

  // Landscape
  { id: "landscape-gravel", name: "Gravel", category: "Landscape", prompt: "fine grey landscaping gravel evenly spread", swatch: "linear-gradient(135deg,#a9a59c,#807c73)" },
  { id: "landscape-wood-deck", name: "Wood Deck", category: "Landscape", prompt: "warm timber decking with parallel planks", swatch: "linear-gradient(135deg,#b07c46,#8a5e30)" },

  // Wood
  { id: "wood-oak", name: "Oak", category: "Wood", prompt: "natural oak wood with a warm honey tone and visible grain", swatch: "linear-gradient(135deg,#c99a5b,#a9763c)" },
  { id: "wood-walnut", name: "Walnut", category: "Wood", prompt: "rich dark walnut wood with deep brown grain", swatch: "linear-gradient(135deg,#6b452b,#4a2e1c)" },
  { id: "wood-teak", name: "Teak", category: "Wood", prompt: "golden teak wood with a smooth satin finish", swatch: "linear-gradient(135deg,#b98a4b,#92682f)" },

  // Glass
  { id: "glass-clear", name: "Clear Glass", category: "Glass", prompt: "clear transparent glass with subtle reflections", swatch: "linear-gradient(135deg,#cfe3ea,#a9c9d4)" },
  { id: "glass-frosted", name: "Frosted Glass", category: "Glass", prompt: "frosted translucent glass with a soft diffused surface", swatch: "linear-gradient(135deg,#dfe7ea,#bcc8cd)" },

  // Metal
  { id: "metal-brushed-steel", name: "Brushed Steel", category: "Metal", prompt: "brushed stainless steel with fine directional grain", swatch: "linear-gradient(135deg,#c4c8cc,#9aa0a6)" },
  { id: "metal-black", name: "Matte Black Metal", category: "Metal", prompt: "matte black powder-coated metal with an even finish", swatch: "linear-gradient(135deg,#3a3d40,#222426)" },
  { id: "metal-brass", name: "Brass", category: "Metal", prompt: "warm polished brass with a soft golden reflection", swatch: "linear-gradient(135deg,#c9a96a,#b8902f)" },

  // Fabrics
  { id: "fabric-linen", name: "Linen", category: "Fabrics", prompt: "natural beige linen fabric with a soft woven texture", swatch: "linear-gradient(135deg,#e3dccb,#cabfa6)" },
  { id: "fabric-velvet", name: "Velvet", category: "Fabrics", prompt: "deep teal velvet fabric with a soft plush sheen", swatch: "linear-gradient(135deg,#1f6b6b,#134e4e)" },
];

export function findLibraryTexture(id: string): LibraryTexture | undefined {
  return TEXTURE_LIBRARY.find((t) => t.id === id);
}

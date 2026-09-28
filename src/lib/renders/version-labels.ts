import type { RenderConfig } from "@/domain/types";

type VersionAsset = {
  config: RenderConfig | null;
};

export function renderVersionLabels<T extends VersionAsset>(assets: T[]) {
  let textureEditCount = 0;

  return assets.map((asset, index) => {
    const label =
      index === 0
        ? "Hasil render"
        : asset.config?.editKind === "texture"
          ? `Edit Texture ${++textureEditCount}`
          : `Edit ${index}`;

    return { asset, label };
  });
}

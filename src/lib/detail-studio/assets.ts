import { z } from "zod";

export const studioAssetsSchema = z
  .array(
    z.strictObject({
      imageId: z.string().min(1).max(80),
      url: z.string().refine((value) => {
        if (
          /^\/(studio|car-detail|converted-detail)\/[\w./-]+$/.test(value) &&
          !value.includes("..")
        )
          return true;
        if (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value))
          return true;
        try {
          const url = new URL(value);
          return url.protocol === "https:" && !url.username && !url.password;
        } catch {
          return false;
        }
      }, "이미지는 HTTPS 주소 또는 지원하는 로컬 이미지여야 합니다."),
      width: z.number().int().positive().max(20000),
      height: z.number().int().positive().max(20000),
      alt: z.string().max(1000),
      asset_mode: z.enum([
        "source",
        "source_crop",
        "source_composite",
        "generated_scene",
        "generated_view",
      ]),
      product_generated: z.boolean(),
      fidelity_status: z.enum([
        "VERIFIED",
        "FALLBACK",
        "GENERATED",
        "REJECTED",
      ]),
    }),
  )
  .max(100)
  .refine(
    (assets) =>
      new Set(assets.map((asset) => asset.imageId)).size === assets.length,
    "이미지 ID가 중복되었습니다.",
  );

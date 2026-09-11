import { z } from "zod";

import {
  type ContractNode,
  parseContract,
  type StudioAsset,
} from "./studio-contract";

export const TEST_JSON_MAX_BYTES = 5 * 1024 * 1024;
export function describeTestJsonError(error: unknown): string {
  if (error instanceof z.ZodError) {
    const issues = error.issues.slice(0, 3).map((issue) => {
      const location =
        issue.path.reduce<string>((result, part) => {
          if (typeof part === "number") return `${result}[${part}]`;
          return `${result ? `${result}.` : ""}${String(part).slice(0, 80)}`;
        }, "") || "문서";
      const reason =
        issue.code === "unrecognized_keys"
          ? `지원하지 않는 속성: ${issue.keys
              .slice(0, 5)
              .map((key) => key.slice(0, 80))
              .join(", ")}`
          : "값의 자료형·허용값·범위를 확인해 주세요.";
      return `${location} — ${reason}`;
    });
    return `JSON 규격을 확인해 주세요. ${issues.join(" / ")}${error.issues.length > 3 ? ` (외 ${error.issues.length - 3}건)` : ""}`;
  }
  return error instanceof Error
    ? error.message
    : "JSON을 불러오지 못했습니다. 다시 확인해 주세요.";
}
export const importedAssetsSchema = z
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

// 테스트 UI를 제거할 때 함께 제거할 수 있는 입력 어댑터. 본문 계약은 변경하지 않는다.
export function parseTestJson(
  text: string,
  fallbackAssets: StudioAsset[],
  uploadedAssets: StudioAsset[] = [],
) {
  if (new TextEncoder().encode(text).length > TEST_JSON_MAX_BYTES)
    throw new Error("JSON은 최대 5MB까지 입력할 수 있습니다.");
  let raw: unknown;
  try {
    raw = JSON.parse(text.replace(/^\uFEFF/, ""));
  } catch {
    throw new Error(
      "JSON 문법을 확인해 주세요. 쉼표와 따옴표가 올바른지 확인해 주세요.",
    );
  }
  const wrapped = raw !== null && typeof raw === "object" && "document" in raw;
  const bundle = wrapped
    ? z
        .strictObject({
          document: z.unknown(),
          assets: importedAssetsSchema.optional(),
        })
        .parse(raw)
    : null;
  const baseAssets = importedAssetsSchema.parse(
    bundle?.assets ?? fallbackAssets,
  );
  const overrides = importedAssetsSchema.parse(uploadedAssets);
  // 사용자가 명시적으로 연결한 사진만 같은 ID를 교체한다. 입력별 검증은 병합 전에 유지한다.
  const assets = importedAssetsSchema.parse([
    ...new Map(
      [...baseAssets, ...overrides].map((asset) => [asset.imageId, asset]),
    ).values(),
  ]);
  // 이 테스트 이미지 ID만 보완한다. 실제 응답의 에셋과 사용자 업로드가 우선이다.
  const sample: StudioAsset = {
    imageId: "sample-product",
    url: "/studio/sample-product.png",
    width: 1254,
    height: 1254,
    alt: "나전 보관함",
    asset_mode: "source",
    product_generated: false,
    fidelity_status: "FALLBACK",
  };
  const useSample =
    !bundle?.assets &&
    !assets.some((asset) => asset.imageId === sample.imageId);
  const candidates = useSample ? [...assets, sample] : assets;
  const document = parseContract(bundle ? bundle.document : raw, candidates);
  function referencesSample(node: ContractNode): boolean {
    return (
      node.type === "element" &&
      (node.props?.imageId === sample.imageId ||
        !!node.children?.some(referencesSample))
    );
  }
  return {
    document,
    assets:
      useSample && document.root.some(referencesSample) ? candidates : assets,
  };
}

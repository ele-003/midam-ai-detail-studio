import { z } from "zod";

import { studioAssetsSchema } from "@/lib/detail-studio/assets";
import { draftSchema, parseContract } from "@/lib/detail-studio/contract";

// 프로토타입 MSW 계약이다. BE 생성 API의 확정된 DTO로 간주하지 않는다.
export const studioGenerationRequest = z.strictObject({
  draft: draftSchema,
  assets: studioAssetsSchema.min(1).max(12),
});

const studioGenerationResponse = z
  .object({
    document: z.unknown(),
    assets: studioAssetsSchema.min(1).max(12),
  })
  .passthrough();

export type GenerationScenario = "success" | "error" | "slow";

export function parseGenerationResponse(value: unknown) {
  const response = studioGenerationResponse.parse(value);
  return {
    document: parseContract(response.document, response.assets),
    assets: response.assets,
  };
}

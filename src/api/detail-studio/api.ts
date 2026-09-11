import type { StudioAsset, StudioDraft } from "@/lib/detail-studio/contract";
import { clientFetch } from "@/lib/http/client";

import {
  type GenerationScenario,
  parseGenerationResponse,
  studioGenerationRequest,
} from "./validation";

interface GenerationOptions {
  signal?: AbortSignal;
  scenario?: GenerationScenario;
}

/** MSW 전용 요청. 로그인 토큰·쿠키·401 갱신은 사용하지 않는다. */
export async function generateStudioDraft(
  draft: StudioDraft,
  assets: StudioAsset[],
  { signal, scenario = "success" }: GenerationOptions = {},
) {
  const data = await clientFetch<unknown>(
    "/api/prototype/detail-studio/generations",
    {
      method: "POST",
      auth: false,
      credentials: "omit",
      signal,
      headers: { "X-Studio-Mock-Scenario": scenario },
      body: studioGenerationRequest.parse({ draft, assets }),
    },
  );
  return parseGenerationResponse(data);
}

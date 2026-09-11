import { type DefaultBodyType, delay, http, type PathParams } from "msw";

import { studioGenerationRequest } from "@/api/detail-studio/validation";
import { buildPreview, parseContract } from "@/lib/detail-studio/contract";
import { mockError, mockOk } from "@/mocks/envelope";
import type { ApiErrorResponse, ApiResponse } from "@/types/api";

export const studioHandlers = [
  http.post<
    PathParams,
    DefaultBodyType,
    ApiResponse<unknown> | ApiErrorResponse
  >("*/api/prototype/detail-studio/generations", async ({ request }) => {
    let input;
    try {
      input = studioGenerationRequest.parse(await request.json());
      parseContract(buildPreview(input.draft), input.assets);
    } catch {
      return mockError(
        400,
        "INVALID_INPUT",
        "작품 정보와 이미지 참조를 확인해 주세요.",
      );
    }

    const scenario = request.headers.get("X-Studio-Mock-Scenario");
    await delay(scenario === "slow" ? 8000 : 1800);
    if (scenario === "error") {
      return mockError(
        500,
        "INTERNAL_ERROR",
        "초안 생성 실패를 재현한 목업 응답입니다.",
      );
    }
    return mockOk({
      document: buildPreview(input.draft),
      assets: input.assets,
    });
  }),
];

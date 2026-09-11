import { setupWorker } from "msw/browser";

import { studioHandlers } from "@/api/detail-studio/mock/handlers";
import { publicEnv } from "@/lib/env";

import { handlers } from "./handlers";

// 스튜디오만 테스트할 때 회원·상품의 실제 요청을 목업으로 바꾸지 않는다.
export const worker = setupWorker(
  ...(publicEnv.apiMocking ? handlers : studioHandlers),
);

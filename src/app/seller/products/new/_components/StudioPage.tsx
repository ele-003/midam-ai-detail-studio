"use client";

import { generateStudioDraft } from "@/api/detail-studio/api";
import type { GenerationScenario } from "@/api/detail-studio/validation";
import { ContractStudio } from "@/components/detail-studio/ContractStudio";
import type { StudioAsset, StudioDraft } from "@/lib/detail-studio/contract";
import { prepareStudioMock } from "@/mocks/prepare-studio";

interface StudioPageProps {
  projectId?: string;
  scenario: GenerationScenario;
}

export function StudioPage({ projectId, scenario }: StudioPageProps) {
  async function generate(
    draft: StudioDraft,
    assets: StudioAsset[],
    signal: AbortSignal,
  ) {
    // 이 프로토타입 요청만은 배포 환경에서도 MSW 준비가 끝난 뒤 전송한다.
    // 로그인 부팅이나 전역 목업 플래그를 바꿀 필요가 없다.
    const requestSignal = AbortSignal.any([signal, AbortSignal.timeout(15000)]);
    await prepareStudioMock(requestSignal);
    requestSignal.throwIfAborted();
    return generateStudioDraft(draft, assets, {
      signal: requestSignal,
      scenario,
    });
  }

  return <ContractStudio projectId={projectId} generateDraft={generate} />;
}

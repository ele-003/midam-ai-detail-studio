import type { Metadata } from "next";

import { ContractStudio } from "@/components/detail-studio/ContractStudio";
import { ConvertedPreview } from "@/components/detail-studio/ConvertedPreview";

export const metadata: Metadata = {
  title: "상세페이지 스튜디오 | 장인몰",
  description: "AI 초안을 나만의 상품 상세페이지로 완성하는 판매자 작업실",
};

export default async function ProductDetailStudioPage({
  searchParams,
}: {
  searchParams: Promise<{
    sample?: string;
    project?: string;
    view?: string;
    edit?: string;
    preview?: string;
  }>;
}) {
  const params = await searchParams;
  if (
    params.sample === "car" ||
    params.sample === "metal" ||
    params.edit === "converted" ||
    params.preview === "converted"
  ) {
    const sample = params.sample === "car" ? "car" : "metal";
    return (
      <ConvertedPreview
        key={params.project ?? sample}
        editable
        initialReview={params.view === "product"}
        sample={sample}
        projectId={params.project ?? `sample-${sample}`}
      />
    );
  }
  return (
    <ContractStudio key={params.project ?? "new"} projectId={params.project} />
  );
}

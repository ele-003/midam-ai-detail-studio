import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { parseContract } from "./studio-contract";
import type { StudioAsset } from "./studio-contract";

it("변환한 HTML 문서의 스타일과 이미지 참조를 보존하여 읽는다", () => {
  const doc = JSON.parse(
    readFileSync("public/converted-detail/react_document.json", "utf8"),
  );
  const manifest = JSON.parse(
    readFileSync("public/converted-detail/asset-manifest.json", "utf8"),
  );
  const assets = manifest.map((item: { imageId: string }) => ({
    imageId: item.imageId,
    fidelity_status: "FALLBACK",
  })) as StudioAsset[];
  const parsed = parseContract(doc, assets);
  expect(parsed.root).toHaveLength(14);
  expect(parsed.root[0].props?.style).toMatchObject({
    fontFamily: "sans",
    lineHeight: 1.2,
    letterSpacing: 1.2,
  });
  expect(parsed).toEqual(doc);
});

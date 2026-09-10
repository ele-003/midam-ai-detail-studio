import { describe, expect, it } from "vitest";
import { parseTestJson } from "./test-json-import";
import type { StudioAsset } from "./studio-contract";

const document = {
  schemaVersion: "2.0",
  canvasWidth: 774,
  root: [
    {
      id: "section1",
      type: "element",
      tag: "section",
      children: [
        {
          id: "title",
          type: "element",
          tag: "h2",
          children: [{ id: "text1", type: "text", value: "테스트 작품" }],
        },
      ],
    },
  ],
};
describe("테스트 JSON 가져오기", () => {
  it("직접 올린 이미지를 묶음의 같은 ID보다 우선하고 나머지 에셋은 유지한다", () => {
    const original: StudioAsset = {
      imageId: "sample-product",
      url: "/studio/sample-product.png",
      width: 1254,
      height: 1254,
      alt: "원본",
      asset_mode: "source",
      product_generated: false,
      fidelity_status: "FALLBACK",
    };
    const other = { ...original, imageId: "detail" };
    const uploaded = { ...original, url: "data:image/png;base64,YQ==" };
    const result = parseTestJson(
      JSON.stringify({ document, assets: [original, other] }),
      [],
      [uploaded],
    );
    expect(result.assets).toEqual([uploaded, other]);
    expect(result.document).toEqual(document);
  });
  it("직접 올린 이미지의 URL과 중복 ID도 검증한다", () => {
    const uploaded: StudioAsset = {
      imageId: "sample-product",
      url: "javascript:alert(1)",
      width: 10,
      height: 10,
      alt: "",
      asset_mode: "source",
      product_generated: false,
      fidelity_status: "FALLBACK",
    };
    expect(() =>
      parseTestJson(JSON.stringify(document), [], [uploaded]),
    ).toThrow();
    uploaded.url = "/studio/sample-product.png";
    expect(() =>
      parseTestJson(JSON.stringify(document), [], [uploaded, uploaded]),
    ).toThrow();
  });
  it("문서 단독과 문서·에셋 묶음을 읽는다", () => {
    expect(parseTestJson(JSON.stringify(document), []).document).toEqual(
      document,
    );
    expect(
      parseTestJson(JSON.stringify({ document, assets: [] }), []).document,
    ).toEqual(document);
  });
  it("문법 오류, 금지 태그, 알 수 없는 이미지 참조를 거절한다", () => {
    expect(() => parseTestJson("{", [])).toThrow();
    expect(() =>
      parseTestJson(JSON.stringify(document).replace('"h2"', '"script"'), []),
    ).toThrow();
    const imageDoc = {
      ...document,
      root: [
        {
          id: "s",
          type: "element",
          tag: "section",
          children: [
            {
              id: "image",
              type: "element",
              tag: "img",
              props: { imageId: "missing" },
            },
          ],
        },
      ],
    };
    expect(() => parseTestJson(JSON.stringify(imageDoc), [])).toThrow();
  });
  it("위험한 이미지 URL과 중복 에셋 ID를 거절한다", () => {
    const asset = {
      imageId: "a",
      url: "javascript:alert(1)",
      width: 10,
      height: 10,
      alt: "",
      asset_mode: "source",
      product_generated: false,
      fidelity_status: "FALLBACK",
    };
    expect(() =>
      parseTestJson(JSON.stringify({ document, assets: [asset] }), []),
    ).toThrow();
    asset.url = "https://example.com/image.png";
    expect(() =>
      parseTestJson(JSON.stringify({ document, assets: [asset, asset] }), []),
    ).toThrow();
  });
});

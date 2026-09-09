import { expect, it } from "vitest";
import { parseContract } from "./studio-contract";
const doc = (props: unknown, children: unknown[] = []) => ({
  schemaVersion: "2.0",
  canvasWidth: 774,
  root: [{ id: "s", type: "element", tag: "section", props, children }],
});
it("AI 스타일과 빈 marks, stack wrap을 지원한다", () => {
  expect(() =>
    parseContract(
      doc(
        {
          variant: "custom-craft",
          layout: { display: "stack", wrap: false },
          style: {
            color: "#fff",
            fontWeight: 800,
            gradient: {
              type: "linear",
              angle: 90,
              stops: [
                { color: "#ffffff", position: 0 },
                { color: "#000000", position: 100 },
              ],
            },
            boxShadow: { x: 0, y: 4, blur: 12, spread: 0, color: "#00000044" },
            rotate: 2,
          },
        },
        [{ id: "t", type: "text", value: "작품", marks: [] }],
      ),
      [],
    ),
  ).not.toThrow();
});
it("빈 이미지 children만 정규화하고 실행 가능한 속성은 거절한다", () => {
  const image = {
    id: "im",
    type: "element",
    tag: "img",
    props: { imageId: "a" },
    children: [],
  };
  const assets = [
    {
      imageId: "a",
      url: "/studio/asset-1.png",
      width: 1,
      height: 1,
      alt: "",
      asset_mode: "source" as const,
      product_generated: false,
      fidelity_status: "FALLBACK" as const,
    },
  ];
  expect(
    parseContract(doc({}, [image]), assets).root[0].children?.[0],
  ).not.toHaveProperty("children");
  expect(() => parseContract(doc({ onClick: "alert(1)" }), [])).toThrow();
  expect(() =>
    parseContract(
      doc({ style: { backgroundColor: "url(https://example.com)" } }),
      [],
    ),
  ).toThrow();
});

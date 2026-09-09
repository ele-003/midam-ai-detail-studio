import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { changeColor, changeText, findNode, moveElement } from "./inline-edit";
import { parseContract, type StudioAsset } from "./studio-contract";
const assets = [
  { imageId: "hero", fidelity_status: "FALLBACK" },
] as StudioAsset[];
const document = parseContract(
  JSON.parse(readFileSync("public/car-detail/react_document.json", "utf8")),
  assets,
);
describe("inline AST editing", () => {
  it("moves an image before text in its section without losing content or style", () => {
    const children = document.root[0].children!;
    const result = moveElement(document, children[3].id, children[0].id);
    expect(result.root[0].children?.[0]).toEqual(children[3]);
    expect(result.root[0].children).toHaveLength(children.length);
    expect(parseContract(result, assets)).toEqual(result);
    expect(document.root[0].children).toEqual(children);
  });
  it("rejects cross-section and cyclic moves", () => {
    expect(() =>
      moveElement(
        document,
        document.root[0].children![0].id,
        document.root[1].children![0].id,
      ),
    ).toThrow();
    const image = document.root[0].children![3];
    if (image.type !== "element") throw new Error();
    expect(() =>
      moveElement(document, image.id, image.children![0].id),
    ).toThrow();
  });
  it("changes only text values and allowed color props", () => {
    const heading = document.root[0].children![1];
    if (heading.type !== "element") throw new Error();
    const result = changeColor(
      changeText(document, heading.children![0].id, "한글 입력\n다음 줄"),
      heading.id,
      "#b42318",
    );
    expect(findNode(result.root[0], heading.children![0].id)).toMatchObject({
      value: "한글 입력\n다음 줄",
    });
    expect(findNode(result.root[0], heading.id)).toMatchObject({
      props: { style: { ...heading.props?.style, color: "#b42318" } },
    });
    expect(parseContract(result, assets)).toEqual(result);
    expect(() => changeColor(document, heading.id, "url(script)")).toThrow();
  });
});

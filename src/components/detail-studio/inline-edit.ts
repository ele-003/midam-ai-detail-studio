import type { ContractDocument, ContractNode } from "./studio-contract";

export function findNode(
  node: ContractNode,
  id: string,
): ContractNode | undefined {
  if (node.id === id) return node;
  if (node.type === "element") {
    for (const child of node.children ?? []) {
      const found = findNode(child, id);
      if (found) return found;
    }
  }
}
export function updateNode(
  node: ContractNode,
  id: string,
  patch: (node: ContractNode) => ContractNode,
): ContractNode {
  if (node.id === id) return patch(node);
  return node.type === "text" || !node.children
    ? node
    : {
        ...node,
        children: node.children.map((child) => updateNode(child, id, patch)),
      };
}
export function changeText(
  document: ContractDocument,
  id: string,
  value: string,
): ContractDocument {
  return {
    ...document,
    root: document.root.map((section) =>
      updateNode(section, id, (node) =>
        node.type === "text" ? { ...node, value } : node,
      ),
    ) as ContractDocument["root"],
  };
}
export function changeColor(
  document: ContractDocument,
  id: string,
  color: string,
): ContractDocument {
  if (!/^#[0-9a-f]{6}$/i.test(color)) throw new Error("Invalid color");
  return {
    ...document,
    root: document.root.map((section) =>
      updateNode(section, id, (node) =>
        node.type === "element"
          ? {
              ...node,
              props: { ...node.props, style: { ...node.props?.style, color } },
            }
          : node,
      ),
    ) as ContractDocument["root"],
  };
}
export function siblings(
  node: ContractNode,
  id: string,
): ContractNode[] | undefined {
  if (node.type === "text") return;
  if (node.children?.some((child) => child.id === id)) return node.children;
  for (const child of node.children ?? []) {
    const found = siblings(child, id);
    if (found) return found;
  }
}
// Move the complete element (including its image reference/style) without inventing coordinates.
export function moveElement(
  document: ContractDocument,
  sourceId: string,
  targetId: string,
  after = false,
): ContractDocument {
  const section = document.root.find((item) => findNode(item, sourceId));
  if (
    !section ||
    section.id === sourceId ||
    section.id === targetId ||
    sourceId === targetId
  )
    throw new Error("Choose a different element");
  const source = findNode(section, sourceId);
  const target = findNode(section, targetId);
  if (
    !source ||
    !target ||
    source.type !== "element" ||
    target.type !== "element" ||
    findNode(source, targetId)
  )
    throw new Error("Move only within the same section");
  function remove(node: ContractNode): ContractNode {
    return node.type === "text" || !node.children
      ? node
      : {
          ...node,
          children: node.children
            .filter((child) => child.id !== sourceId)
            .map(remove),
        };
  }
  function insert(node: ContractNode): ContractNode {
    if (node.type === "text" || !node.children) return node;
    return {
      ...node,
      children: node.children.flatMap((child) =>
        child.id === targetId
          ? after
            ? [child, source!]
            : [source!, child]
          : [insert(child)],
      ),
    };
  }
  return {
    ...document,
    root: document.root.map((item) =>
      item.id === section.id ? insert(remove(item)) : item,
    ) as ContractDocument["root"],
  };
}

"use client";
import { StudioHeader } from "@/components/detail-studio/StudioHeader";

import Link from "next/link";
import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Toast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createElement, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { parseContract } from "./studio-contract";
import type {
  ContractDocument,
  ContractNode,
  StudioAsset,
  StudioDraft,
} from "./studio-contract";
import "./converted-preview.css";
import "./contract-studio.css";
import { Button } from "@/components/ui/button";
import { InlineText } from "./InlineText";
import { ProductDetailView } from "./ProductDetailView";
import {
  changeText,
  changeColor,
  findNode,
  moveElement,
  siblings,
} from "./inline-edit";
import "./inline-editor.css";

interface ManifestEntry {
  imageId: string;
  alt: string;
  variants: { url: string; width: number; height: number; format: string }[];
}
const registry = {
  section: "section",
  article: "article",
  div: "div",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  p: "p",
  span: "span",
  strong: "strong",
  em: "em",
  ul: "ul",
  ol: "ol",
  li: "li",
  figure: "figure",
  figcaption: "figcaption",
  img: "img",
  table: "table",
  caption: "caption",
  thead: "thead",
  tbody: "tbody",
  tr: "tr",
  th: "th",
  td: "td",
} as const;

import { StudioSteps } from "./StudioSteps";
import { readProject, saveProject } from "./studio-projects";
function textFields(
  node: ContractNode,
  parent = "",
): { id: string; value: string; parent: string }[] {
  return node.type === "text"
    ? [{ id: node.id, value: node.value, parent }]
    : (node.children ?? []).flatMap((child) => textFields(child, node.tag));
}
function sectionTitle(node: ContractNode, index: number) {
  return (
    textFields(node).find((field) => ["h2", "h3", "h4"].includes(field.parent))
      ?.value ??
    (index === 0
      ? "페이지 머리말"
      : index === 13
        ? "페이지 맺음말"
        : `섹션 ${index + 1}`)
  );
}
export function ConvertedPreview({
  editable = false,
  sample = "metal",
  projectId = "sample-metal",
  inputData,
  initialReview = false,
}: {
  editable?: boolean;
  sample?: "metal" | "car";
  projectId?: string;
  inputData?: {
    document: ContractDocument;
    assets: StudioAsset[];
    draft: StudioDraft;
  };
  initialReview?: boolean;
}) {
  const router = useRouter();
  const [published, setPublished] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  useEffect(() => {
    if (!savedToast) return;
    const timer = setTimeout(() => setSavedToast(false), 3000);
    return () => clearTimeout(timer);
  }, [savedToast]);
  const [input] = useState(inputData);
  const basePath = sample === "car" ? "/car-detail" : "/converted-detail";
  const title =
    input?.draft.product_name ??
    (sample === "car" ? "블랙 SUV" : "메탈 티웨어 오브제 세트");
  const [data, setData] = useState<{
    document: ContractDocument;
    assets: StudioAsset[];
  } | null>(null);
  const [error, setError] = useState("");
  const [mobile, setMobile] = useState(false);
  const [selected, setSelected] = useState("");
  const [selectedBlock, setSelectedBlock] = useState("");
  const [dragging, setDragging] = useState("");
  const [dropTarget, setDropTarget] = useState("");
  const [colorMenu, setColorMenu] = useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);
  const [customColor, setCustomColor] = useState("#121b29");
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!colorMenu) return;
    menuRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const close = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setColorMenu(null);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setColorMenu(null);
    };
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", escape);
    const closeOnResize = () => setColorMenu(null);
    window.addEventListener("resize", closeOnResize);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", escape);
      window.removeEventListener("resize", closeOnResize);
    };
  }, [colorMenu]);
  const [pendingText, setPendingText] = useState(false);
  const [past, setPast] = useState<ContractDocument[]>([]);
  const [future, setFuture] = useState<ContractDocument[]>([]);
  const [savedJson, setSavedJson] = useState("");
  const [saveStatus, setSaveStatus] = useState("아직 저장하지 않음");
  const [review, setReview] = useState(initialReview);
  const host = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLElement>(null);
  const [size, setSize] = useState({ width: 774, height: 1000 });
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        let document: unknown = input?.document;
        let assets: StudioAsset[] = input?.assets ?? [];
        if (!input) {
          const [documentResponse, manifestResponse] = await Promise.all([
            fetch(`${basePath}/react_document.json`, {
              signal: controller.signal,
            }),
            fetch(`${basePath}/asset-manifest.json`, {
              signal: controller.signal,
            }),
          ]);
          if (!documentResponse.ok || !manifestResponse.ok) throw new Error();
          document = await documentResponse.json();
          const manifest: ManifestEntry[] = await manifestResponse.json();
          assets = manifest.map((entry) => {
            const variant =
              entry.variants.find((v) => v.width === 1280) ??
              entry.variants.at(-1)!;
            if (!/^images\/(?:image-\d+|car)-\d+\.webp$/.test(variant.url))
              throw new Error();
            return {
              imageId: entry.imageId,
              url: `${basePath}/${variant.url}`,
              width: variant.width,
              height: variant.height,
              alt: entry.alt,
              asset_mode: "source",
              product_generated: false,
              fidelity_status: "FALLBACK",
            };
          });
        }
        let parsed = parseContract(document, assets);
        if (editable) {
          try {
            const saved = readProject(projectId);
            if (saved) {
              if (saved.kind !== (input ? "input" : sample)) throw new Error();
              const payload = input
                ? ((saved.payload as { document?: unknown }).document ??
                  input.document)
                : saved.payload;
              parsed = parseContract(payload, assets);
              setReview(
                initialReview ||
                  saved.status === "result" ||
                  saved.status === "published",
              );
              setPublished(saved.status === "published");
              setSavedJson(JSON.stringify(parsed));
              setSaveStatus("이 브라우저에 저장됨");
            }
          } catch {
            setError(
              "저장된 작업을 읽지 못해 예시 초안을 열었습니다. 기존 저장 내용은 유지됩니다.",
            );
          }
        }
        if (!controller.signal.aborted) {
          setData({ document: parsed, assets });
          setSelected(parsed.root[1]?.id ?? parsed.root[0].id);
        }
      } catch {
        if (!controller.signal.aborted)
          setError(
            "상세페이지 또는 이미지를 읽지 못했습니다. 페이지를 새로고침해 주세요.",
          );
      }
    }
    void load();
    return () => controller.abort();
  }, [editable, basePath, projectId, sample, input, initialReview]);
  const dirty =
    pendingText ||
    (!!data &&
      (savedJson === ""
        ? past.length > 0
        : JSON.stringify(data.document) !== savedJson));
  useEffect(() => {
    if (!editable || !data || (!dirty && saveStatus !== "아직 저장하지 않음"))
      return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [editable, dirty, data, saveStatus]);
  function edit(next: ContractDocument) {
    if (!data) return false;
    try {
      const validated = parseContract(next, data.assets);
      setPast((history) => [...history.slice(-29), data.document]);
      setFuture([]);
      setData({ ...data, document: validated });
      setError("");
      setSaveStatus("미저장 변경사항");
      return true;
    } catch {
      setError(
        "문서 제한을 초과해 변경하지 않았습니다. 기존 내용을 유지합니다.",
      );
      return false;
    }
  }
  function save(status: "draft" | "result" | "published" = "draft") {
    if (!data) return false;
    try {
      const value = JSON.stringify(parseContract(data.document, data.assets));
      saveProject({
        id: projectId,
        kind: input ? "input" : sample,
        title,
        status,
        thumbnail: data.assets[0]?.url ?? "",
        updatedAt: new Date().toISOString(),
        payload: input
          ? {
              draft: input.draft,
              assets: data.assets,
              document: JSON.parse(value),
            }
          : JSON.parse(value),
      });
      setSavedJson(value);
      setSaveStatus("이 브라우저에 저장됨");
      setError("");
      return true;
    } catch {
      setError(
        "저장하지 못했습니다. 브라우저 저장 공간을 확인해 주세요. 편집 내용은 유지됩니다.",
      );
      return false;
    }
  }
  useEffect(() => {
    if (!data) return;
    const observer = new ResizeObserver(() => {
      if (host.current && sheet.current)
        setSize({
          width: host.current.clientWidth,
          height: sheet.current.scrollHeight,
        });
    });
    if (host.current) observer.observe(host.current);
    if (sheet.current) observer.observe(sheet.current);
    return () => observer.disconnect();
  }, [data, review]);
  function move(source: string, target: string, after = false) {
    if (!data) return;
    try {
      edit(
        parseContract(
          moveElement(data.document, source, target, after),
          data.assets,
        ),
      );
    } catch {
      setError(
        "같은 섹션 안의 다른 텍스트나 이미지 앞뒤로 이동해 주세요. 이 위치에는 놓을 수 없습니다.",
      );
    }
    setDragging("");
    setDropTarget("");
  }
  function render(
    node: ContractNode,
    parentId = "",
    sectionId = "",
  ): React.ReactNode {
    if (node.type === "text") {
      const text =
        !editable || review ? (
          node.value
        ) : (
          <InlineText
            key={node.id}
            id={node.id}
            value={node.value}
            onPending={setPendingText}
            onCommit={(value) =>
              data ? edit(changeText(data.document, node.id, value)) : false
            }
            onColor={(event) => {
              event.preventDefault();
              event.stopPropagation();
              const rect = event.currentTarget.getBoundingClientRect();
              event.currentTarget.blur();
              setColorMenu({
                id: parentId,
                x: Math.max(
                  8,
                  Math.min(
                    "clientX" in event ? event.clientX : rect.left,
                    window.innerWidth - 250,
                  ),
                ),
                y: Math.max(
                  8,
                  Math.min(
                    "clientY" in event ? event.clientY : rect.bottom,
                    window.innerHeight - 260,
                  ),
                ),
              });
            }}
          />
        );
      return node.marks?.length ? (
        <span
          key={node.id}
          style={{
            fontWeight: node.marks.some((m) => m.type === "bold")
              ? 700
              : undefined,
            fontStyle: node.marks.some((m) => m.type === "italic")
              ? "italic"
              : undefined,
            textDecoration: node.marks.some((m) => m.type === "underline")
              ? "underline"
              : undefined,
          }}
        >
          {text}
        </span>
      ) : (
        text
      );
    }
    const currentSection = node.tag === "section" ? node.id : sectionId;
    const movable =
      editable &&
      !review &&
      [
        "h2",
        "h3",
        "h4",
        "p",
        "figure",
        "div",
        "article",
        "ul",
        "ol",
        "li",
      ].includes(node.tag);
    const interaction = movable
      ? {
          className: `ie-block ${selectedBlock === node.id ? "ie-selected" : ""} ${dropTarget === node.id ? "ie-drop" : ""}`,
          "data-movable-id": node.id,
          onClick: (event: React.MouseEvent<HTMLElement>) => {
            event.stopPropagation();
            setSelectedBlock(node.id);
            setSelected(currentSection);
          },
          onDragOver: (event: React.DragEvent<HTMLElement>) => {
            if (!dragging) return;
            event.preventDefault();
            event.stopPropagation();
            event.dataTransfer.dropEffect = "move";
            setDropTarget(node.id);
          },
          onDrop: (event: React.DragEvent<HTMLElement>) => {
            event.preventDefault();
            event.stopPropagation();
            const rect = event.currentTarget.getBoundingClientRect();
            if (dragging)
              move(
                dragging,
                node.id,
                event.clientY > rect.top + rect.height / 2,
              );
          },
        }
      : {};

    const safe = node.props?.style;
    const { gradient, boxShadow, rotate, ...baseStyle } = safe ?? {};
    const variants: Record<string, CSSProperties> = {
      dark: { backgroundColor: "#242424", color: "#F7F4EE" },
      light: { backgroundColor: "#F7F7F5", color: "#222222" },
      sand: { backgroundColor: "#EEE5D8", color: "#222222" },
    };
    const style: CSSProperties = {
      ...(variants[node.props?.variant ?? ""] ?? {}),
      ...baseStyle,
      backgroundImage: gradient
        ? `linear-gradient(${gradient.angle}deg, ${gradient.stops.map((stop) => `${stop.color} ${stop.position}%`).join(", ")})`
        : undefined,
      boxShadow: boxShadow
        ? `${boxShadow.x}px ${boxShadow.y}px ${boxShadow.blur}px ${boxShadow.spread}px ${boxShadow.color}`
        : undefined,
      transform: rotate !== undefined ? `rotate(${rotate}deg)` : undefined,
      fontFamily: safe?.fontFamily
        ? safe.fontFamily === "serif"
          ? "Georgia, var(--font-pretendard), serif"
          : "var(--font-pretendard), sans-serif"
        : undefined,
      padding: safe?.padding
        ? `${safe.padding.top}px ${safe.padding.right}px ${safe.padding.bottom}px ${safe.padding.left}px`
        : undefined,
      margin: safe?.margin
        ? `${safe.margin.top}px ${safe.margin.right}px ${safe.margin.bottom}px ${safe.margin.left}px`
        : undefined,
      objectPosition: safe?.objectPosition
        ? `${safe.objectPosition.x}% ${safe.objectPosition.y}%`
        : undefined,
      borderStyle: safe?.borderWidth ? "solid" : undefined,
    };
    // 표와 셀은 HTML의 열 정렬을 유지한다. 셀 안의 복합 배치는 자식 div에서 처리한다.
    const layout = [
      "table",
      "caption",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
    ].includes(node.tag)
      ? undefined
      : node.props?.layout;
    if (layout?.display === "grid")
      Object.assign(style, {
        display: "grid",
        gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`,
        gap: layout.gap,
        alignItems: layout.align,
      });
    if (layout?.display === "flex" || layout?.display === "stack")
      Object.assign(style, {
        display: "flex",
        flexDirection: layout.display === "stack" ? "column" : layout.direction,
        gap: layout.gap,
        alignItems: layout.align,
        flexWrap: layout.display === "flex" && layout.wrap ? "wrap" : "nowrap",
      });
    if (node.tag === "img") {
      const asset = data!.assets.find(
        (item) => item.imageId === node.props?.imageId,
      )!;
      return (
        <Image
          key={node.id}
          data-node-id={node.id}
          src={asset.url}
          width={asset.width}
          height={asset.height}
          alt={node.props?.alt ?? asset.alt}
          style={style}
          unoptimized
        />
      );
    }
    return createElement(
      registry[node.tag],
      {
        key: node.id,
        "data-node-id": node.id,
        style,
        scope: node.props?.scope,
        colSpan: node.props?.colSpan,
        rowSpan: node.props?.rowSpan,
        ...interaction,
      },
      node.children?.map((child) => render(child, node.id, currentSection)),
    );
  }
  const scale = data ? Math.min(1, size.width / data.document.canvasWidth) : 1;
  const canvas = data && (
    <div className={`cv-host ${mobile ? "cv-mobile" : ""}`} ref={host}>
      <div style={{ height: size.height * scale }}>
        <article
          aria-label="작품 상세페이지"
          ref={sheet}
          className="cv-document"
          style={{
            width: data.document.canvasWidth,
            transform: `scale(${scale})`,
          }}
        >
          {data.document.root.map((node) => render(node))}
        </article>
      </div>
    </div>
  );
  if (review && data)
    return (
      <ProductDetailView
        title={title}
        summary={
          data.document.root
            .flatMap((node) => textFields(node))
            .find((field) => field.parent === "p" && field.value.length > 30)
            ?.value ?? ""
        }
        assets={data.assets}
        detail={canvas}
        published={published}
        error={error}
        onEdit={() => {
          if (save("draft")) {
            setPublished(false);
            setReview(false);
          }
        }}
        onPublish={() => {
          if (save("published")) {
            setPublished(true);
            router.push("/");
          }
        }}
      />
    );
  if (editable) {
    const section =
      data?.document.root.find((node) => node.id === selected) ??
      data?.document.root[0];
    const selectedNode = section && findNode(section, selectedBlock);
    const peers = section
      ? (siblings(section, selectedBlock) ?? []).filter(
          (node) => node.type === "element",
        )
      : [];
    const blockIndex = peers.findIndex((node) => node.id === selectedBlock);
    const index =
      data?.document.root.findIndex((node) => node.id === section?.id) ?? 0;
    return (
      <main
        className="cs-shell cv-editor"
        onClickCapture={(event) => {
          if (
            (event.target as HTMLElement).closest('a[href="/"]') &&
            dirty &&
            !save(review ? "result" : "draft")
          ) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
      >
        <StudioHeader />
        <div className="cs-body">
          <div className="cs-breadcrumb">
            <Breadcrumb>
              <BreadcrumbItem href="/">홈</BreadcrumbItem>
              <BreadcrumbItem current>초안 확인 · 편집</BreadcrumbItem>
            </Breadcrumb>
          </div>
          <div className="cs-page-title">
            <div>
              <span className="cs-overline">AI DETAIL PAGE STUDIO</span>
              <h1>
                {review
                  ? "작품의 이야기가 준비되었어요."
                  : "작품의 이야기에 나의 손길을 더해요."}
              </h1>
              <p>{title} · 문구와 구성을 다듬어 작품의 이야기를 완성하세요.</p>
            </div>
          </div>
          <StudioSteps current={review ? 3 : 2} />
          {error && (
            <div className="cs-error" role="alert">
              {error}
            </div>
          )}
          {!data && !error && <p role="status">초안을 불러오고 있어요…</p>}
          {data && (
            <>
              <div className="cs-editor-top">
                <div>
                  <strong>{title}</strong>
                  <Badge variant="jade" className="cs-save-state" role="status">
                    {saveStatus}
                  </Badge>
                </div>
                <div className="cs-action-group">
                  {!review && (
                    <>
                      <Button
                        size="s"
                        variant="ghost"
                        aria-label="실행 취소"
                        disabled={!past.length}
                        onClick={() => {
                          setFuture([data.document, ...future]);
                          setData({ ...data, document: past.at(-1)! });
                          setPast(past.slice(0, -1));
                          setSaveStatus("미저장 변경사항");
                        }}
                      >
                        ↶
                      </Button>
                      <Button
                        size="s"
                        variant="ghost"
                        aria-label="다시 실행"
                        disabled={!future.length}
                        onClick={() => {
                          setPast([...past, data.document]);
                          setData({ ...data, document: future[0] });
                          setFuture(future.slice(1));
                          setSaveStatus("미저장 변경사항");
                        }}
                      >
                        ↷
                      </Button>
                      <Button
                        size="s"
                        className="cs-button"
                        variant="outline"
                        onClick={() => {
                          if (save()) setSavedToast(true);
                        }}
                      >
                        초안 저장
                      </Button>
                    </>
                  )}
                  <Button
                    size="s"
                    className="cs-button cs-primary"
                    onClick={() => {
                      if (save(review ? "draft" : "result")) {
                        setPublished(false);
                        setReview(!review);
                      }
                    }}
                  >
                    {published
                      ? "게시 내리고 편집"
                      : review
                        ? "편집으로 돌아가기"
                        : "최종 검토하기"}
                  </Button>
                </div>
              </div>
              <div
                className={`cs-editor-grid ${review ? "cv-review-grid" : "ie-edit-grid"}`}
              >
                {!review && (
                  <aside className="cs-sections">
                    <div className="cs-panel-heading">
                      <h2>페이지 구성</h2>
                      <span>{data.document.root.length}개 섹션</span>
                    </div>
                    <div className="cs-section-list">
                      {data.document.root.map((node, position) => (
                        <button
                          type="button"
                          key={node.id}
                          aria-pressed={section?.id === node.id}
                          onClick={() => {
                            setSelected(node.id);
                            setSelectedBlock("");
                            const element =
                              sheet.current?.querySelector<HTMLElement>(
                                `[data-node-id="${node.id}"]`,
                              );
                            const scroll =
                              host.current?.closest(".cs-canvas-scroll");
                            if (element && scroll)
                              scroll.scrollTo({
                                top: element.offsetTop * scale,
                                behavior: "smooth",
                              });
                          }}
                        >
                          <span>
                            <small>
                              {String(position + 1).padStart(2, "0")}
                            </small>
                            <strong>{sectionTitle(node, position)}</strong>
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="cs-order">
                      {[-1, 1].map((delta) => (
                        <Button
                          size="s"
                          key={delta}
                          variant="outline"
                          disabled={
                            index + delta < 0 ||
                            index + delta >= data.document.root.length
                          }
                          onClick={() => {
                            const root = [...data.document.root];
                            [root[index], root[index + delta]] = [
                              root[index + delta],
                              root[index],
                            ];
                            edit({ ...data.document, root });
                          }}
                        >
                          {delta < 0 ? "위로 이동 ↑" : "아래로 이동 ↓"}
                        </Button>
                      ))}
                    </div>
                  </aside>
                )}
                <section className="cs-canvas-area">
                  <div className="cs-canvas-controls">
                    <span>상세페이지 미리보기</span>
                    <div className="cs-device-toggle">
                      <Button
                        size="xs"
                        variant={!mobile ? "solid" : "ghost"}
                        aria-pressed={!mobile}
                        onClick={() => setMobile(false)}
                      >
                        PC
                      </Button>
                      <Button
                        size="xs"
                        variant={mobile ? "solid" : "ghost"}
                        aria-pressed={mobile}
                        onClick={() => setMobile(true)}
                      >
                        모바일
                      </Button>
                    </div>
                    <small>774px 기준 축소</small>
                  </div>
                  {!review && (
                    <div className="ie-tools">
                      <span>
                        {selectedNode?.type === "element"
                          ? selectedNode.tag === "figure"
                            ? "이미지 선택됨"
                            : "요소 선택됨"
                          : "텍스트나 이미지를 클릭하세요"}
                      </span>
                      <Button
                        size="xs"
                        variant="outline"
                        type="button"
                        draggable={!!selectedNode}
                        disabled={!selectedNode}
                        onDragStart={(event) => {
                          setDragging(selectedBlock);
                          event.dataTransfer.setData(
                            "text/plain",
                            selectedBlock,
                          );
                          event.dataTransfer.effectAllowed = "move";
                        }}
                        onDragEnd={() => {
                          setDragging("");
                          setDropTarget("");
                        }}
                        aria-label="선택한 요소 이동"
                        title="이 핸들을 끌어 같은 섹션의 다른 요소 앞뒤에 놓으세요"
                      >
                        ⠿ 끌어서 이동
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        disabled={blockIndex <= 0}
                        onClick={() =>
                          move(selectedBlock, peers[blockIndex - 1].id)
                        }
                      >
                        앞으로 이동 ↑
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        disabled={
                          blockIndex < 0 || blockIndex === peers.length - 1
                        }
                        onClick={() =>
                          move(selectedBlock, peers[blockIndex + 1].id, true)
                        }
                      >
                        뒤로 이동 ↓
                      </Button>
                      <small>텍스트 클릭 → 직접 입력 · 우클릭 → 글자색</small>
                    </div>
                  )}
                  <div
                    className="cs-canvas-scroll"
                    onScroll={() => setColorMenu(null)}
                  >
                    {canvas}
                  </div>
                </section>
                {review && (
                  <aside className="cs-properties">
                    <div className="cs-panel-heading">
                      <h2>최종 결과 확인</h2>
                    </div>
                    <div className="cs-properties-body">
                      <p className="cs-field-tip">
                        {published
                          ? "게시 중인 상세페이지입니다. 홈의 게시 중 목록에서 확인할 수 있습니다."
                          : "완성한 상세페이지를 게시하면 홈의 게시 중 목록에 표시됩니다."}
                        현재는 이 브라우저에서만 게시 상태가 저장됩니다.
                      </p>
                      <Button
                        size="s"
                        className="cs-button cs-primary"
                        disabled={published}
                        onClick={() => {
                          if (save("published")) {
                            setPublished(true);
                            router.push("/");
                          }
                        }}
                      >
                        {published ? "게시 중" : "상품에 게시하기"}
                      </Button>
                      <Link className="cs-button" href="/">
                        나의 작업실로 돌아가기
                      </Link>
                    </div>
                  </aside>
                )}
              </div>
              <div className="cs-editor-foot">
                <span>
                  {data.document.root.length}개 섹션 · 작품의 문구와 구성
                </span>
                <span>현재 브라우저에 저장됩니다.</span>
              </div>
            </>
          )}
        </div>
        {savedToast && (
          <div className="cs-toast">
            <Toast actionLabel="닫기" onAction={() => setSavedToast(false)}>
              초안을 저장했어요.
            </Toast>
          </div>
        )}
        {colorMenu && !review && (
          <div
            ref={menuRef}
            role="dialog"
            aria-label="글자색 변경"
            className="ie-color-menu"
            style={{ left: colorMenu.x, top: colorMenu.y }}
          >
            <div>
              <strong>글자색</strong>
              <button
                aria-label="글자색 메뉴 닫기"
                onClick={() => setColorMenu(null)}
              >
                ×
              </button>
            </div>
            <div className="ie-swatches">
              {[
                ["#121b29", "검정"],
                ["#ffffff", "흰색"],
                ["#b42318", "빨강"],
                ["#175cd3", "파랑"],
                ["#067647", "초록"],
                ["#9333ea", "보라"],
              ].map(([color, name]) => (
                <button
                  key={color}
                  aria-label={name}
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    if (data)
                      edit(changeColor(data.document, colorMenu.id, color));
                    setColorMenu(null);
                  }}
                />
              ))}
            </div>
            <label>
              직접 선택{" "}
              <input
                type="color"
                aria-label="사용자 지정 글자색"
                value={customColor}
                onChange={(event) => setCustomColor(event.target.value)}
              />
            </label>
            <Button
              size="s"
              className="ie-apply"
              onClick={() => {
                if (data)
                  edit(changeColor(data.document, colorMenu.id, customColor));
                setColorMenu(null);
              }}
            >
              선택한 색상 적용
            </Button>
          </div>
        )}
      </main>
    );
  }
  return null;
}

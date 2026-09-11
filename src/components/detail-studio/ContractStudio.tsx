"use client";
import "./contract-studio.css";

import { useRouter } from "next/navigation";
import { useEffect, useReducer, useRef, useState } from "react";

import { StudioHeader } from "@/components/detail-studio/StudioHeader";
import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";

import { ConvertedPreview } from "./ConvertedPreview";
import type { ContractDocument } from "./studio-contract";
import type { StudioAsset, StudioDraft } from "./studio-contract";
import { buildPreview, draftSchema, parseContract } from "./studio-contract";
import { exampleAssets, exampleDraft } from "./studio-fixture";
import { readProject, saveProject } from "./studio-projects";
import { StudioInput } from "./StudioInput";
import { StudioSteps } from "./StudioSteps";
import { importedAssetsSchema } from "./test-json-import";
interface State {
  draft: StudioDraft;
  past: StudioDraft[];
  future: StudioDraft[];
}
type Action =
  { type: "edit" | "load"; draft: StudioDraft } | { type: "undo" | "redo" };
function reducer(state: State, action: Action): State {
  if (action.type === "load")
    return { draft: action.draft, past: [], future: [] };
  if (action.type === "edit")
    return {
      draft: action.draft,
      past: [...state.past.slice(-29), state.draft],
      future: [],
    };
  if (action.type === "undo" && state.past.length)
    return {
      draft: state.past.at(-1)!,
      past: state.past.slice(0, -1),
      future: [state.draft, ...state.future],
    };
  if (action.type === "redo" && state.future.length)
    return {
      draft: state.future[0],
      past: [...state.past, state.draft],
      future: state.future.slice(1),
    };
  return state;
}
export function ContractStudio({ projectId }: { projectId?: string }) {
  const [activeId, setActiveId] = useState(projectId ?? "");
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, {
    draft: exampleDraft,
    past: [],
    future: [],
  });
  const [restoredDocument, setRestoredDocument] =
    useState<ContractDocument | null>(null);
  const [assets, setAssets] = useState<StudioAsset[]>(exampleAssets);
  const [snapshot, setSnapshot] = useState(exampleDraft);
  const [step, setStep] = useState<"input" | "editing" | "result">("input");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState("아직 저장하지 않음");
  const [error, setError] = useState("");
  const [confirmNew, setConfirmNew] = useState(false);
  const [help, setHelp] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (confirmNew) dialog.current?.showModal();
    else dialog.current?.close();
  }, [confirmNew]);
  const dirty = JSON.stringify(state.draft) !== JSON.stringify(snapshot);
  useEffect(() => {
    const restore = setTimeout(() => {
      try {
        if (!projectId) return;
        const project = readProject(projectId);
        if (!project || project.kind !== "input") throw new Error();
        const record = project.payload as {
          draft: unknown;
          document?: unknown;
          assets: StudioAsset[];
        };
        const draft = draftSchema.parse(record.draft);
        const list = importedAssetsSchema.parse(record.assets);
        if (!record.document) parseContract(buildPreview(draft), list);
        if (record.document)
          setRestoredDocument(parseContract(record.document, list));
        dispatch({ type: "load", draft });
        setSnapshot(draft);
        setAssets(list);
        setStep(
          project.status === "result" || project.status === "published"
            ? "result"
            : "editing",
        );
        setSaved("이 브라우저에 저장됨");
      } catch {
        setError(
          "저장된 초안을 복원하지 못했습니다. 새 초안을 만들 수 있습니다.",
        );
      }
    }, 0);
    return () => {
      clearTimeout(restore);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [projectId]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function generate(draft: StudioDraft, list: StudioAsset[]) {
    const generatedId = crypto.randomUUID();
    setActiveId(generatedId);
    setBusy(true);
    setError("");
    timer.current = setTimeout(() => {
      dispatch({ type: "load", draft });
      setSnapshot(draft);
      setAssets(list);
      try {
        parseContract(buildPreview(draft), list);
        saveProject({
          id: generatedId,
          title: draft.product_name,
          kind: "input",
          status: "draft",
          thumbnail: list[0]?.url ?? "",
          updatedAt: new Date().toISOString(),
          payload: { draft, assets: list },
        });
        window.history.replaceState(
          null,
          "",
          `/seller/products/new?project=${encodeURIComponent(generatedId)}`,
        );
        setSaved("이 브라우저에 저장됨");
      } catch {
        setSaved("아직 저장하지 않음");
        setError(
          "초안을 자동 저장하지 못했습니다. 편집 내용은 유지됩니다. 브라우저 저장 공간을 확인해 주세요.",
        );
      }
      setStep("editing");
      setBusy(false);
    }, 1800);
  }
  function save(status: "draft" | "result" = "draft") {
    try {
      const draft = draftSchema.parse(state.draft);
      parseContract(buildPreview(draft), assets);
      const id = activeId || crypto.randomUUID();
      saveProject({
        id,
        title: draft.product_name,
        kind: "input",
        status,
        thumbnail: assets[0]?.url ?? "",
        updatedAt: new Date().toISOString(),
        payload: { draft, assets },
      });
      setActiveId(id);
      window.history.replaceState(
        null,
        "",
        `/seller/products/new?project=${encodeURIComponent(id)}`,
      );
      setSnapshot(draft);
      setSaved("이 브라우저에 저장됨");
      setError("");
      return true;
    } catch {
      setError(
        "초안을 저장하지 못했습니다. 필수 문구·이미지 참조 또는 브라우저 저장 공간을 확인해 주세요. 편집 내용은 유지됩니다.",
      );
      return false;
    }
  }
  if (step !== "input" && !busy)
    return (
      <ConvertedPreview
        editable
        projectId={activeId}
        initialReview={step === "result"}
        inputData={{
          document: restoredDocument ?? buildPreview(state.draft),
          assets,
          draft: state.draft,
        }}
      />
    );
  const current = busy ? 1 : 0;
  return (
    <main
      className="cs-shell"
      onClickCapture={(event) => {
        if (
          (event.target as HTMLElement).closest('a[href="/"]') &&
          (dirty || saved === "아직 저장하지 않음") &&
          !save("draft")
        ) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      <StudioHeader>
        <Button
          size="xs"
          variant="ghost"
          className="text-font-white"
          onClick={() => setHelp(!help)}
        >
          이용 안내
        </Button>
      </StudioHeader>
      <div className="cs-body">
        <div className="cs-breadcrumb">
          <Breadcrumb>
            <BreadcrumbItem href="/">홈</BreadcrumbItem>
            <BreadcrumbItem>판매자 스튜디오</BreadcrumbItem>
            <BreadcrumbItem current>AI 상세페이지 제작</BreadcrumbItem>
          </Breadcrumb>
        </div>
        <div className="cs-page-title">
          <div>
            <span className="cs-overline">AI DETAIL PAGE STUDIO</span>
            <h1>
              {busy
                ? "작품의 이야기를 구성하고 있어요."
                : step === "input"
                  ? "작품의 이야기를, 상세페이지로."
                  : step === "editing"
                    ? "작품의 이야기에 나의 손길을 더해요."
                    : "작품의 이야기가 준비되었어요."}
            </h1>
            <p>
              {step === "input"
                ? "사진과 이야기를 더하면, AI가 작품에 어울리는 첫 페이지를 제안해요."
                : step === "editing"
                  ? "문구와 구성을 다듬고, 작품의 매력이 온전히 전해지는지 확인하세요."
                  : "완성한 상세페이지를 확인하고, 저장과 게시를 준비하세요."}
            </p>
          </div>
          {step !== "input" && (
            <Button
              size="s"
              variant="outline"
              className="cs-button"
              onClick={() => setConfirmNew(true)}
            >
              새 작품으로 시작
            </Button>
          )}
        </div>
        <StudioSteps current={current} />
        {help && (
          <div className="cs-help">
            <strong>
              작품 정보 입력 → 생성 중 → 초안 확인·편집 → 최종 결과 확인
            </strong>
            <p>
              이 화면은 연동 전 체험용입니다. 입력한 문구로 예시 초안을 구성하며
              실제 AI 분석은 수행하지 않습니다. 초안은 현재 브라우저에 저장되고,
              서버 저장·상품 게시에는 상품 서비스 연결이 필요합니다.
            </p>
            <Button size="s" variant="ghost" onClick={() => setHelp(false)}>
              안내 닫기
            </Button>
          </div>
        )}
        {error && (
          <div className="cs-error" role="alert">
            {error}
            <button type="button" onClick={() => setError("")}>
              닫기
            </button>
          </div>
        )}
        {busy && (
          <div className="cs-generating" role="status">
            <span className="cs-spinner" />
            <strong>작품의 이야기를 구성하고 있어요.</strong>
            <p>입력한 문구와 사진을 바탕으로 초안을 준비합니다.</p>
            <ol>
              <li>작품 정보와 사진 확인</li>
              <li>페이지 구성과 문구 준비</li>
              <li>편집할 초안 불러오기</li>
            </ol>
            <small>
              프로토타입에서는 입력한 내용으로 예시 초안을 구성합니다.
            </small>
          </div>
        )}
        {step === "input" && !busy && (
          <StudioInput
            busy={busy}
            onExample={() =>
              router.push(
                "/seller/products/new?sample=metal&project=sample-metal",
              )
            }
            onGenerate={generate}
            onImport={(document, list, title) => {
              const id = crypto.randomUUID();
              const draft = { ...exampleDraft, product_name: title };
              // 생성 대기 없이 검증된 AI 결과를 기존 편집기에 전달한다.
              setActiveId(id);
              setRestoredDocument(document);
              setAssets(list);
              dispatch({ type: "load", draft });
              setSnapshot(draft);
              try {
                saveProject({
                  id,
                  title,
                  kind: "input",
                  status: "draft",
                  thumbnail: list[0]?.url ?? "",
                  updatedAt: new Date().toISOString(),
                  payload: { draft, document, assets: list },
                });
                window.history.replaceState(
                  null,
                  "",
                  `/seller/products/new?project=${encodeURIComponent(id)}`,
                );
              } catch {
                throw new Error(
                  "브라우저에 저장하지 못했습니다. 저장 공간을 확인한 뒤 다시 시도해 주세요.",
                );
              }
              setStep("editing");
            }}
          />
        )}
        <footer className="cs-footer">
          <span>
            MIDAM <i>작품의 내력을, 일상의 가치로.</i>
          </span>
          <span>
            데모 모드 · 실제 AI 생성 및 게시 기능은 연동 준비 중입니다.
          </span>
        </footer>
      </div>
      <dialog
        ref={dialog}
        className="cs-native-dialog"
        onCancel={() => setConfirmNew(false)}
        aria-labelledby="cs-new-title"
      >
        <section className="cs-modal" aria-labelledby="cs-new-title">
          <h2 id="cs-new-title">새 작품으로 시작할까요?</h2>
          <p>
            현재 초안을 브라우저에 저장하고 시작하거나, 저장하지 않고 새 작품을
            입력할 수 있어요.
          </p>
          <div>
            <Button
              size="s"
              className="cs-button cs-primary"
              onClick={() => {
                if (save()) {
                  setConfirmNew(false);
                  router.push("/seller/products/new");
                  setActiveId("");
                  setStep("input");
                }
              }}
            >
              저장 후 시작
            </Button>
            <Button
              size="s"
              className="cs-button"
              variant="outline"
              onClick={() => {
                setConfirmNew(false);
                router.push("/seller/products/new");
                setActiveId("");
                setStep("input");
              }}
            >
              저장하지 않고 시작
            </Button>
            <Button
              size="s"
              variant="ghost"
              onClick={() => setConfirmNew(false)}
            >
              취소
            </Button>
          </div>
        </section>
      </dialog>
    </main>
  );
}

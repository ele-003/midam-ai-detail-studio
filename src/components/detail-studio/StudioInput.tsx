"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import {
  PlusIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
} from "@/components/ui/icons";
import { TextareaField } from "./TextareaField";
import type {
  ContractDocument,
  StudioAsset,
  StudioDraft,
} from "./studio-contract";
import { TestJsonImport } from "./TestJsonImport";
import { exampleDraft } from "./studio-fixture";

interface StudioInputProps {
  busy: boolean;
  onExample: () => void;
  onGenerate: (draft: StudioDraft, assets: StudioAsset[]) => void;
  onImport: (
    document: ContractDocument,
    assets: StudioAsset[],
    title: string,
  ) => void;
}
export function StudioInput({
  busy,
  onExample,
  onGenerate,
  onImport,
}: StudioInputProps) {
  const [name, setName] = useState("");
  const [making, setMaking] = useState("");
  const [care, setCare] = useState("");
  const [assets, setAssets] = useState<StudioAsset[]>([]);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const totalBytes = useRef(0);
  const assetBytes = useRef(new Map<string, number>());
  async function upload(files: FileList | null) {
    if (!files?.length || uploading || busy) return;
    const list = Array.from(files);
    if (
      list.length + assets.length > 12 ||
      list.some((item) => item.size > 10 * 1024 * 1024) ||
      totalBytes.current + list.reduce((sum, item) => sum + item.size, 0) >
        120 * 1024 * 1024
    ) {
      setError(
        "이미지는 장당 10MB, 최대 12장, 전체 120MB까지 추가할 수 있습니다.",
      );
      return;
    }
    if (
      list.some(
        (item) =>
          !["image/png", "image/jpeg", "image/webp"].includes(item.type),
      )
    ) {
      setError("JPG, PNG, WebP 이미지를 선택해 주세요.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const next = await Promise.all(
        list.map(async (item): Promise<StudioAsset> => {
          const url = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = reject;
            reader.readAsDataURL(item);
          });
          const bitmap = await createImageBitmap(item);
          const { width, height } = bitmap;
          bitmap.close();
          if (!width || !height || width > 20000 || height > 20000)
            throw new Error("이미지 해상도를 확인해 주세요.");
          return {
            imageId: `upload-${crypto.randomUUID()}`,
            url,
            width,
            height,
            alt: item.name,
            asset_mode: "source",
            product_generated: false,
            fidelity_status: "FALLBACK",
          };
        }),
      );
      setAssets((current) => [...current, ...next]);
      next.forEach((asset, index) =>
        assetBytes.current.set(asset.imageId, list[index].size),
      );
      totalBytes.current += list.reduce((sum, item) => sum + item.size, 0);
    } catch {
      setError(
        "이미지를 읽지 못했습니다. 파일이 손상되지 않았는지 확인해 주세요.",
      );
    } finally {
      setUploading(false);
    }
  }
  function submit() {
    if (!assets.length || !name.trim() || !making.trim()) {
      setError("대표 이미지, 작품명, 제작 과정을 입력해 주세요.");
      return;
    }
    const page_plan = exampleDraft.page_plan
      .filter((section) =>
        ["hero", "story", "care"].includes(section.section_id),
      )
      .map((section) => ({
        ...section,
        photo_id: section.section_id === "hero" ? assets[0].imageId : "",
        title:
          section.section_id === "hero"
            ? name.trim().slice(0, 80)
            : section.title,
        body:
          section.section_id === "care"
            ? care.trim() || "제작자가 확인한 관리 방법을 입력해 주세요."
            : making.trim(),
      }));
    onGenerate(
      {
        ...exampleDraft,
        product_name: name.trim(),
        summary: making.trim(),
        hero_headline: name.trim().slice(0, 80),
        hero_description: making.trim(),
        product_type: null,
        keywords: [],
        page_plan: [
          ...page_plan.slice(0, 2),
          ...assets.slice(1).map((asset, index) => ({
            ...exampleDraft.page_plan[2],
            section_id: `photo-${index + 1}`,
            title: `작품 사진 ${index + 2}`,
            body: "사진에 담긴 작품의 특징을 설명해 주세요.",
            photo_id: asset.imageId,
          })),
          page_plan[2],
        ],
      },
      assets,
    );
  }
  return (
    <div className="cs-input-layout">
      <form
        className="cs-input-form"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <fieldset disabled={busy || uploading}>
          <div className="cs-form-heading">
            <div>
              <span className="cs-overline">01 / PRODUCT INFORMATION</span>
              <h2>어떤 작품을 소개할까요?</h2>
            </div>
            <span className="cs-required-note">
              <b>*</b> 필수 입력
            </span>
          </div>
          <div className="cs-field-label">
            작품 이미지 <b>*</b>
            <span>첫 번째 이미지가 대표 이미지로 사용됩니다.</span>
          </div>
          <div
            className={`cs-upload ${dragging ? "is-dragging" : ""}`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              void upload(event.dataTransfer.files);
            }}
          >
            <input
              ref={file}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              aria-label="작품 이미지 업로드"
              onChange={(event) => {
                void upload(event.target.files);
                event.target.value = "";
              }}
              className="sr-only"
            />
            <span className="cs-upload-symbol" aria-hidden="true">
              <PlusIcon className="size-7" />
            </span>
            <strong>
              {uploading
                ? "이미지를 준비하고 있어요"
                : "작품 사진을 이곳에 놓아주세요"}
            </strong>
            <p>작품의 형태와 디테일이 잘 보이는 사진을 추천해요.</p>
            <Button
              size="s"
              type="button"
              variant="outline"
              className="cs-button"
              onClick={() => file.current?.click()}
            >
              이미지 선택
            </Button>
            <small>JPG, PNG, WebP · 장당 최대 10MB · 최대 12장</small>
          </div>
          {assets.length > 0 && (
            <div className="cs-uploaded">
              {assets.map((asset, index) => (
                <div key={asset.imageId}>
                  <Image
                    src={asset.url}
                    width={72}
                    height={72}
                    alt={asset.alt}
                    unoptimized
                  />
                  <span>{index === 0 ? "대표" : index + 1}</span>
                  <button
                    type="button"
                    aria-label={`${index + 1}번 이미지 삭제`}
                    onClick={() => {
                      totalBytes.current -=
                        assetBytes.current.get(asset.imageId) ?? 0;
                      assetBytes.current.delete(asset.imageId);
                      setAssets((current) =>
                        current.filter(
                          (item) => item.imageId !== asset.imageId,
                        ),
                      );
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="cs-fields">
            <InputField
              label={
                <>
                  작품명 <b className="text-red-font">*</b>
                </>
              }
              aria-required="true"
              value={name}
              onValueChange={setName}
              maxLength={120}
              placeholder="예: 시간을 담은 금속 다기"
              helperText={name.length + " / 120"}
            />
            <TextareaField
              label={
                <>
                  제작 과정 · 작품 설명 <b className="text-red-font">*</b>
                </>
              }
              aria-required="true"
              rows={4}
              maxLength={300}
              value={making}
              onChange={(event) => setMaking(event.target.value)}
              placeholder="어떤 재료와 기법으로 만들었나요? 작품에 담긴 이야기와 특별한 점을 알려주세요."
              helperText={making.length + " / 300"}
            />
            <TextareaField
              label={
                <>
                  사용 · 보관 · 관리 방법 <span>선택</span>
                </>
              }
              rows={2}
              maxLength={300}
              value={care}
              onChange={(event) => setCare(event.target.value)}
              placeholder="작품을 오래 사용할 수 있는 관리 방법을 알려주세요."
              helperText={care.length + " / 300"}
            />
          </div>
          {error && (
            <p className="cs-error" role="alert">
              {error}
            </p>
          )}
          <div className="cs-form-bottom">
            <p>
              입력한 정보를 바탕으로 초안을 구성해요.
              <br />
              완성 전, 문구와 구성을 직접 수정할 수 있어요.
            </p>
            <Button size="s" type="submit" className="cs-button cs-primary">
              {busy ? "초안 구성 중…" : "AI 초안 만들기"}
              <ArrowRightIcon
                aria-hidden="true"
                className="[&_path]:fill-current"
              />
            </Button>
          </div>
          <TestJsonImport
            assets={assets}
            onImport={(document, list) =>
              onImport(document, list, name.trim() || "JSON 테스트 작품")
            }
          />
        </fieldset>
      </form>
      <aside className="cs-inspiration">
        <div className="cs-inspiration-heading">
          <span className="cs-overline">YOUR CRAFT, YOUR STORY</span>
          <h2>
            만드는 데 쏟은 정성,
            <br />
            전하는 데에도 고스란히.
          </h2>
          <p>
            사진과 짧은 이야기로 시작하세요.
            <br />
            작품의 매력이 담긴 페이지를 함께 완성해요.
          </p>
        </div>
        <div className="cs-example-cover">
          <div>
            <span>MIDAM COLLECTION</span>
            <h3>
              차 한 잔에 담긴
              <br />
              시간과 손길
            </h3>
          </div>
          <Image
            src="/studio/asset-1.png"
            width={1200}
            height={1200}
            alt="상세페이지 예시 · 금속 다기 작품"
            priority
          />
          <span className="cs-example-caption">금속공예 · 다기 컬렉션</span>
        </div>
        <div className="cs-example-action">
          <span>처음이라면, 먼저 살펴보세요.</span>
          <Button
            size="s"
            type="button"
            variant="ghost"
            disabled={busy || uploading}
            onClick={onExample}
          >
            예시 작품으로 체험하기 <ArrowUpRightIcon aria-hidden="true" />
          </Button>
        </div>
        <ol className="cs-tips">
          <li>
            <span>01</span>
            <div>
              <strong>작품에 집중한 구성</strong>
              <p>소개부터 디테일, 관리 안내까지 한 번에</p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <strong>마지막은 나의 손길로</strong>
              <p>문구와 구성을 확인하고 자유롭게 다듬기</p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <strong>게시 전 한 번 더 확인</strong>
              <p>최종 상세페이지와 저장 상태를 꼼꼼하게</p>
            </div>
          </li>
        </ol>
      </aside>
    </div>
  );
}

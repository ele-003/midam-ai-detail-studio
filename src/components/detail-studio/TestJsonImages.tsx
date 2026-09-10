"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import type { StudioAsset } from "./studio-contract";
import { prepareTestJsonImage } from "./test-json-image";

interface TestJsonImagesProps {
  assets: StudioAsset[];
  disabled: boolean;
  onChange: (assets: StudioAsset[]) => void;
  onBusyChange: (busy: boolean) => void;
}

export function TestJsonImages({
  assets,
  disabled,
  onChange,
  onBusyChange,
}: TestJsonImagesProps) {
  const file = useRef<HTMLInputElement>(null);
  const pending = useRef(false);
  const [imageId, setImageId] = useState("sample-product");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const isReplacing = assets.some((asset) => asset.imageId === imageId.trim());

  async function handleUpload(selected: File | undefined) {
    if (!selected || pending.current) return;
    setError("");
    setStatus("");
    if (assets.length >= 12 && !isReplacing) {
      setError("테스트 이미지는 최대 12개 ID에 연결할 수 있습니다.");
      return;
    }
    pending.current = true;
    setIsUploading(true);
    onBusyChange(true);
    try {
      const asset = await prepareTestJsonImage(selected, imageId);
      const next = [
        ...assets.filter((item) => item.imageId !== asset.imageId),
        asset,
      ];
      if (
        next.reduce((sum, item) => sum + item.url.length, 0) >
        2 * 1024 * 1024
      )
        throw new Error(
          "연결한 이미지의 전체 용량이 큽니다. 일부 이미지를 삭제한 뒤 다시 올려 주세요.",
        );
      onChange(next);
      setStatus(
        `${asset.imageId}에 연결했습니다. JSON을 불러오면 이 사진을 사용합니다.`,
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "이미지를 읽지 못했습니다.",
      );
    } finally {
      pending.current = false;
      setIsUploading(false);
      onBusyChange(false);
    }
  }

  return (
    <fieldset
      className="cs-test-json-images"
      disabled={disabled || isUploading}
    >
      <legend>JSON에 사용할 이미지</legend>
      <p>JSON의 imageId와 사진을 연결하세요. 파일명은 달라도 됩니다.</p>
      <div className="cs-test-image-controls">
        <InputField
          label="연결할 이미지 ID"
          value={imageId}
          maxLength={80}
          onValueChange={setImageId}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.preventDefault();
          }}
          placeholder="예: sample-product"
        />
        <Button
          size="s"
          type="button"
          variant="outline"
          disabled={!imageId.trim()}
          onClick={() => file.current?.click()}
        >
          {isUploading
            ? "이미지 준비 중…"
            : isReplacing
              ? "이미지 교체"
              : "이미지 업로드"}
        </Button>
      </div>
      <input
        ref={file}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        aria-label="JSON에 연결할 이미지 파일"
        onChange={(event) => {
          const selected = event.target.files?.[0];
          event.target.value = "";
          void handleUpload(selected);
        }}
      />
      <small>
        JPG·PNG·WebP, 장당 10MB · 미리보기용 사본을 최대 1600px로 줄여 현재
        브라우저에 보관합니다. 같은 ID는 사진 한 장으로 모두 연결됩니다.
      </small>
      {assets.length > 0 && (
        <ul className="cs-test-image-list" aria-label="연결한 이미지 목록">
          {assets.map((asset) => (
            <li key={asset.imageId}>
              <Image
                src={asset.url}
                alt={`${asset.imageId} 연결 이미지`}
                width={56}
                height={56}
                unoptimized
              />
              <div>
                <strong>{asset.imageId}</strong>
                <span>{asset.alt}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                aria-label={`${asset.imageId} 연결 삭제`}
                onClick={() => {
                  onChange(
                    assets.filter((item) => item.imageId !== asset.imageId),
                  );
                  setError("");
                  setStatus(`${asset.imageId} 연결을 삭제했습니다.`);
                }}
              >
                삭제
              </Button>
            </li>
          ))}
        </ul>
      )}
      {isUploading && <p role="status">이미지를 준비하고 있습니다.</p>}
      {status && <p role="status">{status}</p>}
      {error && (
        <p role="alert" className="cs-error">
          {error}
        </p>
      )}
    </fieldset>
  );
}

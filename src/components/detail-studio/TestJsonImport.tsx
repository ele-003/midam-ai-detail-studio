"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { TextareaField } from "./TextareaField";
import type { ContractDocument, StudioAsset } from "./studio-contract";
import {
  describeTestJsonError,
  parseTestJson,
  TEST_JSON_MAX_BYTES,
} from "./test-json-import";

interface TestJsonImportProps {
  assets: StudioAsset[];
  onImport: (document: ContractDocument, assets: StudioAsset[]) => void;
}
export function TestJsonImport({ assets, onImport }: TestJsonImportProps) {
  const file = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  const [open, setOpen] = useState(false);
  function load(value: string) {
    setError("");
    try {
      const result = parseTestJson(value, assets);
      onImport(result.document, result.assets);
      dialog.current?.close();
    } catch (cause) {
      setError(describeTestJsonError(cause));
    }
  }
  return (
    <section className="cs-test-json" aria-label="테스트용 JSON 가져오기">
      <strong>테스트용 · AI 결과 직접 불러오기</strong>
      <p>작품 정보 입력 없이 JSON으로 초안 편집을 테스트합니다.</p>
      <div className="cs-test-json-actions">
        <Button
          size="s"
          type="button"
          variant="outline"
          disabled={reading}
          onClick={() => file.current?.click()}
        >
          JSON 파일 넣기
        </Button>
        <Button
          size="s"
          type="button"
          variant="outline"
          disabled={reading}
          onClick={() => {
            setError("");
            setOpen(true);
            dialog.current?.showModal();
          }}
        >
          JSON 텍스트 넣기
        </Button>
      </div>
      <input
        ref={file}
        className="sr-only"
        aria-label="테스트 JSON 파일"
        type="file"
        accept=".json,application/json"
        onChange={async (event) => {
          const selected = event.target.files?.[0];
          event.target.value = "";
          if (!selected) return;
          if (selected.size > TEST_JSON_MAX_BYTES) {
            setError("JSON은 최대 5MB까지 입력할 수 있습니다.");
            return;
          }
          setReading(true);
          try {
            load(await selected.text());
          } catch {
            setError("파일을 읽지 못했습니다. 다시 선택해 주세요.");
          } finally {
            setReading(false);
          }
        }}
      />
      {reading && <p role="status">JSON을 읽고 있습니다.</p>}
      {error && !open && (
        <p role="alert" className="cs-error">
          {error}
        </p>
      )}
      <dialog
        ref={dialog}
        className="cs-native-dialog cs-json-dialog"
        aria-labelledby="cs-json-title"
        onClose={() => setOpen(false)}
        onCancel={() => setError("")}
      >
        <section className="cs-modal">
          <h2 id="cs-json-title">테스트 JSON 입력</h2>
          <p>
            문서 JSON 또는 {"{ document, assets }"} 묶음을 붙여넣으세요. 문서만
            입력하면 위에서 업로드한 이미지의 imageId를 참조합니다. 최대 5MB.
            테스트 ID sample-product는 제공된 나전 보관함 이미지에 자동
            연결됩니다.
          </p>
          <TextareaField
            label="JSON 결과값"
            className="cs-json-textarea"
            rows={14}
            value={text}
            onChange={(event) => setText(event.target.value)}
            spellCheck={false}
            placeholder={
              '{ "schemaVersion": "2.0", "canvasWidth": 774, "root": [...] }'
            }
          />
          {error && (
            <p role="alert" className="cs-error">
              {error}
            </p>
          )}
          <div>
            <Button
              size="s"
              type="button"
              className="cs-primary"
              disabled={!text.trim()}
              onClick={() => load(text)}
            >
              초안 편집으로 불러오기
            </Button>
            <Button
              size="s"
              type="button"
              variant="outline"
              onClick={() => {
                dialog.current?.close();
                setError("");
              }}
            >
              취소
            </Button>
          </div>
        </section>
      </dialog>
    </section>
  );
}
